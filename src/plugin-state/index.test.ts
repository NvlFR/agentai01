import { describe, expect, test } from 'bun:test'
import { InMemoryPluginStateStore } from './index.js'

describe('plugin-state', () => {
  test('isolates state per plugin namespace and migrates versioned records', () => {
    const store = new InMemoryPluginStateStore()
    store.save({ plugin_id: 'calendar', namespace: 'tenant-a' }, { enabled: true }, 1)
    store.save({ plugin_id: 'calendar', namespace: 'tenant-b' }, { enabled: false }, 1)

    const migrated = store.migrate(
      { plugin_id: 'calendar', namespace: 'tenant-a' },
      2,
      [{
        from_version: 1,
        to_version: 2,
        migrate: state => ({ ...state, migrated: true }),
      }],
    )

    expect(migrated.ok).toBe(true)
    expect(migrated.ok ? migrated.value.state['migrated'] : false).toBe(true)
    expect(store.load({ plugin_id: 'calendar', namespace: 'tenant-b' }).ok).toBe(true)
  })
})
