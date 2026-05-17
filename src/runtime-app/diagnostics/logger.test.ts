// src/runtime-app/diagnostics/logger.test.ts

import { describe, it, expect, afterEach } from 'bun:test'
import { createLogger, rootLogger } from './logger.js'

describe('createLogger', () => {
  afterEach(() => {
    delete process.env['APP_ENV']
  })

  it('returns logger with debug/info/warn/error methods', () => {
    const logger = createLogger('test')
    expect(typeof logger.debug).toBe('function')
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.warn).toBe('function')
    expect(typeof logger.error).toBe('function')
  })

  it('returns logger with child method', () => {
    const logger = createLogger('test')
    expect(typeof logger.child).toBe('function')
  })

  it('child logger is a Logger', () => {
    const logger = createLogger('parent')
    const child = logger.child({ subsystem: 'child' })
    expect(typeof child.info).toBe('function')
    expect(typeof child.child).toBe('function')
  })

  it('child of child is a Logger', () => {
    const logger = createLogger('root')
    const child = logger.child({ a: 1 })
    const grandchild = child.child({ b: 2 })
    expect(typeof grandchild.info).toBe('function')
  })

  it('does not throw when logging', () => {
    const logger = createLogger('test')
    expect(() => logger.info('hello', { key: 'value' })).not.toThrow()
    expect(() => logger.warn('warn msg')).not.toThrow()
    expect(() => logger.error('error msg', new Error('oops'))).not.toThrow()
    expect(() => logger.debug('debug msg')).not.toThrow()
  })
})

describe('rootLogger', () => {
  it('is a Logger instance', () => {
    expect(typeof rootLogger.info).toBe('function')
    expect(typeof rootLogger.child).toBe('function')
  })
})
