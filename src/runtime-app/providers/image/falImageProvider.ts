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
import type { ImageGenerationProvider, ImageGenerationRequest, ImageGenerationResult } from './imageProviderTypes.js'

const FAL_DEFAULT_MODEL = 'fal-ai/fast-sdxl'
const FAL_DEFAULT_TIMEOUT_MS = 120_000
const FAL_DEFAULT_RETRY_LIMIT = 2
const FAL_DEFAULT_POLL_INTERVAL_MS = 1_000

type FalQueueStatus =
  | 'IN_QUEUE'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLATION_REQUESTED'
  | 'ALREADY_COMPLETED'

export type FalImageProviderOptions = {
  apiKey: string
  model: string
  timeoutMs: number
  retryLimit: number
  pollIntervalMs: number
  fetchFn?: FetchLike
  sleep?: (ms: number) => Promise<void>
}

export function createFalImageProviderOptionsFromEnv(): FalImageProviderOptions {
  return {
    apiKey: readRequiredEnv('FAL_API_KEY'),
    model: readOptionalEnv('FAL_IMAGE_MODEL') ?? FAL_DEFAULT_MODEL,
    timeoutMs: readNumberEnv('FAL_IMAGE_TIMEOUT_MS', FAL_DEFAULT_TIMEOUT_MS),
    retryLimit: readNumberEnv('FAL_IMAGE_RETRY_LIMIT', FAL_DEFAULT_RETRY_LIMIT),
    pollIntervalMs: readNumberEnv('FAL_IMAGE_POLL_INTERVAL_MS', FAL_DEFAULT_POLL_INTERVAL_MS),
  }
}

export class FalImageProvider implements ImageGenerationProvider {
  private readonly fetchFn: FetchLike
  private readonly sleep: (ms: number) => Promise<void>

  constructor(private readonly options: FalImageProviderOptions) {
    this.fetchFn = options.fetchFn ?? fetch
    this.sleep = options.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms)))
  }

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const startedAt = Date.now()

    const { value, attempts } = await withRetry(
      async ({ attempt }) => {
        const requestId = await this.submitRequest(request, attempt)

        try {
          const assetUrl = await this.waitForCompletion(requestId)
          const artifact = await downloadBinaryArtifact(this.fetchFn, assetUrl, this.options.timeoutMs)
          return { artifact, requestId }
        } catch (error) {
          await this.cancelRequest(requestId)
          throw error
        }
      },
      {
        provider: 'fal',
        retryLimit: this.options.retryLimit,
        sleep: this.options.sleep,
      },
    )

    return {
      provider: 'fal',
      model: request.model ?? this.options.model,
      seed: request.seed ?? null,
      artifact: value.artifact,
      latencyMs: Date.now() - startedAt,
      attempts,
      requestId: value.requestId,
    }
  }

  private async submitRequest(request: ImageGenerationRequest, attempt: number): Promise<string> {
    try {
      const model = request.model ?? this.options.model
      const response = await fetchWithTimeout(
        this.fetchFn,
        `https://queue.fal.run/${model}`,
        {
          method: 'POST',
          headers: {
            authorization: `Key ${this.options.apiKey}`,
            'content-type': 'application/json',
            'x-fal-request-timeout': String(Math.max(1, Math.floor(this.options.timeoutMs / 1_000))),
          },
          body: JSON.stringify({
            prompt: request.prompt,
            negative_prompt: request.negativePrompt,
            image_size: {
              width: request.size.width,
              height: request.size.height,
            },
            width: request.size.width,
            height: request.size.height,
            num_inference_steps: request.steps,
            seed: request.seed,
            format: request.format ?? 'png',
          }),
        },
        this.options.timeoutMs,
      )

      if (!response.ok) {
        throw createHttpError({
          provider: 'fal',
          status: response.status,
          attempt,
          authMessage: `fal: invalid API key or model access denied (HTTP ${response.status}).`,
          rateLimitMessage: 'fal: rate limit or quota exceeded.',
          failureMessage: `fal: generation request failed with HTTP ${response.status}.`,
        })
      }

      const payload = await response.json() as {
        request_id?: string
        response_url?: string
      }
      const requestId = payload.request_id ?? extractRequestId(payload.response_url)
      if (!requestId) {
        throw new MediaProviderError({
          provider: 'fal',
          code: 'response_invalid',
          message: 'fal: queue response did not include a request id.',
          status: response.status,
          attempt,
          retryable: false,
        })
      }

      return requestId
    } catch (error) {
      throw normalizeUnknownError(error, 'fal', attempt, this.options.timeoutMs)
    }
  }

  private async waitForCompletion(requestId: string): Promise<string> {
    const startedAt = Date.now()
    const model = this.options.model

    while (Date.now() - startedAt < this.options.timeoutMs) {
      const response = await fetchWithTimeout(
        this.fetchFn,
        `https://queue.fal.run/${model}/requests/${requestId}/status`,
        {
          method: 'GET',
          headers: { authorization: `Key ${this.options.apiKey}` },
        },
        this.options.timeoutMs,
      )

      const payload = await response.json() as {
        status?: FalQueueStatus
      }

      if (payload.status === 'COMPLETED') {
        const resultResponse = await fetchWithTimeout(
          this.fetchFn,
          `https://queue.fal.run/${model}/requests/${requestId}`,
          {
            method: 'GET',
            headers: { authorization: `Key ${this.options.apiKey}` },
          },
          this.options.timeoutMs,
        )

        if (!resultResponse.ok) {
          throw createHttpError({
            provider: 'fal',
            status: resultResponse.status,
            attempt: 1,
            authMessage: 'fal: failed to retrieve generated image because authorization was rejected.',
            rateLimitMessage: 'fal: rate limit triggered while retrieving the generated image.',
            failureMessage: `fal: failed to retrieve generation output (HTTP ${resultResponse.status}).`,
          })
        }

        const resultPayload = await resultResponse.json() as {
          response?: {
            images?: Array<{ url?: string }>
            image?: { url?: string }
          }
        }
        const assetUrl = resultPayload.response?.images?.[0]?.url ?? resultPayload.response?.image?.url
        if (!assetUrl) {
          throw new MediaProviderError({
            provider: 'fal',
            code: 'response_invalid',
            message: 'fal: completed response did not include an image URL.',
            status: resultResponse.status,
            attempt: 1,
            retryable: false,
          })
        }

        return assetUrl
      }

      if (payload.status === 'FAILED') {
        throw new MediaProviderError({
          provider: 'fal',
          code: 'generation_failed',
          message: 'fal: image generation failed.',
          status: response.status,
          attempt: 1,
          retryable: false,
        })
      }

      await this.sleep(this.options.pollIntervalMs)
    }

    throw new MediaProviderError({
      provider: 'fal',
      code: 'timeout',
      message: `fal: image generation timed out after ${this.options.timeoutMs}ms.`,
      status: null,
      attempt: 1,
      retryable: true,
    })
  }

  private async cancelRequest(requestId: string): Promise<void> {
    const model = this.options.model
    try {
      await fetchWithTimeout(
        this.fetchFn,
        `https://queue.fal.run/${model}/requests/${requestId}/cancel`,
        {
          method: 'PUT',
          headers: { authorization: `Key ${this.options.apiKey}` },
        },
        Math.min(this.options.timeoutMs, 5_000),
      )
    } catch {
      // Best effort cleanup only.
    }
  }
}

function extractRequestId(responseUrl?: string): string | undefined {
  if (!responseUrl) {
    return undefined
  }

  const match = responseUrl.match(/requests\/([^/]+)/)
  return match?.[1]
}
