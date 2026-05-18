import { createHmac, timingSafeEqual } from 'node:crypto'

import { HttpError } from '../http/errors.js'

export type WebhookProvider = 'telegram' | 'whatsapp'

export type WebhookGuardOptions = {
  provider: WebhookProvider
  secret: string | null | undefined
  nowMs?: number
  replayWindowMs?: number
}

export type VerifiedWebhook = {
  provider: WebhookProvider
  event_id: string
  timestamp: string
}

const DEFAULT_REPLAY_WINDOW_MS = 5 * 60_000
const seenEvents = new Map<string, number>()

export function verifySignedWebhook(
  request: Request,
  rawBody: string,
  options: WebhookGuardOptions,
): VerifiedWebhook {
  const secret = options.secret?.trim()
  if (!secret) {
    throw new HttpError(
      503,
      'webhook_unconfigured',
      `${options.provider} webhook verification secret is not configured.`,
    )
  }

  const eventId = request.headers.get('x-agentai-event-id')?.trim()
  const timestamp = request.headers.get('x-agentai-timestamp')?.trim()
  const signature = request.headers.get('x-agentai-signature')?.trim()

  if (!eventId || !timestamp || !signature) {
    throw new HttpError(
      401,
      'webhook_verification_failed',
      'Webhook signature, timestamp, and event id are required.',
    )
  }

  assertFreshTimestamp(timestamp, options.nowMs ?? Date.now(), options.replayWindowMs ?? DEFAULT_REPLAY_WINDOW_MS)
  assertSignature(secret, `${timestamp}.${rawBody}`, signature)
  claimEvent(`${options.provider}:${eventId}`, options.nowMs ?? Date.now(), options.replayWindowMs ?? DEFAULT_REPLAY_WINDOW_MS)

  return {
    provider: options.provider,
    event_id: eventId,
    timestamp,
  }
}

export function resetWebhookGuardMemory(): void {
  seenEvents.clear()
}

function assertFreshTimestamp(timestamp: string, nowMs: number, replayWindowMs: number): void {
  const parsed = Number(timestamp)
  if (!Number.isFinite(parsed)) {
    throw new HttpError(401, 'webhook_replay_rejected', 'Webhook timestamp is invalid.')
  }

  const timestampMs = parsed > 10_000_000_000 ? parsed : parsed * 1_000
  if (Math.abs(nowMs - timestampMs) > replayWindowMs) {
    throw new HttpError(401, 'webhook_replay_rejected', 'Webhook timestamp is outside the replay window.')
  }
}

function assertSignature(secret: string, payload: string, signatureHeader: string): void {
  const expected = createHmac('sha256', secret).update(payload).digest('hex')
  const received = signatureHeader.startsWith('sha256=')
    ? signatureHeader.slice('sha256='.length)
    : signatureHeader

  const expectedBuffer = Buffer.from(expected, 'hex')
  const receivedBuffer = Buffer.from(received, 'hex')
  if (
    expectedBuffer.length === 0 ||
    receivedBuffer.length === 0 ||
    expectedBuffer.length !== receivedBuffer.length ||
    !timingSafeEqual(expectedBuffer, receivedBuffer)
  ) {
    throw new HttpError(401, 'webhook_verification_failed', 'Webhook signature is invalid.')
  }
}

function claimEvent(key: string, nowMs: number, ttlMs: number): void {
  const cutoff = nowMs - ttlMs
  for (const [eventKey, seenAt] of seenEvents) {
    if (seenAt < cutoff) {
      seenEvents.delete(eventKey)
    }
  }

  if (seenEvents.has(key)) {
    throw new HttpError(409, 'webhook_replay_rejected', 'Webhook event was already processed.')
  }

  seenEvents.set(key, nowMs)
}
