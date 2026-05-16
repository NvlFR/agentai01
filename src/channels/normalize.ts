import { err, isRecord, ok, type Result } from '../shared/index.js'
import type { ChannelId, ChannelKind, ChannelMessage, RawChannelMessage } from './types.js'
import { normalizeAttachments } from './attachment.js'

/**
 * Normalizes a raw channel message input.
 * Returns an error if required fields are missing.
 */
export function normalizeChannelMessage(
  input: unknown,
  defaults: {
    channelId: ChannelId
    kind: ChannelKind
    now?: () => Date
  },
): Result<ChannelMessage, string[]> {
  if (!isRecord(input)) {
    return err(['Channel message must be an object.'])
  }

  const raw = input as RawChannelMessage
  const errors: string[] = []
  const id = readNonEmptyString(raw.id, 'id', errors)
  const senderId = readNonEmptyString(raw.senderId, 'senderId', errors)
  const conversationId = readNonEmptyString(raw.conversationId, 'conversationId', errors)
  const text = readNonEmptyString(raw.text, 'text', errors)
  const receivedAt = typeof raw.receivedAt === 'string' && raw.receivedAt.trim()
    ? raw.receivedAt.trim()
    : (defaults.now ?? (() => new Date()))().toISOString()

  if (errors.length > 0) {
    return err(errors)
  }

  return ok({
    id,
    channelId: defaults.channelId,
    kind: defaults.kind,
    direction: 'inbound',
    sender: {
      id: senderId,
      displayName: typeof raw.senderName === 'string' && raw.senderName.trim()
        ? raw.senderName.trim()
        : undefined,
    },
    conversationId,
    text,
    receivedAt,
    raw: input,
    attachments: normalizeAttachments(raw.attachments),
    metadata: isRecord(raw.metadata) ? raw.metadata : {},
  })
}

function readNonEmptyString(value: unknown, field: string, errors: string[]): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push(`Channel message field "${field}" is required.`)
    return ''
  }

  return value.trim()
}
