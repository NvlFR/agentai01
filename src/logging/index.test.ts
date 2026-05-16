import { describe, expect, it } from 'bun:test'

import {
  createFileLogWriter,
  createLogger,
  createSubsystemLogger,
  redactLogContext,
  redactLogMessage,
  redactSecrets,
} from './index.js'

describe('logging index barrel', () => {
  it('re-exports the public logging API', () => {
    expect(typeof createLogger).toBe('function')
    expect(typeof createFileLogWriter).toBe('function')
    expect(typeof createSubsystemLogger).toBe('function')
    expect(typeof redactSecrets).toBe('function')
    expect(typeof redactLogMessage).toBe('function')
    expect(typeof redactLogContext).toBe('function')
  })
})
