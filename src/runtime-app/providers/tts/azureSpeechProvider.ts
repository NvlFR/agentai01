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

const AZURE_DEFAULT_VOICE = 'en-US-JennyNeural'
const AZURE_DEFAULT_LOCALE = 'en-US'
const AZURE_DEFAULT_TIMEOUT_MS = 30_000
const AZURE_DEFAULT_RETRY_LIMIT = 2
const AZURE_DEFAULT_OUTPUT_FORMAT = 'audio-24khz-48kbitrate-mono-mp3'

export type AzureSpeechProviderOptions = {
  apiKey: string
  region: string
  voice: string
  locale: string
  outputFormat: string
  timeoutMs: number
  retryLimit: number
  fetchFn?: FetchLike
  sleep?: (ms: number) => Promise<void>
}

export function createAzureSpeechProviderOptionsFromEnv(): AzureSpeechProviderOptions {
  return {
    apiKey: readRequiredEnv('AZURE_SPEECH_KEY'),
    region: readRequiredEnv('AZURE_SPEECH_REGION'),
    voice: readOptionalEnv('AZURE_SPEECH_VOICE') ?? AZURE_DEFAULT_VOICE,
    locale: readOptionalEnv('AZURE_SPEECH_LOCALE') ?? AZURE_DEFAULT_LOCALE,
    outputFormat: readOptionalEnv('AZURE_SPEECH_OUTPUT_FORMAT') ?? AZURE_DEFAULT_OUTPUT_FORMAT,
    timeoutMs: readNumberEnv('AZURE_SPEECH_TTS_TIMEOUT_MS', AZURE_DEFAULT_TIMEOUT_MS),
    retryLimit: readNumberEnv('AZURE_SPEECH_TTS_RETRY_LIMIT', AZURE_DEFAULT_RETRY_LIMIT),
  }
}

export class AzureSpeechProvider implements TtsProvider {
  private readonly fetchFn: FetchLike

  constructor(private readonly options: AzureSpeechProviderOptions) {
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
            `https://${this.options.region}.tts.speech.microsoft.com/cognitiveservices/v1`,
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
              provider: 'azure-speech',
              status: response.status,
              attempt,
              authMessage: `azure-speech: invalid subscription key or region mismatch (HTTP ${response.status}).`,
              rateLimitMessage: 'azure-speech: rate limit or quota exceeded.',
              failureMessage: `azure-speech: synthesis failed with HTTP ${response.status}.`,
            })
          }

          return responseToBinaryArtifact(response, 'audio/mpeg')
        } catch (error) {
          throw normalizeUnknownError(error, 'azure-speech', attempt, this.options.timeoutMs)
        }
      },
      {
        provider: 'azure-speech',
        retryLimit: this.options.retryLimit,
        sleep: this.options.sleep,
      },
    )

    return {
      provider: 'azure-speech',
      voiceId: voice,
      model: 'azure-neural-tts',
      artifact: value,
      latencyMs: Date.now() - startedAt,
      attempts,
    }
  }
}
