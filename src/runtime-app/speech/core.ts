import type { SpeechAudioInput, SynthesizeOptions, SynthesizeResult, TranscribeOptions, TranscribeResult } from './types.js'
import { createSpeechProviderRegistry, type SpeechProviderRegistry } from './registry.js'
import type { SpeechProvider } from './types.js'

export class SpeechError extends Error {
  readonly code: 'provider_not_found' | 'capability_not_supported'

  constructor(
    code: 'provider_not_found' | 'capability_not_supported',
    message: string,
  ) {
    super(message)
    this.name = 'SpeechError'
    this.code = code
  }
}

export type SpeechCore = {
  synthesize(text: string, options?: SynthesizeOptions): Promise<SynthesizeResult>
  transcribe(audio: SpeechAudioInput, options?: TranscribeOptions): Promise<TranscribeResult>
  listProviders(): readonly SpeechProvider[]
}

export type CreateSpeechCoreOptions = {
  registry?: SpeechProviderRegistry
  providers?: Iterable<SpeechProvider>
}

export function createSpeechCore(options: CreateSpeechCoreOptions = {}): SpeechCore {
  const registry = options.registry ?? createSpeechProviderRegistry(options.providers)

  return {
    async synthesize(text, options = {}) {
      const provider = registry.resolveByCapability('synthesize', options.providerId)
      if (!provider) {
        throw new SpeechError(
          options.providerId ? 'provider_not_found' : 'capability_not_supported',
          options.providerId
            ? `Speech provider "${options.providerId}" could not synthesize text.`
            : 'No speech provider with synthesize capability is registered.',
        )
      }

      return provider.synthesize(text, options)
    },
    async transcribe(audio, options = {}) {
      const provider = registry.resolveByCapability('transcribe', options.providerId)
      if (!provider) {
        throw new SpeechError(
          options.providerId ? 'provider_not_found' : 'capability_not_supported',
          options.providerId
            ? `Speech provider "${options.providerId}" could not transcribe audio.`
            : 'No speech provider with transcribe capability is registered.',
        )
      }

      return provider.transcribe(audio, options)
    },
    listProviders() {
      return registry.list()
    },
  }
}
