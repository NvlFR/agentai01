// src/runtime-app/speech/stt/deepgramStt.ts
// Deepgram STT implementation.
// Config: DEEPGRAM_API_KEY

import { type SttRequest, type SttResponse, SpeechError } from '../speechCore.js'

const DEEPGRAM_URL = 'https://api.deepgram.com/v1/listen'

export class DeepgramStt {
  readonly id = 'stt-deepgram'

  constructor(private readonly apiKey: string) {}

  isEnabled(): boolean {
    return Boolean(this.apiKey)
  }

  async stt(request: SttRequest): Promise<SttResponse> {
    if (!this.apiKey) {
      throw new SpeechError({
        toolId: this.id,
        message: 'Deepgram: API key missing.',
        retryable: false,
      })
    }

    const url = new URL(DEEPGRAM_URL)
    url.searchParams.set('model', 'nova-2')
    url.searchParams.set('smart_format', 'true')
    if (request.language) url.searchParams.set('language', request.language)

    let response: Response
    try {
      response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.apiKey}`,
          'Content-Type': request.mimeType,
        },
        body: request.audioBuffer as any,
      })
    } catch (err) {
      throw new SpeechError({
        toolId: this.id,
        message: `Deepgram: network error — ${err instanceof Error ? err.message : 'unknown'}`,
        retryable: true,
        cause: err,
      })
    }

    if (response.status === 401 || response.status === 403) {
      throw new SpeechError({
        toolId: this.id,
        message: `Deepgram: invalid API key (HTTP ${response.status}).`,
        retryable: false,
      })
    }

    if (!response.ok) {
      throw new SpeechError({
        toolId: this.id,
        message: `Deepgram: API error (HTTP ${response.status}).`,
        retryable: response.status >= 500,
      })
    }

    const raw = await response.json() as {
      results?: {
        channels?: Array<{
          alternatives?: Array<{
            transcript?: string
            confidence?: number
          }>
        }>
      }
    }

    const alt = raw.results?.channels?.[0]?.alternatives?.[0]
    if (!alt) {
      throw new SpeechError({
        toolId: this.id,
        message: 'Deepgram: failed to extract transcript from response.',
        retryable: false,
      })
    }

    return {
      text: alt.transcript ?? '',
      confidence: alt.confidence ?? 0,
      raw,
    }
  }
}

export function createDeepgramStt(): DeepgramStt {
  const apiKey = process.env['DEEPGRAM_API_KEY'] ?? ''
  return new DeepgramStt(apiKey)
}
