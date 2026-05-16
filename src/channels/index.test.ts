import { describe, expect, it } from 'bun:test'

import {
  authenticateChannelMessage,
  createChannelHealth,
  normalizeChannelMessage,
  routeInboundMessage,
  type ChannelAdapter,
} from './index.js'

describe('channels', () => {
  it('normalizes inbound shape before routing', async () => {
    const adapter: ChannelAdapter = {
      id: 'telegram-main',
      kind: 'telegram',
      normalize(input) {
        return normalizeChannelMessage(input, {
          channelId: 'telegram-main',
          kind: 'telegram',
          now: () => new Date('2026-05-16T00:00:00.000Z'),
        })
      },
      authenticate(context, message) {
        return authenticateChannelMessage(context, message)
      },
      health() {
        return createChannelHealth('telegram-main', 'healthy', undefined, () => new Date('2026-05-16T00:00:00.000Z'))
      },
    }

    const decision = await routeInboundMessage(
      adapter,
      { id: 'msg-1', senderId: 'operator-1', conversationId: 'chat-1', text: ' run check ' },
      message => ({ route: 'accept', message }),
    )

    expect(decision).toMatchObject({
      route: 'accept',
      message: {
        id: 'msg-1',
        channelId: 'telegram-main',
        text: 'run check',
        receivedAt: '2026-05-16T00:00:00.000Z',
      },
    })
  })

  it('rejects malformed messages and unauthorized principals', () => {
    expect(normalizeChannelMessage({}, { channelId: 'web', kind: 'web' })).toEqual({
      ok: false,
      error: [
        'Channel message field "id" is required.',
        'Channel message field "senderId" is required.',
        'Channel message field "conversationId" is required.',
        'Channel message field "text" is required.',
      ],
    })

    const normalized = normalizeChannelMessage(
      { id: 'msg-1', senderId: 'user-2', conversationId: 'chat', text: 'hello' },
      { channelId: 'web', kind: 'web' },
    )
    expect(normalized.ok).toBe(true)
    if (normalized.ok) {
      expect(authenticateChannelMessage({
        channelId: 'web',
        allowedPrincipalIds: new Set(['user-1']),
      }, normalized.value)).toEqual({ ok: false, error: 'principal_not_allowed' })
    }
  })
})
