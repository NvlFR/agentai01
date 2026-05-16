import { describe, expect, it } from 'bun:test'
import {
  buildApprovalPendingReplyPayload,
  buildApprovalResolvedReplyPayload,
  buildPluginApprovalPendingReplyPayload,
  buildPluginApprovalResolvedReplyPayload,
  type PluginApprovalRequest,
  type PluginApprovalResolved,
} from './approval-renderers.js'

describe('buildApprovalPendingReplyPayload', () => {
  it('builds payload with default allowed decisions', () => {
    const payload = buildApprovalPendingReplyPayload({
      approvalId: 'approval-123',
      approvalSlug: 'a',
      text: 'Approval required @everyone',
    })

    expect(payload.text).toContain('@everyone')
    expect(payload.interactive).toEqual({
      blocks: [
        {
          type: 'buttons',
          buttons: [
            { label: 'Allow Once', value: '/approve approval-123 allow-once', style: 'success' },
            { label: 'Allow Always', value: '/approve approval-123 allow-always', style: 'primary' },
            { label: 'Deny', value: '/approve approval-123 deny', style: 'danger' },
          ],
        },
      ],
    })
    expect(payload.channelData?.execApproval).toMatchObject({
      approvalId: 'approval-123',
      approvalSlug: 'a',
      approvalKind: 'exec',
      state: 'pending',
    })
  })

  it('uses provided allowedDecisions', () => {
    const payload = buildApprovalPendingReplyPayload({
      approvalId: 'req-1',
      approvalSlug: 'r',
      text: 'Approve?',
      allowedDecisions: ['allow-once', 'deny'],
    })

    expect(payload.interactive?.blocks[0].buttons).toHaveLength(2)
    expect(payload.interactive?.blocks[0].buttons[0].value).toBe('/approve req-1 allow-once')
    expect(payload.interactive?.blocks[0].buttons[1].value).toBe('/approve req-1 deny')
  })

  it('includes agentId and sessionKey when provided', () => {
    const payload = buildApprovalPendingReplyPayload({
      approvalId: 'req-2',
      approvalSlug: 'r2',
      text: 'Approve?',
      agentId: 'agent-1',
      sessionKey: 'session-abc',
    })

    const execApproval = payload.channelData?.execApproval as Record<string, unknown>
    expect(execApproval.agentId).toBe('agent-1')
    expect(execApproval.sessionKey).toBe('session-abc')
  })

  it('normalizes null agentId and sessionKey to undefined', () => {
    const payload = buildApprovalPendingReplyPayload({
      approvalId: 'req-3',
      approvalSlug: 'r3',
      text: 'Approve?',
      agentId: null,
      sessionKey: null,
    })

    const execApproval = payload.channelData?.execApproval as Record<string, unknown>
    expect(execApproval.agentId).toBeUndefined()
    expect(execApproval.sessionKey).toBeUndefined()
  })

  it('merges extra channelData', () => {
    const payload = buildApprovalPendingReplyPayload({
      approvalId: 'req-4',
      approvalSlug: 'r4',
      text: 'Approve?',
      channelData: { telegram: { quoteText: 'quoted' } },
    })

    expect((payload.channelData as Record<string, unknown>).telegram).toEqual({
      quoteText: 'quoted',
    })
  })
})

describe('buildApprovalResolvedReplyPayload', () => {
  it('builds resolved payload without interactive block', () => {
    const payload = buildApprovalResolvedReplyPayload({
      approvalId: 'req-123',
      approvalSlug: 'req-123',
      text: 'resolved @everyone',
    })

    expect(payload.text).toBe('resolved @everyone')
    expect(payload.interactive).toBeUndefined()
    expect(payload.channelData?.execApproval).toEqual({
      approvalId: 'req-123',
      approvalSlug: 'req-123',
      state: 'resolved',
    })
  })
})

describe('buildPluginApprovalPendingReplyPayload', () => {
  const baseRequest: PluginApprovalRequest = {
    id: 'plugin-approval-123',
    request: {
      title: 'Sensitive action',
      description: 'Needs approval',
    },
    createdAtMs: 1_000,
    expiresAtMs: 61_000,
  }

  it('builds pending payload with generated text', () => {
    const payload = buildPluginApprovalPendingReplyPayload({
      request: baseRequest,
      nowMs: 1_000,
    })

    expect(payload.text).toContain('Plugin approval required')
    expect(payload.text).toContain('Sensitive action')
    expect(payload.text).toContain('Expires in: 60s')
    expect(payload.text).toContain('Reply with: /approve <id> allow-once|allow-always|deny')
  })

  it('uses custom approvalSlug', () => {
    const payload = buildPluginApprovalPendingReplyPayload({
      request: baseRequest,
      nowMs: 1_000,
      approvalSlug: 'custom-slug',
    })

    const execApproval = payload.channelData?.execApproval as Record<string, unknown>
    expect(execApproval.approvalSlug).toBe('custom-slug')
  })

  it('defaults approvalSlug to first 8 chars of id', () => {
    const payload = buildPluginApprovalPendingReplyPayload({
      request: baseRequest,
      nowMs: 1_000,
    })

    const execApproval = payload.channelData?.execApproval as Record<string, unknown>
    expect(execApproval.approvalSlug).toBe('plugin-a')
  })

  it('uses request-scoped allowedDecisions', () => {
    const request: PluginApprovalRequest = {
      ...baseRequest,
      request: {
        ...baseRequest.request,
        allowedDecisions: ['allow-once', 'deny'],
      },
    }
    const payload = buildPluginApprovalPendingReplyPayload({ request, nowMs: 1_000 })

    expect(payload.text).toContain('Reply with: /approve <id> allow-once|deny')
    expect(payload.interactive?.blocks[0].buttons).toHaveLength(2)
  })

  it('merges extra channelData', () => {
    const payload = buildPluginApprovalPendingReplyPayload({
      request: baseRequest,
      nowMs: 1_000,
      channelData: { telegram: { quoteText: 'quoted' } },
    })

    expect((payload.channelData as Record<string, unknown>).telegram).toEqual({
      quoteText: 'quoted',
    })
  })

  it('sets approvalKind to plugin', () => {
    const payload = buildPluginApprovalPendingReplyPayload({
      request: baseRequest,
      nowMs: 1_000,
    })

    const execApproval = payload.channelData?.execApproval as Record<string, unknown>
    expect(execApproval.approvalKind).toBe('plugin')
  })
})

describe('buildPluginApprovalResolvedReplyPayload', () => {
  const resolved: PluginApprovalResolved = {
    id: 'plugin-approval-123',
    decision: 'allow-once',
    resolvedBy: 'discord:user:1',
    ts: 2_000,
  }

  it('builds resolved payload with generated text', () => {
    const payload = buildPluginApprovalResolvedReplyPayload({ resolved })

    expect(payload.text).toContain('Plugin approval allowed once')
    expect(payload.text).toContain('Resolved by discord:user:1')
    expect(payload.text).toContain('ID: plugin-approval-123')
  })

  it('defaults approvalSlug to first 8 chars of id', () => {
    const payload = buildPluginApprovalResolvedReplyPayload({ resolved })

    const execApproval = payload.channelData?.execApproval as Record<string, unknown>
    expect(execApproval.approvalSlug).toBe('plugin-a')
    expect(execApproval.state).toBe('resolved')
  })

  it('merges extra channelData', () => {
    const payload = buildPluginApprovalResolvedReplyPayload({
      resolved,
      channelData: { discord: { components: [{ type: 'container' }] } },
    })

    expect((payload.channelData as Record<string, unknown>).discord).toEqual({
      components: [{ type: 'container' }],
    })
  })

  it('handles deny decision', () => {
    const payload = buildPluginApprovalResolvedReplyPayload({
      resolved: { ...resolved, decision: 'deny', resolvedBy: null },
    })

    expect(payload.text).toContain('Plugin approval denied')
    expect(payload.text).not.toContain('Resolved by')
  })
})
