import { describe, expect, it } from 'bun:test'

import { REDACT_PATTERNS, redactLogContext, redactLogMessage, redactSecrets } from './redaction.js'

describe('logging redaction safety', () => {
  it('exposes redact patterns and redacts bearer tokens in freeform text', () => {
    expect(REDACT_PATTERNS.length).toBeGreaterThan(0)
    expect(redactSecrets('Bearer sk-abc123')).toBe('Bearer [REDACTED]')
  })

  it('redacts JSON secret fields without breaking the string shape', () => {
    expect(redactSecrets('{"api_key":"secret"}')).toBe('{"api_key":"[REDACTED]"}')
  })

  it('redacts sk- secrets without leaking the original value', () => {
    const secret = 'sk-live-super-secret-token'
    const output = redactLogMessage(`provider failed with ${secret}`)

    expect(output).not.toContain(secret)
    expect(output).toContain('[REDACTED]')
  })

  it('redacts bearer tokens without leaking the original value', () => {
    const secret = 'Bearer this-is-sensitive'
    const output = redactLogMessage(`authorization=${secret}`)

    expect(output).not.toContain(secret)
    expect(output).toContain('[REDACTED]')
  })

  it('passes through non-secret strings unchanged', () => {
    const input = 'queue heartbeat healthy'
    expect(redactLogMessage(input)).toBe(input)
  })

  it('is idempotent across supported secret patterns', () => {
    const inputs = [
      'sk-test-secret',
      'Bearer abc123',
      'token=short1',
      'password=very-long-secret-value',
      'safe text',
    ]

    for (const input of inputs) {
      expect(redactLogMessage(redactLogMessage(input))).toBe(redactLogMessage(input))
    }
  })

  it('redacts short and long secret values inside nested payloads', () => {
    const shortSecret = 'abc123'
    const longSecret = 'sk-prod-1234567890'
    const payload = redactLogContext({
      operatorToken: shortSecret,
      nested: {
        apiKey: longSecret,
        headers: {
          authorization: `Bearer ${longSecret}`,
        },
      },
      safe: 'still-visible',
    })

    expect(JSON.stringify(payload)).not.toContain(shortSecret)
    expect(JSON.stringify(payload)).not.toContain(longSecret)
    expect(payload).toEqual({
      operatorToken: '[REDACTED]',
      nested: {
        apiKey: '[REDACTED]',
        headers: {
          authorization: '[REDACTED]',
        },
      },
      safe: 'still-visible',
    })
  })
})
