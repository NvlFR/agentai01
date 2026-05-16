import { describe, expect, it } from 'bun:test'
import { authenticateChannelMessage } from './auth.js'
import type { ChannelMessage } from './types.js'

describe('src/channels/auth.ts', () => {
  const mockMessage: ChannelMessage = {
    id: 'msg-1',
    channelId: 'telegram',
    kind: 'telegram',
    direction: 'inbound',
    sender: { id: 'user-1', displayName: 'User One' },
    conversationId: 'chat-1',
    text: 'hello',
    receivedAt: '2026-05-16T12:00:00Z',
    raw: {},
    attachments: [],
    metadata: {}
  }

  it('allows message when channelId matches and no other constraints', () => {
    const result = authenticateChannelMessage({ channelId: 'telegram' }, mockMessage)
    expect(result).toEqual({ ok: true, value: mockMessage.sender })
  })

  it('rejects when channelId mismatches', () => {
    const result = authenticateChannelMessage({ channelId: 'whatsapp' }, mockMessage)
    expect(result).toEqual({ ok: false, error: 'channel_mismatch' })
  })

  it('enforces allowedPrincipalIds', () => {
    const context = {
      channelId: 'telegram',
      allowedPrincipalIds: new Set(['user-2'])
    }
    const result = authenticateChannelMessage(context, mockMessage)
    expect(result).toEqual({ ok: false, error: 'principal_not_allowed' })
    
    const contextOk = {
      channelId: 'telegram',
      allowedPrincipalIds: new Set(['user-1'])
    }
    expect(authenticateChannelMessage(contextOk, mockMessage).ok).toBe(true)
  })

  it('validates operator token if provided', () => {
    // In test environment, the operator token behavior might be mocked or use defaults.
    // Assuming security module is correctly implemented.
    // If OPERATOR_TOKEN is set, it might affect this.
    
    const context = {
      channelId: 'telegram',
      token: ''
    }
    const result = authenticateChannelMessage(context, mockMessage)
    // Depending on security module implementation, it might return 'missing_token'
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe('missing_token')
    }
  })
})
