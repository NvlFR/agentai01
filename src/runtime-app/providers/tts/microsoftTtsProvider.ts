import {
  type FetchLike,
  buildSsmlDocument,
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

const MICROSOFT_DEFAULT_REGION = 'eastus'
const MICROSOFT_DEFAULT_VOICE = 'en-US-JennyNeural'
const MICROSOFT_DEFAULT_LOCALE = 'en-US'
const MICROSOFT_DEFAULT_TIMEOUT_MS = 30_000
const MICROSOFT_DEFAULT_RETRY_LIMIT = 2
const MICROSOFT_DEFAULT_OUTPUT_FORMAT = 'audio-24khz-48kbitrate-mono-mp3'

export type MicrosoftTtsProviderOptions = {
  apiKey: string
  endpoint: string
  voice: string
  locale: string
  outputFormat: string
  timeoutMs: number
  retryLimit: number
  fetchFn?: FetchLike
  sleep?: (ms: number) => Promise<void>
}

export function createMicrosoftTtsProviderOptionsFromEnv(): MicrosoftTtsProviderOptions {
  const endpoint = readOptionalEnv('MICROSOFT_TTS_ENDPOINT')
    ?? `https://${readOptionalEnv('MICROSOFT_TTS_REGION') ?? MICROSOFT_DEFAULT_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`

  return {
    apiKey: readRequiredEnv('MICROSOFT_TTS_KEY'),
    endpoint,
    voice: readOptionalEnv('MICROSOFT_TTS_VOICE') ?? MICROSOFT_DEFAULT_VOICE,
    locale: readOptionalEnv('MICROSOFT_TTS_LOCALE') ?? MICROSOFT_DEFAULT_LOCALE,
    outputFormat: readOptionalEnv('MICROSOFT_TTS_OUTPUT_FORMAT') ?? MICROSOFT_DEFAULT_OUTPUT_FORMAT,
    timeoutMs: readNumberEnv('MICROSOFT_TTS_TIMEOUT_MS', MICROSOFT_DEFAULT_TIMEOUT_MS),
    retryLimit: readNumberEnv('MICROSOFT_TTS_RETRY_LIMIT', MICROSOFT_DEFAULT_RETRY_LIMIT),
  }
}

export class MicrosoftTtsProvider implements TtsProvider {
  private readonly fetchFn: FetchLike

  constructor(private readonly options: MicrosoftTtsProviderOptions) {
    this.fetchFn = options.fetchFn ?? fetch
  }

  async synthesize(request: TtsSynthesisRequest): Promise<TtsSynthesisResult> {
    const voice = request.voiceId ?? this.options.voice
    const locale = request.locale ?? this.options.locale
    const startedAt = Date.now()

    const { value, attempts } = await withRetry(
      async ({ attempt }) => {
        try {
          const response = await fetchWithTimeout(
            this.fetchFn,
            this.options.endpoint,
            {
              method: 'POST',
              headers: {
                'content-type': 'application/ssml+xml',
                'ocp-apim-subscription-key': this.options.apiKey,
                'x-microsoft-outputformat': this.options.outputFormat,
                'user-agent': 'agentai01-runtime',
              },
              body: buildSsmlDocument(request.text, voice, locale),
            },
            this.options.timeoutMs,
          )

          if (!response.ok) {
            throw createHttpError({
              provider: 'microsoft-tts',
              status: response.status,
              attempt,
              authMessage: `microsoft-tts: invalid subscription key or endpoint configuration (HTTP ${response.status}).`,
              rateLimitMessage: 'microsoft-tts: rate limit or quota exceeded.',
              failureMessage: `microsoft-tts: synthesis failed with HTTP ${response.status}.`,
            })
          }

          return responseToBinaryArtifact(response, 'audio/mpeg')
        } catch (error) {
          throw normalizeUnknownError(error, 'microsoft-tts', attempt, this.options.timeoutMs)
        }
      },
      {
        provider: 'microsoft-tts',
        retryLimit: this.options.retryLimit,
        sleep: this.options.sleep,
      },
    )

    return {
      provider: 'microsoft-tts',
      voiceId: voice,
      model: 'microsoft-cognitive-services-tts',
      artifact: value,
      latencyMs: Date.now() - startedAt,
      attempts,
    }
  }
}
