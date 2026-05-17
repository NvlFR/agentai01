import { describe, expect, it } from 'bun:test'
import { createSpeechProviderRegistry } from './registry.js'
import type { SpeechProvider } from './types.js'

describe('createSpeechProviderRegistry', () => {
  it('resolves a preferred provider when it supports the requested capability', () => {
    const synthOnly = createProvider('synth-only', ['synthesize'])
    const both = createProvider('both', ['synthesize', 'transcribe'])
    const registry = createSpeechProviderRegistry([synthOnly, both])

    expect(registry.resolveByCapability('synthesize', 'synth-only')).toBe(synthOnly)
    expect(registry.resolveByCapability('transcribe', 'synth-only')).toBe(both)
  })

  it('registers and lists providers', () => {
    const registry = createSpeechProviderRegistry()
    const provider = createProvider('speech-a', ['synthesize'])

    registry.register(provider)

    expect(registry.get('speech-a')).toBe(provider)
    expect(registry.list()).toEqual([provider])
  })
})

function createProvider(id: string, capabilities: SpeechProvider['capabilities']): SpeechProvider {
  return {
    id,
    label: id,
    capabilities,
    async synthesize() {
      return {
        providerId: id,
        model: 'model',
        voice: 'voice',
        format: 'mp3',
        mimeType: 'audio/mpeg',
        audio: new Uint8Array([1]),
      }
    },
    async transcribe() {
      return {
        providerId: id,
        model: 'model',
        text: 'ok',
      }
    },
  }
}
