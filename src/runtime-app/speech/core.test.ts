import { describe, expect, it } from 'bun:test'
import { createSpeechCore, SpeechError } from './core.js'
import { createSpeechProviderRegistry } from './registry.js'
import type { SpeechProvider } from './types.js'

describe('createSpeechCore', () => {
  it('routes synthesize and transcribe requests through the registry', async () => {
    const provider = createProvider('primary')
    const core = createSpeechCore({
      registry: createSpeechProviderRegistry([provider]),
    })

    const synthesis = await core.synthesize('hello', { voice: 'marin' })
    const transcription = await core.transcribe(new Uint8Array([1, 2, 3]), {
      mimeType: 'audio/wav',
    })

    expect(synthesis.voice).toBe('marin')
    expect([...synthesis.audio]).toEqual([5, 4, 3])
    expect(transcription.text).toBe('decoded text')
    expect(core.listProviders()).toEqual([provider])
  })

  it('throws a SpeechError when no provider can satisfy a capability', async () => {
    const core = createSpeechCore({
      registry: createSpeechProviderRegistry(),
    })

    await expect(core.synthesize('hello')).rejects.toEqual(
      expect.objectContaining({
        name: 'SpeechError',
        code: 'capability_not_supported',
      }),
    )
  })
})

function createProvider(id: string): SpeechProvider {
  return {
    id,
    label: 'Primary',
    capabilities: ['synthesize', 'transcribe'],
    async synthesize(text, options) {
      return {
        providerId: id,
        model: 'speech-model',
        voice: options?.voice ?? 'alloy',
        format: 'mp3',
        mimeType: 'audio/mpeg',
        audio: new Uint8Array([5, 4, 3]),
        raw: text,
      }
    },
    async transcribe() {
      return {
        providerId: id,
        model: 'transcribe-model',
        text: 'decoded text',
      }
    },
  }
}
