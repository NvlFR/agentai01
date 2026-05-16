import { describe, expect, it } from 'bun:test'

import { assertNoBoundaryViolation, auditLog, createAuditTrail } from './index.js'

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

describe('createAuditTrail', () => {
  it('records structured audit events with sanitized metadata', () => {
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
        apiKey: '[REDACTED]',
        detail: 'helloworld',
      },
    })
  })
})

describe('auditLog', () => {
  it('normalizes event data before sending to a sink', () => {
    const events = [] as unknown[]

    auditLog(
      {
        event_type: 'operator\u0000_action',
        actor: 'own\u0007er',
        outcome: 'ok',
        timestamp: '2026-05-16T10:00:00.000Z\u0000',
        metadata: {
          token: 'secret',
        },
      },
      event => {
        events.push(event)
      },
    )

    expect(events).toEqual([
      {
        event_type: 'operator_action',
        actor: 'owner',
        outcome: 'ok',
        timestamp: '2026-05-16T10:00:00.000Z',
        metadata: {
          token: '[REDACTED]',
        },
      },
    ])
  })
})

