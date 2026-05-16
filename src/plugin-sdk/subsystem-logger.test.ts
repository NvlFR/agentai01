import { describe, expect, it } from 'bun:test'

import { createSubsystemLogger } from './subsystem-logger.js'

describe('subsystem-logger', () => {
  it('binds subsystem metadata to log entries', () => {
    const entries: string[] = []
    const logger = createSubsystemLogger('telegram/network', {
      writer(entry) {
        entries.push(JSON.stringify(entry))
      },
    })

    logger.info('ready', { api_key: 'secret-key' })

    expect(entries).toHaveLength(1)
    expect(entries[0]).toContain('"subsystem":"telegram/network"')
    expect(entries[0]).toContain('[REDACTED]')
  })
})
