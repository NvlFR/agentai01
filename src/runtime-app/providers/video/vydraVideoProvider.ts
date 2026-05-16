import {
  type FetchLike,
  MediaProviderError,
  createHttpError,
  downloadBinaryArtifact,
  fetchWithTimeout,
  normalizeUnknownError,
  readNumberEnv,
  readOptionalEnv,
  readRequiredEnv,
  withRetry,
} from '../tts/shared/providerCommon.js'
import type {
  VideoGenerationHandle,
  VideoGenerationProvider,
  VideoGenerationRequest,
  VideoGenerationResult,
} from './videoProviderTypes.js'

const VYDRA_BASE_URL = 'https://vydra.ai/api/v1'
const VYDRA_DEFAULT_MODEL = 'veo3'
const VYDRA_DEFAULT_TIMEOUT_MS = 180_000
const VYDRA_DEFAULT_RETRY_LIMIT = 1
const VYDRA_DEFAULT_POLL_INTERVAL_MS = 2_000

type VydraJobPayload = {
  id?: string
  jobId?: string
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  result?: {
    videoUrl?: string
  }
}

export type VydraVideoProviderOptions = {
  apiKey: string
  model: string
  timeoutMs: number
  retryLimit: number
  pollIntervalMs: number
  fetchFn?: FetchLike
  sleep?: (ms: number) => Promise<void>
}

export function createVydraVideoProviderOptionsFromEnv(): VydraVideoProviderOptions {
  return {
    apiKey: readRequiredEnv('VYDRA_API_KEY'),
    model: readOptionalEnv('VYDRA_VIDEO_MODEL') ?? VYDRA_DEFAULT_MODEL,
    timeoutMs: readNumberEnv('VYDRA_VIDEO_TIMEOUT_MS', VYDRA_DEFAULT_TIMEOUT_MS),
    retryLimit: readNumberEnv('VYDRA_VIDEO_RETRY_LIMIT', VYDRA_DEFAULT_RETRY_LIMIT),
    pollIntervalMs: readNumberEnv('VYDRA_VIDEO_POLL_INTERVAL_MS', VYDRA_DEFAULT_POLL_INTERVAL_MS),
  }
}

export class VydraVideoProvider implements VideoGenerationProvider {
  private readonly fetchFn: FetchLike
  private readonly sleep: (ms: number) => Promise<void>
  private readonly handles = new Map<string, VideoGenerationHandle>()

  constructor(private readonly options: VydraVideoProviderOptions) {
    this.fetchFn = options.fetchFn ?? fetch
    this.sleep = options.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms)))
  }

  async submitGeneration(request: VideoGenerationRequest): Promise<VideoGenerationHandle> {
    try {
      const response = await fetchWithTimeout(
        this.fetchFn,
        `${VYDRA_BASE_URL}/jobs`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${this.options.apiKey}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            workflow: 'generate_video',
            input: {
              prompt: request.prompt,
              model: request.model ?? this.options.model,
              duration: request.durationSeconds,
              resolution: request.resolution,
              format: request.outputFormat ?? 'mp4',
              imageUrl: request.promptImageUrl,
            },
          }),
        },
        this.options.timeoutMs,
      )

      if (!response.ok) {
        throw createHttpError({
          provider: 'vydra',
          status: response.status,
          attempt: 1,
          authMessage: `vydra: invalid API key or billing access denied (HTTP ${response.status}).`,
          rateLimitMessage: 'vydra: rate limit or credits exhausted.',
          failureMessage: `vydra: failed to submit generation job (HTTP ${response.status}).`,
        })
      }

      const payload = await response.json() as VydraJobPayload
      const jobId = payload.id ?? payload.jobId
      if (!jobId) {
        throw new MediaProviderError({
          provider: 'vydra',
          code: 'response_invalid',
          message: 'vydra: submit response did not include a job id.',
          status: response.status,
          attempt: 1,
          retryable: false,
        })
      }

      const handle: VideoGenerationHandle = {
        provider: 'vydra',
        jobId,
        model: request.model ?? this.options.model,
        status: 'queued',
      }
      this.handles.set(jobId, handle)
      return handle
    } catch (error) {
      throw normalizeUnknownError(error, 'vydra', 1, this.options.timeoutMs)
    }
  }

  async pollGeneration(handle: VideoGenerationHandle): Promise<VideoGenerationHandle> {
    try {
      const response = await fetchWithTimeout(
        this.fetchFn,
        `${VYDRA_BASE_URL}/jobs/${encodeURIComponent(handle.jobId)}`,
        {
          method: 'GET',
          headers: { authorization: `Bearer ${this.options.apiKey}` },
        },
        this.options.timeoutMs,
      )

      if (!response.ok) {
        throw createHttpError({
          provider: 'vydra',
          status: response.status,
          attempt: 1,
          authMessage: `vydra: failed to inspect job because authorization was rejected (HTTP ${response.status}).`,
          rateLimitMessage: 'vydra: rate limit triggered while polling job status.',
          failureMessage: `vydra: failed to poll job status (HTTP ${response.status}).`,
        })
      }

      const payload = await response.json() as VydraJobPayload
      const nextHandle = {
        ...handle,
        status: mapVydraStatus(payload.status),
      }
      this.handles.set(nextHandle.jobId, nextHandle)
      if (nextHandle.status === 'failed') {
        throw new MediaProviderError({
          provider: 'vydra',
          code: 'generation_failed',
          message: 'vydra: video generation failed.',
          status: response.status,
          attempt: 1,
          retryable: false,
        })
      }

      return nextHandle
    } catch (error) {
      throw normalizeUnknownError(error, 'vydra', 1, this.options.timeoutMs)
    }
  }

  async retrieveGeneration(handle: VideoGenerationHandle): Promise<VideoGenerationResult> {
    const response = await fetchWithTimeout(
      this.fetchFn,
      `${VYDRA_BASE_URL}/jobs/${encodeURIComponent(handle.jobId)}`,
      {
        method: 'GET',
        headers: { authorization: `Bearer ${this.options.apiKey}` },
      },
      this.options.timeoutMs,
    )
    const payload = await response.json() as VydraJobPayload
    const assetUrl = payload.result?.videoUrl
    if (!assetUrl) {
      throw new MediaProviderError({
        provider: 'vydra',
        code: 'response_invalid',
        message: 'vydra: completed job did not include a video URL.',
        status: response.status,
        attempt: 1,
        retryable: false,
      })
    }

    const artifact = await downloadBinaryArtifact(this.fetchFn, assetUrl, this.options.timeoutMs)
    return {
      provider: 'vydra',
      model: handle.model,
      handle: { ...handle, status: 'completed' },
      artifact,
      attempts: 1,
      latencyMs: 0,
    }
  }

  async cleanupGeneration(handle: VideoGenerationHandle): Promise<void> {
    this.handles.delete(handle.jobId)
  }

  async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResult> {
    const startedAt = Date.now()
    const { value, attempts } = await withRetry(
      async () => {
        const handle = await this.submitGeneration(request)
        try {
          const completed = await this.waitForCompletion(handle)
          return await this.retrieveGeneration(completed)
        } catch (error) {
          await this.cleanupGeneration(handle)
          throw error
        }
      },
      {
        provider: 'vydra',
        retryLimit: this.options.retryLimit,
        sleep: this.options.sleep,
      },
    )

    return {
      ...value,
      attempts,
      latencyMs: Date.now() - startedAt,
    }
  }

  private async waitForCompletion(handle: VideoGenerationHandle): Promise<VideoGenerationHandle> {
    const startedAt = Date.now()
    let current = handle

    while (Date.now() - startedAt < this.options.timeoutMs) {
      current = await this.pollGeneration(current)
      if (current.status === 'completed') {
        return current
      }
      if (current.status === 'cancelled') {
        throw new MediaProviderError({
          provider: 'vydra',
          code: 'generation_failed',
          message: 'vydra: job was cancelled before completion.',
          status: null,
          attempt: 1,
          retryable: false,
        })
      }
      await this.sleep(this.options.pollIntervalMs)
    }

    await this.cleanupGeneration(current)
    throw new MediaProviderError({
      provider: 'vydra',
      code: 'timeout',
      message: `vydra: video generation timed out after ${this.options.timeoutMs}ms.`,
      status: null,
      attempt: 1,
      retryable: true,
    })
  }
}

function mapVydraStatus(status: VydraJobPayload['status']): VideoGenerationHandle['status'] {
  switch (status) {
    case 'completed':
      return 'completed'
    case 'failed':
      return 'failed'
    case 'cancelled':
      return 'cancelled'
    case 'running':
      return 'processing'
    default:
      return 'queued'
  }
}
