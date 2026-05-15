import {
  type FetchLike,
  MediaProviderError,
  downloadBinaryArtifact,
  fetchWithTimeout,
  normalizeUnknownError,
  readNumberEnv,
  readOptionalEnv,
  readRequiredEnv,
  withRetry,
} from '../tts/shared/providerCommon.js'
import type { ImageGenerationProvider, ImageGenerationRequest, ImageGenerationResult } from './imageProviderTypes.js'

const COMFY_DEFAULT_TIMEOUT_MS = 120_000
const COMFY_DEFAULT_RETRY_LIMIT = 1
const COMFY_DEFAULT_POLL_INTERVAL_MS = 500

export type ComfyImageProviderOptions = {
  baseUrl: string
  defaultModel: string
  timeoutMs: number
  retryLimit: number
  pollIntervalMs: number
  fetchFn?: FetchLike
  sleep?: (ms: number) => Promise<void>
}

export function createComfyImageProviderOptionsFromEnv(): ComfyImageProviderOptions {
  return {
    baseUrl: readRequiredEnv('COMFY_BASE_URL').replace(/\/$/, ''),
    defaultModel: readOptionalEnv('COMFY_MODEL') ?? 'v1-5-pruned-emaonly.safetensors',
    timeoutMs: readNumberEnv('COMFY_IMAGE_TIMEOUT_MS', COMFY_DEFAULT_TIMEOUT_MS),
    retryLimit: readNumberEnv('COMFY_IMAGE_RETRY_LIMIT', COMFY_DEFAULT_RETRY_LIMIT),
    pollIntervalMs: readNumberEnv('COMFY_IMAGE_POLL_INTERVAL_MS', COMFY_DEFAULT_POLL_INTERVAL_MS),
  }
}

export class ComfyImageProvider implements ImageGenerationProvider {
  private readonly fetchFn: FetchLike
  private readonly sleep: (ms: number) => Promise<void>

  constructor(private readonly options: ComfyImageProviderOptions) {
    this.fetchFn = options.fetchFn ?? fetch
    this.sleep = options.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms)))
  }

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const startedAt = Date.now()
    const { value, attempts } = await withRetry(
      async ({ attempt }) => {
        try {
          const workflow = buildComfyWorkflow({
            model: request.model ?? this.options.defaultModel,
            prompt: request.prompt,
            negativePrompt: request.negativePrompt ?? '',
            width: request.size.width,
            height: request.size.height,
            steps: request.steps ?? 20,
            seed: request.seed ?? 0,
          })

          const submitResponse = await fetchWithTimeout(
            this.fetchFn,
            `${this.options.baseUrl}/prompt`,
            {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ prompt: workflow }),
            },
            this.options.timeoutMs,
          )

          if (!submitResponse.ok) {
            throw new MediaProviderError({
              provider: 'comfy',
              code: submitResponse.status >= 500 ? 'provider_unavailable' : 'generation_failed',
              message: `comfy: prompt submission failed with HTTP ${submitResponse.status}.`,
              status: submitResponse.status,
              attempt,
              retryable: submitResponse.status >= 500,
            })
          }

          const submitPayload = await submitResponse.json() as { prompt_id?: string }
          const requestId = submitPayload.prompt_id
          if (!requestId) {
            throw new MediaProviderError({
              provider: 'comfy',
              code: 'response_invalid',
              message: 'comfy: prompt submission response did not include a prompt_id.',
              status: submitResponse.status,
              attempt,
              retryable: false,
            })
          }

          const imageReference = await this.waitForHistoryEntry(requestId)
          const artifact = await downloadBinaryArtifact(
            this.fetchFn,
            `${this.options.baseUrl}/view?filename=${encodeURIComponent(imageReference.filename)}&subfolder=${encodeURIComponent(imageReference.subfolder ?? '')}&type=${encodeURIComponent(imageReference.type ?? 'output')}`,
            this.options.timeoutMs,
          )

          return { artifact, requestId }
        } catch (error) {
          throw normalizeUnknownError(error, 'comfy', attempt, this.options.timeoutMs)
        }
      },
      {
        provider: 'comfy',
        retryLimit: this.options.retryLimit,
        sleep: this.options.sleep,
      },
    )

    return {
      provider: 'comfy',
      model: request.model ?? this.options.defaultModel,
      seed: request.seed ?? 0,
      artifact: value.artifact,
      latencyMs: Date.now() - startedAt,
      attempts,
      requestId: value.requestId,
    }
  }

  private async waitForHistoryEntry(requestId: string): Promise<{
    filename: string
    subfolder?: string
    type?: string
  }> {
    const startedAt = Date.now()

    while (Date.now() - startedAt < this.options.timeoutMs) {
      const response = await fetchWithTimeout(
        this.fetchFn,
        `${this.options.baseUrl}/history/${encodeURIComponent(requestId)}`,
        { method: 'GET' },
        this.options.timeoutMs,
      )

      if (!response.ok) {
        throw new MediaProviderError({
          provider: 'comfy',
          code: response.status >= 500 ? 'provider_unavailable' : 'generation_failed',
          message: `comfy: history lookup failed with HTTP ${response.status}.`,
          status: response.status,
          attempt: 1,
          retryable: response.status >= 500,
        })
      }

      const payload = await response.json() as Record<string, {
        status?: { completed?: boolean; status_str?: string }
        outputs?: Record<string, { images?: Array<{ filename?: string; subfolder?: string; type?: string }> }>
      }>

      const entry = payload[requestId]
      const images = entry
        ? Object.values(entry.outputs ?? {}).flatMap(output => output.images ?? [])
        : []

      if (images.length > 0 && images[0]?.filename) {
        return {
          filename: images[0].filename,
          subfolder: images[0].subfolder,
          type: images[0].type,
        }
      }

      if (entry?.status?.status_str === 'error') {
        throw new MediaProviderError({
          provider: 'comfy',
          code: 'generation_failed',
          message: 'comfy: generation failed according to history status.',
          status: response.status,
          attempt: 1,
          retryable: false,
        })
      }

      await this.sleep(this.options.pollIntervalMs)
    }

    throw new MediaProviderError({
      provider: 'comfy',
      code: 'timeout',
      message: `comfy: image generation timed out after ${this.options.timeoutMs}ms.`,
      status: null,
      attempt: 1,
      retryable: true,
    })
  }
}

type ComfyWorkflowInput = {
  model: string
  prompt: string
  negativePrompt: string
  width: number
  height: number
  steps: number
  seed: number
}

function buildComfyWorkflow(input: ComfyWorkflowInput): Record<string, unknown> {
  return {
    '3': {
      class_type: 'KSampler',
      inputs: {
        cfg: 8,
        denoise: 1,
        latent_image: ['5', 0],
        model: ['4', 0],
        negative: ['7', 0],
        positive: ['6', 0],
        sampler_name: 'euler',
        scheduler: 'normal',
        seed: input.seed,
        steps: input.steps,
      },
    },
    '4': {
      class_type: 'CheckpointLoaderSimple',
      inputs: {
        ckpt_name: input.model,
      },
    },
    '5': {
      class_type: 'EmptyLatentImage',
      inputs: {
        batch_size: 1,
        height: input.height,
        width: input.width,
      },
    },
    '6': {
      class_type: 'CLIPTextEncode',
      inputs: {
        clip: ['4', 1],
        text: input.prompt,
      },
    },
    '7': {
      class_type: 'CLIPTextEncode',
      inputs: {
        clip: ['4', 1],
        text: input.negativePrompt,
      },
    },
    '8': {
      class_type: 'VAEDecode',
      inputs: {
        samples: ['3', 0],
        vae: ['4', 2],
      },
    },
    '9': {
      class_type: 'SaveImage',
      inputs: {
        filename_prefix: 'agentai01',
        images: ['8', 0],
      },
    },
  }
}
