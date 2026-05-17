import OpenAI, { type ClientOptions } from 'openai'
import type { SpeechCreateParams } from 'openai/resources/audio/speech'
import type { Transcription, TranscriptionCreateResponse } from 'openai/resources/audio/transcriptions'
import type {
  SpeechAudioFormat,
  SpeechAudioInput,
  SpeechProvider,
  SynthesizeOptions,
  SynthesizeResult,
  TranscribeOptions,
  TranscribeResult,
} from './types.js'

const DEFAULT_BASE_URL = 'http://127.0.0.1:8045/v1'
const DEFAULT_SYNTHESIZE_MODEL = 'gpt-4o-mini-tts'
const DEFAULT_TRANSCRIBE_MODEL = 'gpt-4o-mini-transcribe'
const DEFAULT_VOICE = 'alloy'
const DEFAULT_AUDIO_FORMAT: SpeechAudioFormat = 'mp3'

const MIME_TYPES: Record<SpeechAudioFormat, string> = {
  aac: 'audio/aac',
  flac: 'audio/flac',
  mp3: 'audio/mpeg',
  opus: 'audio/opus',
  pcm: 'audio/L16',
  wav: 'audio/wav',
}

type OpenAICompatibleSpeechClient = {
  audio: {
    speech: {
      create(
        body: SpeechCreateParams,
        options?: { signal?: AbortSignal },
      ): Promise<Response>
    }
    transcriptions: {
      create(
        body: {
          file: File
          model: string
          language?: string
          prompt?: string
          response_format?: 'json'
          temperature?: number
        },
        options?: { signal?: AbortSignal },
      ): Promise<TranscriptionCreateResponse | string>
    }
  }
}

export type OpenAICompatibleSpeechProviderConfig = {
  id?: string
  label?: string
  apiKey?: string
  baseURL?: string
  organization?: string
  project?: string
  synthesizeModel?: string
  transcribeModel?: string
  defaultVoice?: string
  defaultFormat?: SpeechAudioFormat
  client?: OpenAICompatibleSpeechClient
  createClient?: (options: ClientOptions) => OpenAICompatibleSpeechClient
}

type ResolvedOpenAICompatibleSpeechProviderConfig = Required<
  Pick<
    OpenAICompatibleSpeechProviderConfig,
    'id' | 'label' | 'apiKey' | 'baseURL' | 'synthesizeModel' | 'transcribeModel' | 'defaultVoice' | 'defaultFormat'
  >
> &
  Pick<OpenAICompatibleSpeechProviderConfig, 'organization' | 'project'>

export function createOpenAICompatibleSpeechProvider(
  config: OpenAICompatibleSpeechProviderConfig = {},
): SpeechProvider {
  const resolved = resolveProviderConfig(config)
  const client = config.client
    ?? (config.createClient ?? ((options) => new OpenAI(options)))(buildClientOptions(resolved))

  return {
    id: resolved.id,
    label: resolved.label,
    capabilities: ['synthesize', 'transcribe'],
    async synthesize(text, options = {}) {
      const format = options.format ?? resolved.defaultFormat
      const voice = options.voice ?? resolved.defaultVoice
      const model = options.model ?? resolved.synthesizeModel
      const response = await client.audio.speech.create({
        input: text,
        model,
        voice,
        response_format: format,
        ...(options.instructions === undefined ? {} : { instructions: options.instructions }),
        ...(options.speed === undefined ? {} : { speed: options.speed }),
      })

      return {
        providerId: resolved.id,
        model,
        voice,
        format,
        mimeType: MIME_TYPES[format],
        audio: new Uint8Array(await response.arrayBuffer()),
        raw: response,
      } satisfies SynthesizeResult
    },
    async transcribe(audio, options = {}) {
      const model = options.model ?? resolved.transcribeModel
      const response = await client.audio.transcriptions.create({
        file: toAudioFile(audio, options),
        model,
        ...(options.language === undefined ? {} : { language: options.language }),
        ...(options.prompt === undefined ? {} : { prompt: options.prompt }),
        ...(options.temperature === undefined ? {} : { temperature: options.temperature }),
        response_format: 'json',
      })
      const text = readTranscriptionText(response)

      return {
        providerId: resolved.id,
        model,
        text,
        raw: response,
      } satisfies TranscribeResult
    },
  }
}

function resolveProviderConfig(
  config: OpenAICompatibleSpeechProviderConfig,
): ResolvedOpenAICompatibleSpeechProviderConfig {
  const baseURL = readConfiguredString(config.baseURL) ?? readConfiguredString(process.env['AI_BASE_URL']) ?? DEFAULT_BASE_URL
  const apiKey = readConfiguredString(config.apiKey) ?? readConfiguredString(process.env['AI_API_KEY']) ?? ''
  const aiModel = readConfiguredString(process.env['AI_MODEL'])

  return {
    id: readConfiguredString(config.id) ?? 'openai-compatible-speech',
    label: readConfiguredString(config.label) ?? 'OpenAI Compatible Speech',
    apiKey,
    baseURL,
    synthesizeModel: readConfiguredString(config.synthesizeModel) ?? aiModel ?? DEFAULT_SYNTHESIZE_MODEL,
    transcribeModel:
      readConfiguredString(config.transcribeModel)
      ?? readConfiguredString(process.env['AI_TRANSCRIBE_MODEL'])
      ?? aiModel
      ?? DEFAULT_TRANSCRIBE_MODEL,
    defaultVoice: readConfiguredString(config.defaultVoice) ?? DEFAULT_VOICE,
    defaultFormat: config.defaultFormat ?? DEFAULT_AUDIO_FORMAT,
    organization: readConfiguredString(config.organization),
    project: readConfiguredString(config.project),
  }
}

function buildClientOptions(
  config: ResolvedOpenAICompatibleSpeechProviderConfig,
): ClientOptions {
  return {
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    ...(config.organization === undefined ? {} : { organization: config.organization }),
    ...(config.project === undefined ? {} : { project: config.project }),
  }
}

function toAudioFile(audio: SpeechAudioInput, options: TranscribeOptions): File {
  const bytes = normalizeAudioInput(audio)
  return new File([bytes], options.fileName ?? 'audio-input.wav', {
    type: options.mimeType ?? 'audio/wav',
  })
}

function normalizeAudioInput(audio: SpeechAudioInput): Uint8Array {
  if (audio instanceof Uint8Array) {
    return audio
  }

  return new Uint8Array((audio as any).buffer, (audio as any).byteOffset, (audio as any).byteLength)
}

function readTranscriptionText(response: TranscriptionCreateResponse | string): string {
  if (typeof response === 'string') {
    return response
  }

  return (response as Transcription).text
}

function readConfiguredString(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}
