// src/runtime-app/channels/whatsapp/whatsappChannel.test.ts

import { describe, it, expect } from 'bun:test'
import {
  validateWebhookSignature,
  parseInboundWebhook,
  handleWebhookVerification,
  handleInboundWebhook,
  type WhatsAppConfig,
  type WhatsAppChannelDeps,
  type WhatsAppInboundMessage,
} from './whatsappChannel.js'
import { createHmac } from 'node:crypto'

function makeConfig(allowedNumbers: string[] = []): WhatsAppConfig {
  return {
    token: 'test-token',
    phoneNumberId: '123456789',
    verifyToken: 'my-verify-token',
    allowedNumbers: new Set(allowedNumbers),
  }
}

function makeDeps(allowedNumbers: string[] = []): WhatsAppChannelDeps {
  return {
    config: makeConfig(allowedNumbers),
    sendMessage: () => Promise.resolve(),
  }
}

function makeSignature(body: string, secret: string): string {
  const hmac = createHmac('sha256', secret).update(body).digest('hex')
  return `sha256=${hmac}`
}

const samplePayload = {
  entry: [{
    changes: [{
      value: {
        messages: [{
          id: 'msg-1',
          from: '628123456789',
          timestamp: '1700000000',
          type: 'text',
          text: { body: 'Hello!' },
        }],
      },
    }],
  }],
}

describe('validateWebhookSignature', () => {
  it('returns true for valid signature', () => {
    const body = '{"test":true}'
    const sig = makeSignature(body, 'test-token')
    expect(validateWebhookSignature(body, sig, 'test-token')).toBe(true)
  })

  it('returns false for invalid signature', () => {
    expect(validateWebhookSignature('body', 'sha256=wrong', 'test-token')).toBe(false)
  })

  it('returns false for missing sha256= prefix', () => {
    expect(validateWebhookSignature('body', 'abc123', 'test-token')).toBe(false)
  })
})

describe('parseInboundWebhook', () => {
  it('parses valid text message', () => {
    const msgs = parseInboundWebhook(samplePayload)
    expect(msgs).toHaveLength(1)
    expect(msgs[0]?.text).toBe('Hello!')
    expect(msgs[0]?.from).toBe('628123456789')
  })

  it('returns empty array for non-message payload', () => {
    expect(parseInboundWebhook({})).toHaveLength(0)
    expect(parseInboundWebhook(null)).toHaveLength(0)
    expect(parseInboundWebhook({ entry: [] })).toHaveLength(0)
  })

  it('skips non-text message types', () => {
    const payload = {
      entry: [{
        changes: [{ value: { messages: [{ id: 'x', from: '123', type: 'image' }] } }],
      }],
    }
    expect(parseInboundWebhook(payload)).toHaveLength(0)
  })
})

describe('handleWebhookVerification', () => {
  it('returns challenge when tokens match', () => {
    const result = handleWebhookVerification(
      { 'hub.mode': 'subscribe', 'hub.verify_token': 'my-verify-token', 'hub.challenge': 'abc' },
      'my-verify-token',
    )
    expect(result).toBe('abc')
  })

  it('returns null when token mismatch', () => {
    const result = handleWebhookVerification(
      { 'hub.mode': 'subscribe', 'hub.verify_token': 'wrong', 'hub.challenge': 'abc' },
      'my-verify-token',
    )
    expect(result).toBeNull()
  })
})

describe('handleInboundWebhook', () => {
  it('calls onMessage for allowed numbers', () => {
    const received: WhatsAppInboundMessage[] = []
    const deps = makeDeps(['628123456789'])
    handleInboundWebhook(samplePayload, deps, msg => received.push(msg))
    expect(received).toHaveLength(1)
    expect(received[0]?.text).toBe('Hello!')
  })

  it('blocks messages from non-allowlisted numbers', () => {
    const received: WhatsAppInboundMessage[] = []
    const deps = makeDeps(['628999999999']) // different number
    handleInboundWebhook(samplePayload, deps, msg => received.push(msg))
    expect(received).toHaveLength(0)
  })

  it('allows all messages when allowlist is empty', () => {
    const received: WhatsAppInboundMessage[] = []
    const deps = makeDeps([]) // empty allowlist = allow all
    handleInboundWebhook(samplePayload, deps, msg => received.push(msg))
    expect(received).toHaveLength(1)
  })
})
