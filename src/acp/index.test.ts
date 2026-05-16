import { describe, expect, it } from 'bun:test'

import {
  createAcpAudit,
  createApprovalRequest,
  decideApproval,
  validateAcpMessage,
} from './index.js'

describe('acp', () => {
  it('validates message shape before approval flow', () => {
    const message = validateAcpMessage({
      id: 'acp-1',
      kind: 'approval_request',
      from: 'engineering',
      to: 'owner',
      payload: { action: 'deploy' },
    }, () => new Date('2026-05-16T00:00:00.000Z'))

    expect(message).toEqual({
      ok: true,
      value: {
        id: 'acp-1',
        kind: 'approval_request',
        from: 'engineering',
        to: 'owner',
        createdAt: '2026-05-16T00:00:00.000Z',
        payload: { action: 'deploy' },
      },
    })
  })

  it('audits approval request and decision', () => {
    const audit = createAcpAudit()
    const messageResult = validateAcpMessage({
      id: 'acp-2',
      kind: 'approval_request',
      from: 'sales',
      to: 'owner',
      payload: {},
    })

    expect(messageResult.ok).toBe(true)
    if (messageResult.ok) {
      const approval = createApprovalRequest({
        id: 'approval-1',
        message: messageResult.value,
        reason: 'proposal_final',
        audit,
      })
      const decided = decideApproval(approval, {
        approved: true,
        decidedBy: 'owner',
        now: () => new Date('2026-05-16T01:00:00.000Z'),
        audit,
      })

      expect(decided.status).toBe('approved')
      expect(audit.list().map(event => event.event_type)).toEqual([
        'acp_approval_requested',
        'acp_approval_decided',
      ])
    }
  })

  it('rejects malformed messages', () => {
    expect(validateAcpMessage({ kind: 'bad' })).toEqual({
      ok: false,
      error: [
        'ACP message field "id" is required.',
        'ACP message field "kind" is invalid.',
        'ACP message field "from" is required.',
        'ACP message field "to" is required.',
      ],
    })
  })
})
