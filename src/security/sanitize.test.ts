import { describe, expect, it } from 'bun:test'

import { sanitizeInput, serializeAuditSafe, validateRuleMetadata } from './sanitize.js'

describe('sanitizeInput', () => {
  it('removes null bytes and control characters idempotently', () => {
    const value = 'abc\u0000\u0007def'

    expect(sanitizeInput(value)).toBe('abcdef')
    expect(sanitizeInput(sanitizeInput(value))).toBe('abcdef')
  })
})

describe('serializeAuditSafe', () => {
  it('redacts secret-looking keys and sanitizes non-secret strings', () => {
    expect(
      serializeAuditSafe({
        authorization: 'Bearer top-secret',
        api_key: 'secret',
        nested: {
          note: 'safe\u0000text',
        },
      }),
    ).toEqual({
      authorization: '[REDACTED]',
      api_key: '[REDACTED]',
      nested: {
        note: 'safetext',
      },
    })
  })
})

describe('validateRuleMetadata', () => {
  it('accepts valid rule metadata', () => {
    expect(
      validateRuleMetadata({
        id: 'rule.id',
        message: 'msg',
        severity: 'ERROR',
        languages: ['ts'],
      }),
    ).toEqual({
      ok: true,
      value: {
        id: 'rule.id',
        message: 'msg',
        severity: 'ERROR',
        languages: ['ts'],
      },
    })
  })

  it('returns field-level errors for invalid metadata', () => {
    expect(validateRuleMetadata({})).toEqual({
      ok: false,
      error: [
        'Rule metadata field "id" is required.',
        'Rule metadata field "message" is required.',
        'Rule metadata field "severity" is required.',
        'Rule metadata field "languages" must contain at least one language.',
      ],
    })
  })
})

