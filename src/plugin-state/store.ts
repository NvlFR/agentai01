// Adapted from referensi/openclaw/src/plugin-state/store.ts
import { err, ok, type Result } from '../shared/index.js'
import type { JsonObject } from '../tools/index.js'
import { migrateRecord } from './migrate.js'
import type { PluginStateError, PluginStateKey, PluginStateMigration, PluginStateRecord } from './types.js'

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

    return migrateRecord(loaded.value, targetVersion, migrations, (k, s, v) => this.save(k, s, v))
  }
}

export function stateKey(key: PluginStateKey): string {
  return `${key.plugin_id}:${key.namespace ?? 'default'}`
}
