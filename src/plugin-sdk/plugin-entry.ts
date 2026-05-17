import type { JsonObject } from '../tools/index.js'
import type { ChannelPlugin, ProviderPlugin, ToolPlugin } from './types.js'

export const EMPTY_PLUGIN_CONFIG_SCHEMA = Object.freeze({}) as JsonObject

export type PluginRegistrationMode = 'cli-metadata' | 'discovery' | 'full'

export type PluginConfigSchema = JsonObject
export type PluginConfigSchemaResolver = () => PluginConfigSchema

export type PluginRegistrationApi = {
  readonly registrationMode: PluginRegistrationMode
  registerChannel?(registration: { readonly plugin: ChannelPlugin }): void
  registerProvider?(registration: { readonly plugin: ProviderPlugin }): void
  registerTool?(registration: { readonly plugin: ToolPlugin }): void
}

export type PluginRegistrationHook<TApi extends PluginRegistrationApi = PluginRegistrationApi> = (
  api: TApi,
) => void | Promise<void>

export type PluginEntry<TApi extends PluginRegistrationApi = PluginRegistrationApi> = {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly configSchema: PluginConfigSchemaResolver
  register(api: TApi): void | Promise<void>
}

export type DefinePluginEntryOptions<TApi extends PluginRegistrationApi = PluginRegistrationApi> = {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly configSchema?: PluginConfigSchema | PluginConfigSchemaResolver
  readonly register?: PluginRegistrationHook<TApi>
  readonly registerCliMetadata?: PluginRegistrationHook<TApi>
  readonly registerFull?: PluginRegistrationHook<TApi>
}

export type DefineChannelPluginEntryOptions<
  TPlugin extends ChannelPlugin,
  TApi extends PluginRegistrationApi = PluginRegistrationApi,
> = {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly plugin: TPlugin
  readonly configSchema?: PluginConfigSchema | PluginConfigSchemaResolver
  readonly registerCliMetadata?: PluginRegistrationHook<TApi>
  readonly registerFull?: PluginRegistrationHook<TApi>
}

export type ChannelPluginEntry<
  TPlugin extends ChannelPlugin,
  TApi extends PluginRegistrationApi = PluginRegistrationApi,
> = PluginEntry<TApi> & {
  readonly channelPlugin: TPlugin
}

export type SetupPluginEntry<TPlugin> = {
  readonly plugin: TPlugin
}

export function emptyPluginConfigSchema(): PluginConfigSchema {
  return EMPTY_PLUGIN_CONFIG_SCHEMA
}

export function definePluginEntry<TApi extends PluginRegistrationApi = PluginRegistrationApi>(
  options: DefinePluginEntryOptions<TApi>,
): PluginEntry<TApi> {
  const configSchema = createCachedConfigSchemaResolver(options.configSchema)
  const registerFull = options.registerFull ?? options.register ?? noopRegistrationHook<TApi>

  return {
    id: options.id.trim(),
    name: options.name.trim(),
    description: options.description.trim(),
    configSchema,
    async register(api: TApi): Promise<void> {
      if (api.registrationMode === 'cli-metadata') {
        await options.registerCliMetadata?.(api)
        return
      }

      if (api.registrationMode === 'discovery') {
        await options.registerCliMetadata?.(api)
        return
      }

      await options.registerCliMetadata?.(api)
      await registerFull(api)
    },
  }
}

export function defineChannelPluginEntry<
  TPlugin extends ChannelPlugin,
  TApi extends PluginRegistrationApi = PluginRegistrationApi,
>(
  options: DefineChannelPluginEntryOptions<TPlugin, TApi>,
): ChannelPluginEntry<TPlugin, TApi> {
  const entry = definePluginEntry<TApi>({
    id: options.id,
    name: options.name,
    description: options.description,
    ...(options.configSchema ? { configSchema: options.configSchema } : {}),
    registerCliMetadata: options.registerCliMetadata,
    async registerFull(api): Promise<void> {
      api.registerChannel?.({ plugin: options.plugin })
      await options.registerFull?.(api)
    },
  })

  return {
    ...entry,
    channelPlugin: options.plugin,
  }
}

export function defineSetupPluginEntry<TPlugin>(plugin: TPlugin): SetupPluginEntry<TPlugin> {
  return { plugin }
}

function createCachedConfigSchemaResolver(
  schema?: PluginConfigSchema | PluginConfigSchemaResolver,
): PluginConfigSchemaResolver {
  let cachedSchema: PluginConfigSchema | undefined

  return () => {
    if (cachedSchema) {
      return cachedSchema
    }

    cachedSchema = normalizeConfigSchema(typeof schema === 'function' ? schema() : schema)
    return cachedSchema
  }
}

function normalizeConfigSchema(schema?: PluginConfigSchema): PluginConfigSchema {
  return schema ?? emptyPluginConfigSchema()
}

function noopRegistrationHook<TApi extends PluginRegistrationApi>(_api: TApi): void {
  return
}
