import { describe, expect, it } from 'bun:test'
import { normalizeChannelMessage } from './normalize.js'

describe('src/channels/normalize.ts', () => {
  it('normalizes valid input', () => {
    const input = {
      id: 'msg-1',
      senderId: 'user-1',
      senderName: 'User One',
      conversationId: 'chat-1',
      text: ' hello world ',
      receivedAt: '2026-05-16T10:00:00Z',
      attachments: [{ id: 'att-1', mimeType: 'image/jpeg' }],
      metadata: { key: 'value' }
    }
    const defaults = { channelId: 'telegram', kind: 'telegram' as const }
    const result = normalizeChannelMessage(input, defaults)
    
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual({
        id: 'msg-1',
        channelId: 'telegram',
        kind: 'telegram',
        direction: 'inbound',
        sender: { id: 'user-1', displayName: 'User One' },
        conversationId: 'chat-1',
        text: 'hello world',
        receivedAt: '2026-05-16T10:00:00Z',
        raw: input,
        attachments: [{ id: 'att-1', mimeType: 'image/jpeg' }],
        metadata: { key: 'value' }
      })
    }
  })

  it('rejects missing required fields', () => {
    const input = { id: ' ' }
    const result = normalizeChannelMessage(input, { channelId: 'web', kind: 'web' as const })
    
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('Channel message field "id" is required.')
      expect(result.error).toContain('Channel message field "senderId" is required.')
      expect(result.error).toContain('Channel message field "conversationId" is required.')
      expect(result.error).toContain('Channel message field "text" is required.')
    }
  })

  it('provides default receivedAt if missing', () => {
    const input = {
      id: 'msg-1',
      senderId: 'user-1',
      conversationId: 'chat-1',
      text: 'hi'
    }
    const now = () => new Date('2026-05-16T12:00:00Z')
    const result = normalizeChannelMessage(input, { channelId: 'web', kind: 'web' as const, now })
    
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.receivedAt).toBe('2026-05-16T12:00:00.000Z')
    }
  })

  it('rejects non-record input', () => {
    const result = normalizeChannelMessage(null, { channelId: 'web', kind: 'web' as const })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toEqual(['Channel message must be an object.'])
    }
  })
})
