import type { SpeechCapability, SpeechProvider } from './types.js'

export type SpeechProviderRegistry = {
  register(provider: SpeechProvider): SpeechProvider
  get(providerId: string): SpeechProvider | undefined
  list(): readonly SpeechProvider[]
  resolveByCapability(capability: SpeechCapability, preferredProviderId?: string): SpeechProvider | undefined
}

export function createSpeechProviderRegistry(
  providers: Iterable<SpeechProvider> = [],
): SpeechProviderRegistry {
  const entries = new Map<string, SpeechProvider>()

  for (const provider of providers) {
    entries.set(provider.id, provider)
  }

  return {
    register(provider) {
      entries.set(provider.id, provider)
      return provider
    },
    get(providerId) {
      return entries.get(providerId)
    },
    list() {
      return [...entries.values()]
    },
    resolveByCapability(capability, preferredProviderId) {
      if (preferredProviderId) {
        const preferred = entries.get(preferredProviderId)
        if (preferred && preferred.capabilities.includes(capability)) {
          return preferred
        }
      }

      for (const provider of entries.values()) {
        if (provider.capabilities.includes(capability)) {
          return provider
        }
      }

      return undefined
    },
  }
}
