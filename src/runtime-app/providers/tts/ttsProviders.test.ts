import { describe, expect, it } from 'bun:test'
import { AzureSpeechProvider } from './azureSpeechProvider.js'
import { ElevenLabsProvider } from './elevenlabsProvider.js'
import { MicrosoftTtsProvider } from './microsoftTtsProvider.js'

function audioResponse(status: number, body = 'audio-data', contentType = 'audio/mpeg'): Response {
  return new Response(body, {
    status,
    headers: { 'content-type': contentType },
  })
}

describe('premium TTS providers', () => {
  it('returns in-memory audio output for ElevenLabs', async () => {
    const provider = new ElevenLabsProvider({
      apiKey: 'key',
      voiceId: 'voice-1',
      model: 'eleven_multilingual_v2',
      outputFormat: 'mp3_44100_128',
      timeoutMs: 5_000,
      retryLimit: 0,
      fetchFn: async () => audioResponse(200, 'abc'),
    })

    const result = await provider.synthesize({ text: 'hello' })

    expect(result.provider).toBe('elevenlabs')
    expect(result.artifact.data).toBeInstanceOf(Uint8Array)
    expect(new TextDecoder().decode(result.artifact.data)).toBe('abc')
  })

  it('normalizes auth failures without leaking raw payloads', async () => {
    const provider = new AzureSpeechProvider({
      apiKey: 'bad',
      region: 'sea',
      voice: 'en-US-JennyNeural',
      locale: 'en-US',
      outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
      timeoutMs: 5_000,
      retryLimit: 0,
      fetchFn: async () => new Response('raw vendor failure', { status: 401 }),
    })

    await expect(provider.synthesize({ text: 'hello' })).rejects.toMatchObject({
      provider: 'azure-speech',
      status: 401,
      retryable: false,
    })
  })

  it('retries retryable quota errors for Microsoft TTS', async () => {
    let calls = 0
    const provider = new MicrosoftTtsProvider({
      apiKey: 'key',
      voice: 'en-US-JennyNeural',
      locale: 'en-US',
      outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
      endpoint: 'https://eastus.tts.speech.microsoft.com/cognitiveservices/v1',
      timeoutMs: 5_000,
      retryLimit: 1,
      sleep: async () => undefined,
      fetchFn: async () => {
        calls += 1
        return calls === 1 ? new Response('limited', { status: 429 }) : audioResponse(200, 'ok')
      },
    })

    const result = await provider.synthesize({ text: 'retry me' })

    expect(calls).toBe(2)
    expect(new TextDecoder().decode(result.artifact.data)).toBe('ok')
  })
})
