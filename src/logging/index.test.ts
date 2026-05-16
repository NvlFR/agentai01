import { describe, expect, it } from 'bun:test'

import {
  createLogger,
  createSubsystemLogger,
  formatLogEntry,
  getMinimumLogLevelForEnvironment,
  redactLogContext,
  redactLogMessage,
  type LogEntry,
} from './index.js'

describe('getMinimumLogLevelForEnvironment', () => {
  it('uses debug for development, warn for test, and info for production', () => {
    expect(getMinimumLogLevelForEnvironment('development')).toBe('debug')
    expect(getMinimumLogLevelForEnvironment('test')).toBe('warn')
    expect(getMinimumLogLevelForEnvironment('production')).toBe('info')
  })
})

describe('createLogger', () => {
  it('filters entries below the minimum level', () => {
    const entries: LogEntry[] = []
    const logger = createLogger({
      minLevel: 'info',
      writer: entry => entries.push(entry),
    })

    logger.debug('should not be written')
    logger.info('should be written')

    expect(entries).toHaveLength(1)
    expect(entries[0]?.message).toBe('should be written')
  })

  it('adds child correlation_id and merged context to log entries', () => {
    const entries: LogEntry[] = []
    const logger = createLogger({
      minLevel: 'debug',
      writer: entry => entries.push(entry),
      bindings: {
        context: {
          component: 'runtime-telegram',
        },
      },
    }).child({
      correlation_id: 'corr-123',
      context: {
        phase: 'polling',
      },
    })

    logger.info('worker heartbeat', {
      queued_jobs: 2,
    })

    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({
      correlation_id: 'corr-123',
      context: {
        component: 'runtime-telegram',
        phase: 'polling',
        queued_jobs: 2,
      },
    })
  })

  it('supports subsystem loggers and development text formatting', () => {
    const entries: LogEntry[] = []
    const logger = createSubsystemLogger('runtime-app', {
      minLevel: 'debug',
      writer: entry => entries.push(entry),
    }).child({ correlation_id: 'corr-1' })

    logger.info('ready')

    expect(entries[0]).toMatchObject({
      subsystem: 'runtime-app',
      correlation_id: 'corr-1',
    })
    expect(formatLogEntry(entries[0]!, 'text')).toContain('[runtime-app]')
  })
})

describe('redaction', () => {
  it('redacts inline secrets in freeform messages', () => {
    expect(
      redactLogMessage('Bearer abc123 token=supersecret sk-test-value plain-text'),
    ).toBe('Bearer [REDACTED] token=[REDACTED] [REDACTED] plain-text')
  })

  it('redacts nested secret values in context objects', () => {
    expect(
      redactLogContext({
        apiKey: 'sk-secret',
        nested: {
          access_token: 'Bearer abc123',
          safe: 'visible',
        },
      }),
    ).toEqual({
      apiKey: '[REDACTED]',
      nested: {
        access_token: '[REDACTED]',
        safe: 'visible',
      },
    })
  })

  it('redacts errors and leaves non-secret values intact', () => {
    expect(
      redactLogContext({
        error: new Error('request failed for Bearer abc123'),
        count: 3,
      }),
    ).toEqual({
      error: {
        name: 'Error',
        message: 'request failed for Bearer [REDACTED]',
        stack: expect.any(String),
      },
      count: 3,
    })
  })
})
