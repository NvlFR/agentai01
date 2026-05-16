import { describe, expect, it } from 'bun:test'

import {
  createAutoReplyAudit,
  createInMemoryReplyRateLimiter,
  evaluateAutoReplyPolicy,
  renderAutoReplyTemplate,
} from './index.js'

describe('auto-reply', () => {
  it('renders templates and audits policy decisions', () => {
    const audit = createAutoReplyAudit()
    const decision = evaluateAutoReplyPolicy({
      message: {
        id: 'msg-1',
        conversationId: 'chat-1',
        senderId: 'operator-1',
        text: 'hello',
        receivedAt: '2026-05-16T00:00:00.000Z',
      },
      policy: {
        enabled: true,
        templateId: 'ack',
        trigger: message => message.text.includes('hello'),
      },
      templates: new Map([['ack', { id: 'ack', body: 'Hi {{ senderId }}, received: {{text}}' }]]),
      rateLimiter: createInMemoryReplyRateLimiter({ windowMs: 60_000, maxReplies: 1 }),
      audit,
      nowMs: 1000,
    })

    expect(decision).toEqual({
      shouldReply: true,
      reason: 'matched_policy',
      templateId: 'ack',
      renderedText: 'Hi operator-1, received: hello',
    })
    expect(audit.list()[0]?.outcome).toBe('reply_ready')
  })

  it('rate limits per conversation', () => {
    const rateLimiter = createInMemoryReplyRateLimiter({ windowMs: 1000, maxReplies: 1 })
    expect(rateLimiter.allow('chat-1', 100)).toBe(true)
    expect(rateLimiter.allow('chat-1', 200)).toBe(false)
    expect(rateLimiter.allow('chat-1', 1200)).toBe(true)
  })

  it('omits unknown template variables safely', () => {
    expect(renderAutoReplyTemplate({ id: 'x', body: 'Hello {{name}} {{missing}}' }, { name: 'Ada' })).toBe('Hello Ada ')
  })
})
