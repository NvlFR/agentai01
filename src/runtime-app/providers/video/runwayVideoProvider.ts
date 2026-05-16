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

const RUNWAY_BASE_URL = 'https://api.dev.runwayml.com/v1'
const RUNWAY_DEFAULT_MODEL = 'gen4.5'
const RUNWAY_DEFAULT_TIMEOUT_MS = 600_000
const RUNWAY_DEFAULT_RETRY_LIMIT = 1
const RUNWAY_DEFAULT_POLL_INTERVAL_MS = 5_000
const RUNWAY_VERSION = '2024-11-06'

export type RunwayVideoProviderOptions = {
  apiKey: string
  model: string
  timeoutMs: number
  retryLimit: number
  pollIntervalMs: number
  fetchFn?: FetchLike
  sleep?: (ms: number) => Promise<void>
}

type RunwayTaskPayload = {
  id?: string
  status?: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED'
  output?: string[]
  failureCode?: string | null
}

export function createRunwayVideoProviderOptionsFromEnv(): RunwayVideoProviderOptions {
  return {
    apiKey: readRequiredEnv('RUNWAY_API_KEY'),
    model: readOptionalEnv('RUNWAY_MODEL') ?? RUNWAY_DEFAULT_MODEL,
    timeoutMs: readNumberEnv('RUNWAY_VIDEO_TIMEOUT_MS', RUNWAY_DEFAULT_TIMEOUT_MS),
    retryLimit: readNumberEnv('RUNWAY_VIDEO_RETRY_LIMIT', RUNWAY_DEFAULT_RETRY_LIMIT),
    pollIntervalMs: readNumberEnv('RUNWAY_VIDEO_POLL_INTERVAL_MS', RUNWAY_DEFAULT_POLL_INTERVAL_MS),
  }
}

export class RunwayVideoProvider implements VideoGenerationProvider {
  private readonly fetchFn: FetchLike
  private readonly sleep: (ms: number) => Promise<void>
  private readonly handles = new Map<string, VideoGenerationHandle>()

  constructor(private readonly options: RunwayVideoProviderOptions) {
    this.fetchFn = options.fetchFn ?? fetch
    this.sleep = options.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms)))
  }

  async submitGeneration(request: VideoGenerationRequest): Promise<VideoGenerationHandle> {
    try {
      const response = await fetchWithTimeout(
        this.fetchFn,
        `${RUNWAY_BASE_URL}/image_to_video`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${this.options.apiKey}`,
            'content-type': 'application/json',
            'x-runway-version': RUNWAY_VERSION,
          },
          body: JSON.stringify({
            model: request.model ?? this.options.model,
            promptText: request.prompt,
            promptImage: request.promptImageUrl,
            ratio: request.resolution,
            duration: request.durationSeconds,
          }),
        },
        this.options.timeoutMs,
      )

      if (!response.ok) {
        throw createHttpError({
          provider: 'runway',
          status: response.status,
          attempt: 1,
          authMessage: `runway: invalid API key or organization access denied (HTTP ${response.status}).`,
          rateLimitMessage: 'runway: rate limit or quota exceeded.',
          failureMessage: `runway: failed to submit generation task (HTTP ${response.status}).`,
        })
      }

      const payload = await response.json() as RunwayTaskPayload
      if (!payload.id) {
        throw new MediaProviderError({
          provider: 'runway',
          code: 'response_invalid',
          message: 'runway: submit response did not include a task id.',
          status: response.status,
          attempt: 1,
          retryable: false,
        })
      }

      const handle: VideoGenerationHandle = {
        provider: 'runway',
        jobId: payload.id,
        model: request.model ?? this.options.model,
        status: 'queued',
      }
      this.handles.set(handle.jobId, handle)
      return handle
    } catch (error) {
      throw normalizeUnknownError(error, 'runway', 1, this.options.timeoutMs)
    }
  }

  async pollGeneration(handle: VideoGenerationHandle): Promise<VideoGenerationHandle> {
    try {
      const response = await fetchWithTimeout(
        this.fetchFn,
        `${RUNWAY_BASE_URL}/tasks/${encodeURIComponent(handle.jobId)}`,
        {
          method: 'GET',
          headers: {
            authorization: `Bearer ${this.options.apiKey}`,
            'x-runway-version': RUNWAY_VERSION,
          },
        },
        this.options.timeoutMs,
      )

      if (!response.ok) {
        throw createHttpError({
          provider: 'runway',
          status: response.status,
          attempt: 1,
          authMessage: `runway: failed to inspect task because authorization was rejected (HTTP ${response.status}).`,
          rateLimitMessage: 'runway: rate limit hit while polling task status.',
          failureMessage: `runway: failed to poll task status (HTTP ${response.status}).`,
        })
      }

      const payload = await response.json() as RunwayTaskPayload
      const nextStatus = mapRunwayStatus(payload.status)
      const nextHandle = { ...handle, status: nextStatus }
      this.handles.set(nextHandle.jobId, nextHandle)

      if (nextStatus === 'failed') {
        throw new MediaProviderError({
          provider: 'runway',
          code: 'generation_failed',
          message: payload.failureCode
            ? `runway: generation failed with code ${payload.failureCode}.`
            : 'runway: generation failed.',
          status: response.status,
          attempt: 1,
          retryable: false,
        })
      }

      return nextHandle
    } catch (error) {
      throw normalizeUnknownError(error, 'runway', 1, this.options.timeoutMs)
    }
  }

  async retrieveGeneration(handle: VideoGenerationHandle): Promise<VideoGenerationResult> {
    const response = await fetchWithTimeout(
      this.fetchFn,
      `${RUNWAY_BASE_URL}/tasks/${encodeURIComponent(handle.jobId)}`,
      {
        method: 'GET',
        headers: {
          authorization: `Bearer ${this.options.apiKey}`,
          'x-runway-version': RUNWAY_VERSION,
        },
      },
      this.options.timeoutMs,
    )
    const payload = await response.json() as RunwayTaskPayload
    const assetUrl = payload.output?.[0]
    if (!assetUrl) {
      throw new MediaProviderError({
        provider: 'runway',
        code: 'response_invalid',
        message: 'runway: completed task did not include an output URL.',
        status: response.status,
        attempt: 1,
        retryable: false,
      })
    }

    const artifact = await downloadBinaryArtifact(this.fetchFn, assetUrl, this.options.timeoutMs)
    return {
      provider: 'runway',
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
      async ({ attempt }) => {
        const handle = attempt === 1
          ? await this.submitGeneration(request)
          : await this.submitGeneration(request)

        try {
          const completed = await this.waitForCompletion(handle)
          const result = await this.retrieveGeneration(completed)
          return { ...result, attempts: attempt }
        } catch (error) {
          await this.cleanupGeneration(handle)
          throw error
        }
      },
      {
        provider: 'runway',
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
          provider: 'runway',
          code: 'generation_failed',
          message: 'runway: task was cancelled before completion.',
          status: null,
          attempt: 1,
          retryable: false,
        })
      }

      await this.sleep(this.options.pollIntervalMs)
    }

    await this.cleanupGeneration(current)
    throw new MediaProviderError({
      provider: 'runway',
      code: 'timeout',
      message: `runway: video generation timed out after ${this.options.timeoutMs}ms.`,
      status: null,
      attempt: 1,
      retryable: true,
    })
  }
}

function mapRunwayStatus(status: RunwayTaskPayload['status']): VideoGenerationHandle['status'] {
  switch (status) {
    case 'SUCCEEDED':
      return 'completed'
    case 'FAILED':
      return 'failed'
    case 'CANCELED':
      return 'cancelled'
    case 'RUNNING':
      return 'processing'
    default:
      return 'queued'
  }
}
