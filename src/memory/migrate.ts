import type { MemoryFileRecord, MemoryMigration, MemoryNamespace } from './types.js'
import { readMemoryVersion, withMemoryVersion } from './record.js'
import type { MemoryFileStore } from './store.js'

export async function migrate(
  store: MemoryFileStore,
  namespace: MemoryNamespace,
  migrations: readonly MemoryMigration[],
): Promise<MemoryFileRecord[]> {
  const records = await store.list(namespace)
  const migrated: MemoryFileRecord[] = []

  for (const record of records) {
    const version = readMemoryVersion(record.value)
    const chain = migrations
      .filter(migration => migration.fromVersion >= version)
      .sort((left, right) => left.fromVersion - right.fromVersion)

    let value = record.value
    let currentVersion = version
    for (const migration of chain) {
      if (migration.fromVersion !== currentVersion) {
        continue
      }

      value = migration.migrate(value)
      currentVersion = migration.toVersion
    }

    if (currentVersion !== version) {
      migrated.push(await store.write(namespace, record.key, withMemoryVersion(value, currentVersion)))
    }
  }

  return migrated
}
