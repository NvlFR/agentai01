import type { Result } from '../shared/index.js'

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

/**
 * Validates if a string is a valid ChannelId (non-empty).
 */
export function isChannelId(value: unknown): value is ChannelId {
  return typeof value === 'string' && value.trim().length > 0
}
