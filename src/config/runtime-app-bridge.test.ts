import { describe, expect, it } from 'bun:test'

import {
  buildRuntimeAppConfigSource,
  parseSharedRuntimeFields,
  validateRuntimeEnvPreFlight,
} from './runtime-app-bridge.js'

describe('buildRuntimeAppConfigSource', () => {
  it('strips undefined values from env record', () => {
    const source = buildRuntimeAppConfigSource({
      APP_PORT: '3000',
      AI_MODEL: undefined,
      AI_BASE_URL: 'http://localhost:8045/v1',
    })

    expect(source['APP_PORT']).toBe('3000')
    expect(source['AI_BASE_URL']).toBe('http://localhost:8045/v1')
    expect('AI_MODEL' in source).toBe(false)
  })
})

describe('parseSharedRuntimeFields', () => {
  it('parses all shared fields from env source', () => {
    const source = buildRuntimeAppConfigSource({
      APP_ENV: 'production',
      APP_HOST: '0.0.0.0',
      APP_PORT: '8080',
      AI_BASE_URL: 'http://ai.example.com/v1',
      AI_MODEL: 'gpt-4o',
      AI_TIMEOUT_MS: '60000',
      AI_RETRY_LIMIT: '3',
      AI_LOG_LATENCY: 'false',
      QUEUE_CONCURRENCY: '4',
      QUEUE_RETRY_LIMIT: '5',
    })

    const result = parseSharedRuntimeFields(source)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.config.env).toBe('production')
      expect(result.config.host).toBe('0.0.0.0')
      expect(result.config.port).toBe(8080)
      expect(result.config.aiBaseUrl).toBe('http://ai.example.com/v1')
      expect(result.config.aiModel).toBe('gpt-4o')
      expect(result.config.aiTimeoutMs).toBe(60_000)
      expect(result.config.aiRetryLimit).toBe(3)
      expect(result.config.aiLogLatency).toBe(false)
      expect(result.config.queueConcurrency).toBe(4)
      expect(result.config.queueRetryLimit).toBe(5)
    }
  })

  it('applies defaults when env vars are absent', () => {
    const result = parseSharedRuntimeFields({})

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.config.env).toBe('development')
      expect(result.config.host).toBe('127.0.0.1')
      expect(result.config.port).toBe(3000)
      expect(result.config.aiBaseUrl).toBe('http://127.0.0.1:8045/v1')
      expect(result.config.aiModel).toBe('gpt-4.1-mini')
      expect(result.config.aiTimeoutMs).toBe(30_000)
      expect(result.config.aiRetryLimit).toBe(2)
      expect(result.config.aiLogLatency).toBe(true)
      expect(result.config.queueConcurrency).toBe(1)
      expect(result.config.queueRetryLimit).toBe(3)
    }
  })

  it('returns error for invalid port', () => {
    const result = parseSharedRuntimeFields({ APP_PORT: 'not-a-number' })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some(e => e.field === 'port')).toBe(true)
    }
  })
})

describe('validateRuntimeEnvPreFlight', () => {
  it('reports missing AI_API_KEY', () => {
    const result = validateRuntimeEnvPreFlight({})
    expect(result.ok).toBe(false)
    expect(result.missing).toContain('AI_API_KEY')
  })

  it('passes when AI_API_KEY is present', () => {
    const result = validateRuntimeEnvPreFlight({ AI_API_KEY: 'sk-test' })
    expect(result.ok).toBe(true)
    expect(result.missing).toHaveLength(0)
  })

  it('reports invalid APP_PORT', () => {
    const result = validateRuntimeEnvPreFlight({
      AI_API_KEY: 'sk-test',
      APP_PORT: '99999',
    })
    expect(result.ok).toBe(false)
    expect(result.missing).toContain('APP_PORT')
  })

  it('reports invalid AI_BASE_URL', () => {
    const result = validateRuntimeEnvPreFlight({
      AI_API_KEY: 'sk-test',
      AI_BASE_URL: 'not-a-url',
    })
    expect(result.ok).toBe(false)
    expect(result.missing).toContain('AI_BASE_URL')
  })
})
