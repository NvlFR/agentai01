// Adapted using referensi/openclaw/src/plugin-sdk/registry.ts
import { join } from 'node:path'
import type { 
  PluginManifest, 
  PluginContext,
  ChannelPlugin,
  ProviderPlugin,
  ToolPlugin
} from './types.js'
import type { PluginLoader } from './loader.js'
import type { PluginRegistrationApi, PluginEntry } from './plugin-entry.js'

export type PluginEntryRecord = {
  readonly manifest: PluginManifest
  readonly path: string
  enabled: boolean
  instance?: PluginEntry
  capabilities: {
    channels: ChannelPlugin[]
    providers: ProviderPlugin[]
    tools: ToolPlugin[]
  }
}

export type PluginRegistryOptions = {
  readonly loader: PluginLoader
  readonly pluginDir: string
  readonly context: PluginContext
}

export type PluginRegistry = {
  load(pluginPath: string): Promise<string>
  enable(id: string): Promise<void>
  disable(id: string): Promise<void>
  list(): PluginEntryRecord[]
  get(id: string): PluginEntryRecord | undefined
}

export function createPluginRegistry(options: PluginRegistryOptions): PluginRegistry {
  const plugins = new Map<string, PluginEntryRecord>()

  return {
    async load(pluginPath: string): Promise<string> {
      const manifest = await options.loader.loadManifest(pluginPath)
      const existing = plugins.get(manifest.id)
      
      if (existing) {
        plugins.set(manifest.id, {
          ...existing,
          manifest,
          path: pluginPath,
        })
      } else {
        plugins.set(manifest.id, {
          manifest,
          path: pluginPath,
          enabled: false,
          capabilities: {
            channels: [],
            providers: [],
            tools: [],
          }
        })
      }
      
      return manifest.id
    },

    async enable(id: string): Promise<void> {
      const record = plugins.get(id)
      if (!record) {
        throw new Error(`Plugin ${id} not found`)
      }

      if (record.enabled && record.instance) {
        return
      }

      const entryPath = join(options.pluginDir, record.path, 'index.js')
      
      try {
        // Clear capabilities before re-enabling
        record.capabilities = {
          channels: [],
          providers: [],
          tools: [],
        }

        const module = await import(`file://${entryPath}`)
        const entry = module.default as PluginEntry
        
        if (!entry || typeof entry.register !== 'function') {
          throw new Error(`Plugin ${id} does not export a valid PluginEntry as default`)
        }
        
        record.instance = entry
        
        const api: PluginRegistrationApi = {
          registrationMode: 'full',
          registerChannel: (reg) => {
            record.capabilities.channels.push(reg.plugin)
          },
          registerProvider: (reg) => {
            record.capabilities.providers.push(reg.plugin)
          },
          registerTool: (reg) => {
            record.capabilities.tools.push(reg.plugin)
          }
        }
        
        await entry.register(api)
        record.enabled = true
      } catch (error) {
        throw new Error(`Failed to enable plugin ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    },

    async disable(id: string): Promise<void> {
      const record = plugins.get(id)
      if (!record) {
        throw new Error(`Plugin ${id} not found`)
      }
      
      record.enabled = false
      record.instance = undefined
      record.capabilities = {
        channels: [],
        providers: [],
        tools: [],
      }
    },

    list(): PluginEntryRecord[] {
      return Array.from(plugins.values())
    },

    get(id: string): PluginEntryRecord | undefined {
      return plugins.get(id)
    }
  }
}
