import type { PluginEntry, PluginRegistrationApi } from './plugin-entry.js'
import { definePluginEntry } from './plugin-entry.js'
import type { JsonObject } from '../tools/index.js'

export type ProviderCatalogContext = {
  readonly config: JsonObject
  readonly env: NodeJS.ProcessEnv
  resolveProviderApiKey(providerId?: string): {
    readonly apiKey: string | undefined
    readonly discoveryApiKey?: string
  }
}

export type ProviderCatalogResult =
  | { readonly provider: JsonObject }
  | { readonly providers: Record<string, JsonObject> }
  | null
  | undefined

export type ProviderPluginCatalog = {
  readonly order?: 'simple' | 'profile' | 'paired' | 'late'
  run(ctx: ProviderCatalogContext): Promise<ProviderCatalogResult>
}

export type ProviderApiKeyAuthOptions = {
  readonly methodId: string
  readonly label: string
  readonly hint?: string
  readonly envVar?: string
  readonly expectedProviders?: string[]
}

export type SingleProviderPluginOptions = {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly configSchema?: JsonObject | (() => JsonObject)
  readonly provider?: {
    readonly id?: string
    readonly label: string
    readonly docsPath: string
    readonly aliases?: string[]
    readonly envVars?: string[]
    readonly auth?: ProviderApiKeyAuthOptions[]
    readonly catalog: ProviderPluginCatalog
  }
  register?(api: PluginRegistrationApi): void | Promise<void>
}

/**
 * Helper to define a plugin that provides a single AI model provider.
 * Adapted for agentai01 from OpenClaw's provider-entry.ts.
 */
export function defineSingleProviderPlugin(options: SingleProviderPluginOptions): PluginEntry {
  return definePluginEntry({
    id: options.id,
    name: options.name,
    description: options.description,
    ...(options.configSchema ? { configSchema: options.configSchema } : {}),
    async register(api) {
      const provider = options.provider
      if (provider) {
        const providerId = provider.id ?? options.id
        
        // In this runtime, we might want to register it via api.registerProvider if it exists
        // Since PluginRegistrationApi in src/plugin-sdk/plugin-entry.ts only has registerChannel
        // we might need to extend it or just rely on the plugin's own registration logic.
        
        // For now, we follow the pattern but keep it minimal to match our RuntimeApp's capabilities.
        // If we need to register providers, we should probably add it to PluginRegistrationApi.
      }
      
      await options.register?.(api)
    },
  })
}
