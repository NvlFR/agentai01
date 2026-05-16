import { describe, expect, it } from 'bun:test'

import {
  InMemoryTtsCache,
  createTtsClient,
  normalizeTtsFormat,
  type TtsProvider,
} from './index.js'

describe('normalizeTtsFormat', () => {
  it('normalizes audio format defaults and invalid numeric options', () => {
    expect(
      normalizeTtsFormat(
        { format: 'wav', sampleRateHz: -1, channels: 2, bitRateKbps: 128.8 },
        { sampleRateHz: 16_000 },
      ),
    ).toEqual({
      format: 'wav',
      mimeType: 'audio/wav',
      sampleRateHz: 16_000,
      channels: 2,
      bitRateKbps: 128,
    })
  })
})

describe('createTtsClient', () => {
  it('caches synthesized audio by normalized request and returns defensive copies', async () => {
    let calls = 0
    const provider: TtsProvider = {
      id: 'fake-tts',
      async synthesize(request) {
        calls += 1
        return {
          audio: new Uint8Array([calls, 2, 3]),
          format: request.format,
          providerId: 'fake-tts',
          voice: request.voice,
          model: request.model,
          durationMs: 120,
        }
      },
    }
    const client = createTtsClient({
      provider,
      cache: new InMemoryTtsCache(),
      defaultFormat: { format: 'mp3', sampleRateHz: 24_000 },
    })

    const first = await client.synthesize({ text: 'Hello', voice: 'alloy' })
    first.audio[0] = 99
    const second = await client.synthesize({ text: 'Hello', voice: 'alloy' })

    expect(calls).toBe(1)
    expect(first.cache.hit).toBe(false)
    expect(second.cache.hit).toBe(true)
    expect(Array.from(second.audio)).toEqual([1, 2, 3])
  })

  it('can bypass cache without persisting raw audio', async () => {
    let calls = 0
    const provider: TtsProvider = {
      id: 'fake-tts',
      async synthesize(request) {
        calls += 1
        return {
          audio: new Uint8Array([calls]),
          format: request.format,
          providerId: 'fake-tts',
          voice: request.voice,
        }
      },
    }
    const client = createTtsClient({ provider })

    await client.synthesize({ text: 'No cache', voice: 'alloy', cache: false })
    await client.synthesize({ text: 'No cache', voice: 'alloy', cache: false })

    expect(calls).toBe(2)
  })

  it('returns defensive copies of provider format metadata', async () => {
    const provider: TtsProvider = {
      id: 'fake-tts',
      async synthesize(request) {
        return {
          audio: new Uint8Array([1]),
          format: request.format,
          providerId: 'fake-tts',
          voice: request.voice,
        }
      },
    }
    const client = createTtsClient({ provider })

    const first = await client.synthesize({ text: 'Hello', voice: 'alloy' })
    first.format.sampleRateHz = 8_000
    const second = await client.synthesize({ text: 'Hello', voice: 'alloy' })

    expect(second.format.sampleRateHz).toBe(24_000)
    expect(second.cache.hit).toBe(true)
  })
})
