// Adapted from referensi/openclaw/src/plugin-state/migrate.test.ts
import { describe, expect, test } from 'bun:test'
import { migrateRecord } from './migrate.js'
import type { PluginStateRecord } from './types.js'

describe('migrateRecord', () => {
  const record: PluginStateRecord = {
    key: { plugin_id: 'p1' },
    version: 1,
    state: { x: 1 },
    updated_at: 'now'
  }

  test('migrates through multiple versions', () => {
    const migrations = [
      { from_version: 1, to_version: 2, migrate: (s: any) => ({ ...s, y: 2 }) },
      { from_version: 2, to_version: 3, migrate: (s: any) => ({ ...s, z: 3 }) },
    ]
    const res = migrateRecord(record, 3, migrations, (k, s, v) => ({ key: k, state: s, version: v, updated_at: 'then' }))
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.value.version).toBe(3)
      expect(res.value.state).toEqual({ x: 1, y: 2, z: 3 })
    }
  })

  test('errors on missing migration', () => {
    const res = migrateRecord(record, 2, [], (k, s, v) => record)
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.error.code).toBe('migration-missing')
  })
})
