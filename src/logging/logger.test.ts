import { describe, expect, it } from 'bun:test'

import {
  createLogger,
  formatLogEntry,
  getMinimumLogLevelForEnvironment,
  type LogEntry,
} from './logger.js'

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
      minLevel: 'warn',
      writer: entry => entries.push(entry),
    })

    logger.debug('should not be written')
    logger.info('should not be written')
    logger.warn('should be written')

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

  it('redacts secrets from message and context before writing', () => {
    const entries: LogEntry[] = []
    const logger = createLogger({
      minLevel: 'debug',
      writer: entry => entries.push(entry),
    })

    logger.error('provider failed with Bearer sk-abc123', {
      api_key: 'secret-value',
      nested: {
        token: 'Bearer sk-abc123',
      },
    })

    const serialized = JSON.stringify(entries[0])
    expect(serialized).toContain('[REDACTED]')
    expect(serialized).not.toContain('sk-abc123')
    expect(serialized).not.toContain('secret-value')
  })

  it('supports text formatting for human-readable output', () => {
    const entry: LogEntry = {
      timestamp: '2026-05-16T00:00:00.000Z',
      level: 'info',
      subsystem: 'runtime-app',
      correlation_id: 'corr-1',
      message: 'ready',
      context: {
        phase: 'boot',
      },
    }

    expect(formatLogEntry(entry, 'text')).toBe(
      '2026-05-16T00:00:00.000Z INFO [runtime-app] (corr-1) ready {"phase":"boot"}',
    )
  })
})
