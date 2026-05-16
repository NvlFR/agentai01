import { describe, expect, it } from 'bun:test'

import { createSubsystemLogger } from './subsystem.js'
import type { LogEntry } from './logger.js'

describe('createSubsystemLogger', () => {
  it('binds subsystem to every log entry', () => {
    const entries: LogEntry[] = []
    const logger = createSubsystemLogger('telegram/network', {
      minLevel: 'debug',
      writer: entry => entries.push(entry),
    }).child({
      correlation_id: 'corr-1',
    })

    logger.info('connected')

    expect(entries[0]).toMatchObject({
      subsystem: 'telegram/network',
      correlation_id: 'corr-1',
      message: 'connected',
    })
  })
})
