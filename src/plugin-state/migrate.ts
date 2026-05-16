// Adapted from referensi/openclaw/src/plugin-state/migrate.ts
import { err, ok, type Result } from '../shared/index.js'
import type { JsonObject } from '../tools/index.js'
import type { PluginStateError, PluginStateKey, PluginStateMigration, PluginStateRecord } from './types.js'

export function migrateRecord(
  record: PluginStateRecord,
  targetVersion: number,
  migrations: readonly PluginStateMigration[],
  save: (key: PluginStateKey, state: JsonObject, version: number) => PluginStateRecord,
): Result<PluginStateRecord, PluginStateError> {
  let current = record
  while (current.version < targetVersion) {
    const migration = migrations.find(entry => entry.from_version === current.version)
    if (!migration) {
      return err({
        code: 'migration-missing',
        message: `Missing migration from version ${current.version} for plugin "${current.key.plugin_id}".`,
      })
    }

    current = save(current.key, migration.migrate(current.state), migration.to_version)
  }

  return ok(current)
}
