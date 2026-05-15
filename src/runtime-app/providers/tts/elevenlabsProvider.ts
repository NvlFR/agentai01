import {
  type FetchLike,
  type MediaProviderError,
  createHttpError,
  fetchWithTimeout,
  normalizeUnknownError,
  readNumberEnv,
  readOptionalEnv,
  readRequiredEnv,
  responseToBinaryArtifact,
  withRetry,
} from './shared/providerCommon.js'
import type { TtsProvider, TtsSynthesisRequest, TtsSynthesisResult } from './ttsTypes.js'

const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1'
const ELEVENLABS_DEFAULT_MODEL = 'eleven_multilingual_v2'
const ELEVENLABS_DEFAULT_OUTPUT_FORMAT = 'mp3_44100_128'
const ELEVENLABS_DEFAULT_TIMEOUT_MS = 30_000
const ELEVENLABS_DEFAULT_RETRY_LIMIT = 2

export type ElevenLabsProviderOptions = {
  apiKey: string
  voiceId: string
  model: string
  outputFormat: string
  timeoutMs: number
  retryLimit: number
  fetchFn?: FetchLike
  sleep?: (ms: number) => Promise<void>
}

export function createElevenLabsProviderOptionsFromEnv(): ElevenLabsProviderOptions {
  return {
    apiKey: readRequiredEnv('ELEVENLABS_API_KEY'),
    voiceId: readRequiredEnv('ELEVENLABS_VOICE_ID'),
    model: readOptionalEnv('ELEVENLABS_MODEL') ?? ELEVENLABS_DEFAULT_MODEL,
    outputFormat: readOptionalEnv('ELEVENLABS_OUTPUT_FORMAT') ?? ELEVENLABS_DEFAULT_OUTPUT_FORMAT,
    timeoutMs: readNumberEnv('ELEVENLABS_TTS_TIMEOUT_MS', ELEVENLABS_DEFAULT_TIMEOUT_MS),
    retryLimit: readNumberEnv('ELEVENLABS_TTS_RETRY_LIMIT', ELEVENLABS_DEFAULT_RETRY_LIMIT),
  }
}

export class ElevenLabsProvider implements TtsProvider {
  private readonly fetchFn: FetchLike

  constructor(private readonly options: ElevenLabsProviderOptions) {
    this.fetchFn = options.fetchFn ?? fetch
  }

  async synthesize(request: TtsSynthesisRequest): Promise<TtsSynthesisResult> {
    const voiceId = request.voiceId ?? this.options.voiceId
    const model = request.model ?? this.options.model
    const format = request.format ?? this.options.outputFormat
    const startedAt = Date.now()

    const { value, attempts } = await withRetry(
      async ({ attempt }) => {
        try {
          const response = await fetchWithTimeout(
            this.fetchFn,
            `${ELEVENLABS_BASE_URL}/text-to-speech/${encodeURIComponent(voiceId)}?output_format=${encodeURIComponent(format)}`,
            {
              method: 'POST',
              headers: {
                'content-type': 'application/json',
                'xi-api-key': this.options.apiKey,
              },
              body: JSON.stringify({
                text: request.text,
                model_id: model,
              }),
            },
            this.options.timeoutMs,
          )

          if (!response.ok) {
            throw createHttpError({
              provider: 'elevenlabs',
              status: response.status,
              attempt,
              authMessage: `elevenlabs: invalid API key or voice access denied (HTTP ${response.status}).`,
              rateLimitMessage: 'elevenlabs: rate limit or quota exceeded.',
              failureMessage: `elevenlabs: synthesis failed with HTTP ${response.status}.`,
            })
          }

          return responseToBinaryArtifact(response, 'audio/mpeg')
        } catch (error) {
          throw normalizeUnknownError(error, 'elevenlabs', attempt, this.options.timeoutMs)
        }
      },
      {
        provider: 'elevenlabs',
        retryLimit: this.options.retryLimit,
        sleep: this.options.sleep,
      },
    )

    return {
      provider: 'elevenlabs',
      voiceId,
      model,
      artifact: value,
      latencyMs: Date.now() - startedAt,
      attempts,
    }
  }
}
