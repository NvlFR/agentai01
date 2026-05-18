import { createHmac } from 'node:crypto'
import { describe, expect, it, beforeEach } from 'bun:test'

import { HttpError } from '../http/errors.js'
import { resetWebhookGuardMemory, verifySignedWebhook } from './webhookGuard.js'

const SECRET = 'webhook-secret-test'
const NOW_MS = Date.parse('2026-05-18T10:00:00.000Z')
const TIMESTAMP = String(Math.floor(NOW_MS / 1_000))

beforeEach(() => {
  resetWebhookGuardMemory()
})

describe('verifySignedWebhook', () => {
  it('accepts a fresh signed webhook once', () => {
    const rawBody = JSON.stringify({ message: 'run status' })
    const request = signedRequest(rawBody, 'evt-1', TIMESTAMP)

    const verified = verifySignedWebhook(request, rawBody, {
      provider: 'telegram',
      secret: SECRET,
      nowMs: NOW_MS,
    })

    expect(verified).toEqual({
      provider: 'telegram',
      event_id: 'evt-1',
      timestamp: TIMESTAMP,
    })
  })

  it('rejects duplicate event ids', () => {
    const rawBody = JSON.stringify({ message: 'run status' })
    const request = signedRequest(rawBody, 'evt-1', TIMESTAMP)

    verifySignedWebhook(request, rawBody, {
      provider: 'whatsapp',
      secret: SECRET,
      nowMs: NOW_MS,
    })

    expect(() =>
      verifySignedWebhook(request, rawBody, {
        provider: 'whatsapp',
        secret: SECRET,
        nowMs: NOW_MS,
      }),
    ).toThrow(HttpError)
  })

  it('rejects stale timestamps', () => {
    const rawBody = JSON.stringify({ message: 'run status' })
    const staleTimestamp = String(Math.floor((NOW_MS - 10 * 60_000) / 1_000))
    const request = signedRequest(rawBody, 'evt-stale', staleTimestamp)

    expect(() =>
      verifySignedWebhook(request, rawBody, {
        provider: 'telegram',
        secret: SECRET,
        nowMs: NOW_MS,
      }),
    ).toThrow('Webhook timestamp is outside the replay window.')
  })

  it('rejects invalid signatures', () => {
    const rawBody = JSON.stringify({ message: 'run status' })
    const request = new Request('http://localhost/api/telegram/webhook', {
      method: 'POST',
      headers: {
        'x-agentai-event-id': 'evt-bad-sig',
        'x-agentai-timestamp': TIMESTAMP,
        'x-agentai-signature': 'sha256:bad',
      },
      body: rawBody,
    })

    expect(() =>
      verifySignedWebhook(request, rawBody, {
        provider: 'telegram',
        secret: SECRET,
        nowMs: NOW_MS,
      }),
    ).toThrow('Webhook signature is invalid.')
  })
})

function signedRequest(rawBody: string, eventId: string, timestamp: string): Request {
  return new Request('http://localhost/api/telegram/webhook', {
    method: 'POST',
    headers: {
      'x-agentai-event-id': eventId,
      'x-agentai-timestamp': timestamp,
      'x-agentai-signature': `sha256=${createHmac('sha256', SECRET).update(`${timestamp}.${rawBody}`).digest('hex')}`,
    },
    body: rawBody,
  })
}
