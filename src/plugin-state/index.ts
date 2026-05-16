import { err, ok, type Result } from '../shared/index.js'
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

export class InMemoryPluginStateStore {
  readonly #records = new Map<string, PluginStateRecord>()
  readonly #now: () => Date

  constructor(options: { readonly now?: () => Date } = {}) {
    this.#now = options.now ?? (() => new Date())
  }

  load(key: PluginStateKey): Result<PluginStateRecord, PluginStateError> {
    const record = this.#records.get(stateKey(key))
    return record
      ? ok(record)
      : err({ code: 'not-found', message: `State for plugin "${key.plugin_id}" is not stored.` })
  }

  save(key: PluginStateKey, state: JsonObject, version: number): PluginStateRecord {
    const record: PluginStateRecord = {
      key,
      state,
      version,
      updated_at: this.#now().toISOString(),
    }
    this.#records.set(stateKey(key), record)
    return record
  }

  migrate(
    key: PluginStateKey,
    targetVersion: number,
    migrations: readonly PluginStateMigration[],
  ): Result<PluginStateRecord, PluginStateError> {
    const loaded = this.load(key)
    if (!loaded.ok) {
      return loaded
    }

    let current = loaded.value
    while (current.version < targetVersion) {
      const migration = migrations.find(entry => entry.from_version === current.version)
      if (!migration) {
        return err({
          code: 'migration-missing',
          message: `Missing migration from version ${current.version} for plugin "${key.plugin_id}".`,
        })
      }

      current = this.save(key, migration.migrate(current.state), migration.to_version)
    }

    return ok(current)
  }
}

function stateKey(key: PluginStateKey): string {
  return `${key.plugin_id}:${key.namespace ?? 'default'}`
}
