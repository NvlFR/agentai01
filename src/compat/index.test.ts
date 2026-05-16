import { describe, expect, it } from 'bun:test'

import { buildDeprecationMessage, createDeprecationTracker, migrateValue } from './index.js'

describe('compat helpers', () => {
  it('emits deprecation notices only once per id', () => {
    const notices: string[] = []
    const tracker = createDeprecationTracker(notice => notices.push(notice.id))

    tracker.warnOnce({
      id: 'old-config',
      deprecated: 'OLD_CONFIG',
      replacement: 'NEW_CONFIG',
      message: 'Runtime config moved.',
    })
    tracker.warnOnce({
      id: 'old-config',
      deprecated: 'OLD_CONFIG',
      replacement: 'NEW_CONFIG',
      message: 'Runtime config moved.',
    })

    expect(notices).toEqual(['old-config'])
  })

  it('builds explicit deprecation messages and migrates values', () => {
    expect(buildDeprecationMessage({
      id: 'x',
      deprecated: 'x',
      replacement: 'y',
      message: 'Remove before stable runtime.',
    })).toContain('Use y instead')

    const migrated = migrateValue({ port: '3000' }, [{
      from: 'v1',
      to: 'v2',
      migrate: value => ({ value, migrated: true }),
    }], 'v1')

    expect(migrated.version).toBe('v2')
    expect(migrated.migrated).toBe(true)
  })
})
