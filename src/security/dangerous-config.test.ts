import { describe, expect, it } from 'bun:test'

import { detectDangerousConfig, generateSecurityAuditReport } from './dangerous-config.js'

describe('detectDangerousConfig', () => {
  it('reports findings for public bind, weak operator token, and missing AI key', () => {
    const findings = detectDangerousConfig({
      host: '0.0.0.0',
      operatorToken: 'dev',
      aiApiKey: '',
    })

    expect(findings.map(finding => finding.code)).toEqual([
      'public_bind',
      'weak_operator_token',
      'missing_ai_api_key',
    ])
  })

  it('keeps backward compatibility with appHost input', () => {
    expect(
      detectDangerousConfig({
        appHost: '0.0.0.0',
        operatorToken: 'long-enough-token',
        aiApiKey: 'present',
      }),
    ).toEqual([
      {
        code: 'public_bind',
        severity: 'warn',
        message: 'APP_HOST binds all interfaces; prefer 127.0.0.1 for local runtime.',
      },
    ])
  })
})

describe('generateSecurityAuditReport', () => {
  it('emits timestamped findings for current config state', () => {
    expect(generateSecurityAuditReport({ operatorToken: 'long-enough-token' })).toMatchObject({
      findings: [
        {
          code: 'missing_ai_api_key',
        },
      ],
    })
  })
})

