import { describe, expect, it } from 'bun:test'

import * as security from './index.js'

describe('security barrel exports', () => {
  it('re-exports the security public API', () => {
    expect(typeof security.createAuditTrail).toBe('function')
    expect(typeof security.auditLog).toBe('function')
    expect(typeof security.validateOperatorToken).toBe('function')
    expect(typeof security.validateOperatorTokenMatch).toBe('function')
    expect(typeof security.constantTimeEquals).toBe('function')
    expect(typeof security.detectDangerousConfig).toBe('function')
    expect(typeof security.generateSecurityAuditReport).toBe('function')
    expect(typeof security.sanitizeInput).toBe('function')
    expect(typeof security.serializeAuditSafe).toBe('function')
    expect(typeof security.validateRuleMetadata).toBe('function')
  })
})
