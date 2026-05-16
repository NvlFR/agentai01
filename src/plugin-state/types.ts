// Adapted from referensi/openclaw/src/plugin-state/types.ts
import type { JsonObject } from '../tools/index.js'

export type PluginStateKey = {
  readonly plugin_id: string
  readonly namespace?: string
}

export type PluginStateRecord = {
  readonly key: PluginStateKey
  readonly version: number
  readonly state: JsonObject
  readonly updated_at: string
}

export type PluginStateMigration = {
  readonly from_version: number
  readonly to_version: number
  readonly migrate: (state: JsonObject) => JsonObject
}

export type PluginStateError =
  | { readonly code: 'not-found'; readonly message: string }
  | { readonly code: 'migration-missing'; readonly message: string }
