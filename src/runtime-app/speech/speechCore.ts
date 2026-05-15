// src/runtime-app/speech/speechCore.ts
// Speech_Core abstraction for Speech-to-Text (STT) and Text-to-Speech (TTS).

export type SttRequest = {
  audioBuffer: Buffer | ArrayBuffer
  mimeType: string
  language?: string
}

export type SttResponse = {
  text: string
  confidence: number
  raw?: unknown
}

export type TtsRequest = {
  text: string
  voiceId?: string
  language?: string
}

export type TtsResponse = {
  audioBuffer: Buffer
  format: 'mp3' | 'wav'
  raw?: unknown
}

export interface SpeechCore {
  readonly id: string
  stt(request: SttRequest): Promise<SttResponse>
  tts(request: TtsRequest): Promise<TtsResponse>
}

export class SpeechError extends Error {
  readonly toolId: string
  readonly retryable: boolean

  constructor(args: { toolId: string; message: string; retryable: boolean; cause?: unknown }) {
    super(args.message, args.cause ? { cause: args.cause } : undefined)
    this.name = 'SpeechError'
    this.toolId = args.toolId
    this.retryable = args.retryable
  }
}
