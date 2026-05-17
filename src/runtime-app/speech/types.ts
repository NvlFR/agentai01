export type SpeechCapability = 'synthesize' | 'transcribe'

export type SpeechAudioFormat = 'mp3' | 'wav' | 'flac' | 'opus' | 'aac' | 'pcm'

export type SynthesizeOptions = {
  providerId?: string
  model?: string
  voice?: string
  format?: SpeechAudioFormat
  instructions?: string
  speed?: number
}

export type SynthesizeResult = {
  providerId: string
  model: string
  voice: string
  format: SpeechAudioFormat
  mimeType: string
  audio: Uint8Array
  raw?: unknown
}

export type TranscribeOptions = {
  providerId?: string
  mimeType?: string
  fileName?: string
  model?: string
  language?: string
  prompt?: string
  temperature?: number
}

export type TranscribeResult = {
  providerId: string
  model: string
  text: string
  raw?: unknown
}

export type SpeechAudioInput = Uint8Array | ArrayBuffer | Buffer

export interface SpeechProvider {
  readonly id: string
  readonly label: string
  readonly capabilities: readonly SpeechCapability[]
  synthesize(text: string, options?: SynthesizeOptions): Promise<SynthesizeResult>
  transcribe(audio: SpeechAudioInput, options?: TranscribeOptions): Promise<TranscribeResult>
}
