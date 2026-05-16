import { describe, expect, it } from 'bun:test'

import {
  assertNoBoundaryViolation,
  constantTimeEquals,
  createAuditTrail,
  detectDangerousConfig,
  generateSecurityAuditReport,
  sanitizeInput,
  serializeAuditSafe,
  validateOperatorTokenMatch,
  validateOperatorToken,
  validateRuleMetadata,
} from './index.js'

describe('sanitizeInput', () => {
  it('removes null bytes and control characters idempotently', () => {
    const value = 'abc\u0000\u0007def'

    expect(sanitizeInput(value)).toBe('abcdef')
    expect(sanitizeInput(sanitizeInput(value))).toBe('abcdef')
  })
})

describe('assertNoBoundaryViolation', () => {
  it('accepts allowed import prefixes and rejects others', () => {
    expect(() =>
      assertNoBoundaryViolation('src/domain/types.js', ['src/domain/', 'src/shared/']),
    ).not.toThrow()

    expect(() =>
      assertNoBoundaryViolation('src/agents/ceo/runtime.js', ['src/domain/', 'src/shared/']),
    ).toThrow('Boundary violation')
  })
})

describe('audit utilities', () => {
  it('records structured audit events with safe metadata', () => {
    const trail = createAuditTrail()

    trail.auditLog({
      event_type: 'operator_action',
      actor: 'owner',
      outcome: 'ok',
      project_id: 'proj-1',
      metadata: {
        apiKey: 'sk-secret-token',
        detail: 'hello\u0000world',
      },
    })

    expect(trail.list()[0]).toMatchObject({
      event_type: 'operator_action',
      actor: 'owner',
      outcome: 'ok',
      project_id: 'proj-1',
      metadata: {
        apiKey: 'sk-***ken',
        detail: 'helloworld',
      },
    })
  })
})

describe('validation helpers', () => {
  it('validates operator token presence without exposing the token', () => {
    expect(validateOperatorToken(undefined)).toEqual({
      ok: false,
      error: 'missing',
    })
    expect(validateOperatorToken(' owner-token ')).toEqual({
      ok: true,
      value: 'owner-token',
    })
  })

  it('compares operator tokens with a constant-time helper', () => {
    expect(constantTimeEquals('same-token', 'same-token')).toBe(true)
    expect(constantTimeEquals('same-token', 'other-token')).toBe(false)
    expect(validateOperatorTokenMatch(' owner-token ', 'owner-token')).toEqual({
      ok: true,
      value: true,
    })
    expect(validateOperatorTokenMatch('owner-token', 'bad-token')).toEqual({
      ok: false,
      error: 'invalid',
    })
  })

  it('detects dangerous runtime config and emits audit reports', () => {
    const findings = detectDangerousConfig({
      appHost: '0.0.0.0',
      operatorToken: 'short',
      aiApiKey: '',
    })

    expect(findings.map(finding => finding.code)).toEqual([
      'public_bind',
      'weak_operator_token',
      'missing_ai_api_key',
    ])
    expect(generateSecurityAuditReport({ operatorToken: 'long-enough-token' })).toMatchObject({
      findings: [
        {
          code: 'missing_ai_api_key',
        },
      ],
    })
  })

  it('validates rule metadata fields', () => {
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

  it('serializes audit payloads safely', () => {
    expect(
      serializeAuditSafe({
        authorization: 'Bearer top-secret',
        nested: {
          note: 'safe\u0000text',
        },
      }),
    ).toEqual({
      authorization: 'Bea***ret',
      nested: {
        note: 'safetext',
      },
    })
  })
})
