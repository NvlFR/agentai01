import { describe, expect, it } from 'bun:test'

import {
  constantTimeEquals,
  validateOperatorToken,
  validateOperatorTokenMatch,
} from './operator-token.js'

describe('validateOperatorToken', () => {
  it('requires a non-empty token without exposing token value on failure', () => {
    expect(validateOperatorToken(undefined)).toEqual({
      ok: false,
      error: 'missing',
    })
    expect(validateOperatorToken(' owner-token ')).toEqual({
      ok: true,
      value: 'owner-token',
    })
  })
})

describe('constantTimeEquals', () => {
  it('compares tokens without short-circuiting on length differences', () => {
    expect(constantTimeEquals('same-token', 'same-token')).toBe(true)
    expect(constantTimeEquals('same-token', 'other-token')).toBe(false)
    expect(constantTimeEquals('short', 'longer-token')).toBe(false)
  })
})

describe('validateOperatorTokenMatch', () => {
  it('validates token matches using constant-time comparison', () => {
    expect(validateOperatorTokenMatch(' owner-token ', 'owner-token')).toEqual({
      ok: true,
      value: true,
    })
    expect(validateOperatorTokenMatch('owner-token', 'bad-token')).toEqual({
      ok: false,
      error: 'invalid',
    })
    expect(validateOperatorTokenMatch(undefined, 'bad-token')).toEqual({
      ok: false,
      error: 'missing',
    })
  })
})

