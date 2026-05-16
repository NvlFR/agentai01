import { err, isRecord, ok, type Result } from '../shared/index.js'
import { validateOperatorToken } from '../security/index.js'

export type ChannelId = string
export type ChannelKind = 'telegram' | 'whatsapp' | 'email' | 'web' | 'custom'
export type ChannelDirection = 'inbound' | 'outbound'
export type ChannelHealthStatus = 'healthy' | 'degraded' | 'unhealthy'

export type ChannelPrincipal = {
  id: string
  displayName?: string
}

export type ChannelAuthContext = {
  channelId: ChannelId
  token?: string
  allowedPrincipalIds?: ReadonlySet<string>
}

export type ChannelAttachment = {
  id: string
  mimeType: string
  url?: string
  name?: string
}

export type ChannelMessage = {
  id: string
  channelId: ChannelId
  kind: ChannelKind
  direction: ChannelDirection
  sender: ChannelPrincipal
  conversationId: string
  text: string
  receivedAt: string
  raw: unknown
  attachments: readonly ChannelAttachment[]
  metadata: Record<string, unknown>
}

export type RawChannelMessage = {
  id?: unknown
  kind?: unknown
  senderId?: unknown
  senderName?: unknown
  conversationId?: unknown
  text?: unknown
  receivedAt?: unknown
  attachments?: unknown
  metadata?: unknown
}

export type ChannelHealth = {
  channelId: ChannelId
  status: ChannelHealthStatus
  checkedAt: string
  detail?: string
}

export type InboundRouteDecision =
  | { route: 'accept'; message: ChannelMessage }
  | { route: 'reject'; reason: string; message?: ChannelMessage }

export type ChannelInboundHook = (message: ChannelMessage) => Promise<InboundRouteDecision> | InboundRouteDecision

export type ChannelAdapter = {
  id: ChannelId
  kind: ChannelKind
  normalize(input: unknown): Result<ChannelMessage, string[]>
  authenticate(context: ChannelAuthContext, message: ChannelMessage): Result<ChannelPrincipal, string>
  health(): Promise<ChannelHealth> | ChannelHealth
}

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

export function authenticateChannelMessage(
  context: ChannelAuthContext,
  message: ChannelMessage,
): Result<ChannelPrincipal, string> {
  if (context.channelId !== message.channelId) {
    return err('channel_mismatch')
  }

  if (context.allowedPrincipalIds && !context.allowedPrincipalIds.has(message.sender.id)) {
    return err('principal_not_allowed')
  }

  if (context.token !== undefined) {
    const token = validateOperatorToken(context.token)
    if (!token.ok) {
      return err('missing_token')
    }
  }

  return ok(message.sender)
}

export async function routeInboundMessage(
  adapter: ChannelAdapter,
  input: unknown,
  hook: ChannelInboundHook,
): Promise<InboundRouteDecision> {
  const normalized = adapter.normalize(input)
  if (!normalized.ok) {
    return { route: 'reject', reason: normalized.error.join(' ') }
  }

  return hook(normalized.value)
}

export function createChannelHealth(
  channelId: ChannelId,
  status: ChannelHealthStatus,
  detail?: string,
  now: () => Date = () => new Date(),
): ChannelHealth {
  return {
    channelId,
    status,
    detail,
    checkedAt: now().toISOString(),
  }
}

function readNonEmptyString(value: unknown, field: string, errors: string[]): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push(`Channel message field "${field}" is required.`)
    return ''
  }

  return value.trim()
}

function normalizeAttachments(input: unknown): readonly ChannelAttachment[] {
  if (!Array.isArray(input)) {
    return []
  }

  return input.flatMap(entry => {
    if (!isRecord(entry)) {
      return []
    }

    const id = typeof entry['id'] === 'string' ? entry['id'].trim() : ''
    const mimeType = typeof entry['mimeType'] === 'string' ? entry['mimeType'].trim() : ''
    if (!id || !mimeType) {
      return []
    }

    return [{
      id,
      mimeType,
      url: typeof entry['url'] === 'string' ? entry['url'] : undefined,
      name: typeof entry['name'] === 'string' ? entry['name'] : undefined,
    }]
  })
}
