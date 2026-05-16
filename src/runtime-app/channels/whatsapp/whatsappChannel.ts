// src/runtime-app/channels/whatsapp/whatsappChannel.ts
// WhatsApp channel — inbound/outbound via Meta WhatsApp Business API.
// Config: WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_VERIFY_TOKEN,
//         WHATSAPP_ALLOWED_NUMBERS (comma-separated)

import { createHmac } from 'node:crypto'

export type WhatsAppConfig = {
  token: string
  phoneNumberId: string
  verifyToken: string
  allowedNumbers: ReadonlySet<string>
}

export type WhatsAppInboundMessage = {
  from: string         // E.164 phone number
  messageId: string
  text: string
  timestamp: string
}

export type WhatsAppOutboundMessage = {
  to: string
  text: string
}

export type WhatsAppChannelDeps = {
  config: WhatsAppConfig
  sendMessage: (msg: WhatsAppOutboundMessage) => Promise<void>
  logger?: (entry: WhatsAppLogEntry) => void
}

export type WhatsAppLogEntry = {
  event:
    | 'whatsapp_inbound'
    | 'whatsapp_outbound'
    | 'whatsapp_ignored'
    | 'whatsapp_signature_invalid'
    | 'whatsapp_ack_sent'
  from?: string
  messageId?: string
  reason?: string
}

export function isWhatsAppEnabled(): boolean {
  return Boolean(
    process.env['WHATSAPP_TOKEN'] &&
    process.env['WHATSAPP_PHONE_NUMBER_ID'] &&
    process.env['WHATSAPP_VERIFY_TOKEN'],
  )
}

export function createWhatsAppConfigFromEnv(): WhatsAppConfig {
  const raw = process.env['WHATSAPP_ALLOWED_NUMBERS'] ?? ''
  const allowedNumbers = new Set(
    raw.split(',').map(s => s.trim()).filter(Boolean),
  )
  return {
    token: process.env['WHATSAPP_TOKEN'] ?? '',
    phoneNumberId: process.env['WHATSAPP_PHONE_NUMBER_ID'] ?? '',
    verifyToken: process.env['WHATSAPP_VERIFY_TOKEN'] ?? '',
    allowedNumbers,
  }
}

/**
 * Validate Meta webhook signature.
 * Meta sends X-Hub-Signature-256: sha256=<hmac> in the request.
 *
 * @param rawBody   Raw request body as Buffer or string
 * @param signature X-Hub-Signature-256 header value
 * @param token     WHATSAPP_TOKEN (app secret for signature verification)
 */
export function validateWebhookSignature(
  rawBody: string | Buffer,
  signature: string,
  token: string,
): boolean {
  if (!signature.startsWith('sha256=')) return false
  const expected = createHmac('sha256', token)
    .update(rawBody)
    .digest('hex')
  const provided = signature.slice('sha256='.length)
  // Constant-time comparison to prevent timing attacks.
  if (expected.length !== provided.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ provided.charCodeAt(i)
  }
  return diff === 0
}

/**
 * Parse inbound Meta webhook payload into normalized messages.
 * Returns empty array if payload is not a valid message event.
 */
export function parseInboundWebhook(payload: unknown): WhatsAppInboundMessage[] {
  const messages: WhatsAppInboundMessage[] = []
  if (typeof payload !== 'object' || payload === null) return messages

  const entry = (payload as {
    entry?: Array<{
      changes?: Array<{
        value?: {
          messages?: Array<{
            id?: string
            from?: string
            timestamp?: string
            type?: string
            text?: { body?: string }
          }>
        }
      }>
    }>
  }).entry

  if (!Array.isArray(entry)) return messages

  for (const e of entry) {
    for (const change of e.changes ?? []) {
      for (const msg of change.value?.messages ?? []) {
        if (msg.type !== 'text') continue
        if (!msg.from || !msg.id || !msg.text?.body) continue
        messages.push({
          from: msg.from,
          messageId: msg.id,
          text: msg.text.body,
          timestamp: msg.timestamp ?? new Date().toISOString(),
        })
      }
    }
  }

  return messages
}

/**
 * Send a text message via WhatsApp Cloud API.
 * Throws on non-2xx response.
 */
export async function sendWhatsAppMessage(
  msg: WhatsAppOutboundMessage,
  config: WhatsAppConfig,
  fetchFn: typeof fetch = fetch,
): Promise<void> {
  const url = `https://graph.facebook.com/v19.0/${config.phoneNumberId}/messages`
  const response = await fetchFn(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${config.token}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: msg.to,
      type: 'text',
      text: { body: msg.text },
    }),
  })

  if (!response.ok) {
    // Don't log raw response body — may contain sensitive data.
    throw new Error(`WhatsApp API error: HTTP ${response.status}`)
  }
}

/**
 * Handle a verified inbound webhook event.
 *
 * - Checks allowlist.
 * - Calls onMessage for each valid inbound message.
 * - Returns immediately (caller must ack within 5s).
 */
export function handleInboundWebhook(
  payload: unknown,
  deps: WhatsAppChannelDeps,
  onMessage: (msg: WhatsAppInboundMessage) => void,
): void {
  const messages = parseInboundWebhook(payload)

  for (const msg of messages) {
    if (
      deps.config.allowedNumbers.size > 0 &&
      !deps.config.allowedNumbers.has(msg.from)
    ) {
      deps.logger?.({
        event: 'whatsapp_ignored',
        from: msg.from,
        messageId: msg.messageId,
        reason: 'not in allowlist',
      })
      continue
    }

    deps.logger?.({
      event: 'whatsapp_inbound',
      from: msg.from,
      messageId: msg.messageId,
    })

    onMessage(msg)
  }
}

/**
 * Handle GET webhook verification challenge from Meta.
 * Returns the hub.challenge value if verify token matches, null otherwise.
 */
export function handleWebhookVerification(
  params: Record<string, string | undefined>,
  verifyToken: string,
): string | null {
  const mode = params['hub.mode']
  const token = params['hub.verify_token']
  const challenge = params['hub.challenge']

  if (mode === 'subscribe' && token === verifyToken && challenge) {
    return challenge
  }
  return null
}
