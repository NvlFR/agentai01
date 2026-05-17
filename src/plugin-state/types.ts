// Adapted using referensi/openclaw/src/plugin-state/types.ts
import type { JsonObject } from '../tools/index.js'

export const PLUGIN_STATE_ERROR_CODES = ['not-found', 'migration-missing'] as const

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

export function isPluginStateErrorCode(value: unknown): value is (typeof PLUGIN_STATE_ERROR_CODES)[number] {
  return typeof value === 'string' && PLUGIN_STATE_ERROR_CODES.includes(value as (typeof PLUGIN_STATE_ERROR_CODES)[number])
}
