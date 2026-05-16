// Adapted from referensi/openclaw/src/plugin-sdk/core.ts and referensi/openclaw/src/shared/gateway-bind-url.ts
export const DEFAULT_ACCOUNT_ID = 'default'

export type GatewayBindUrlResult =
  | {
      url: string
      source: 'gateway.bind=custom' | 'gateway.bind=tailnet' | 'gateway.bind=lan'
    }
  | {
      error: string
    }
  | null

export type RoutePeerKind = 'direct' | 'group' | 'channel'

export type RoutePeer = {
  kind: RoutePeerKind
  id: string
}

export function normalizeAccountId(value: string | null | undefined): string {
  const trimmed = (value ?? '').trim().toLowerCase()
  if (!trimmed) {
    return DEFAULT_ACCOUNT_ID
  }

  const normalized = trimmed.replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '')
  return normalized || DEFAULT_ACCOUNT_ID
}

export function resolveGatewayPort(value: unknown, fallback = 3000): number {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 65535) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value.trim(), 10)
    if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 65535) {
      return parsed
    }
  }

  return fallback
}

export function resolveGatewayBindUrl(params: {
  bind?: string
  customBindHost?: string
  scheme?: 'ws' | 'wss' | 'http' | 'https'
  port: number
  pickTailnetHost: () => string | null
  pickLanHost: () => string | null
}): GatewayBindUrlResult {
  const bind = (params.bind ?? 'loopback').trim().toLowerCase()
  const scheme = params.scheme ?? 'ws'

  if (bind === 'custom') {
    const host = normalizeHost(params.customBindHost)
    if (!host) {
      return { error: 'gateway.bind=custom requires gateway.customBindHost.' }
    }

    return { url: `${scheme}://${host}:${params.port}`, source: 'gateway.bind=custom' }
  }

  if (bind === 'tailnet') {
    const host = normalizeHost(params.pickTailnetHost())
    return host
      ? { url: `${scheme}://${host}:${params.port}`, source: 'gateway.bind=tailnet' }
      : { error: 'gateway.bind=tailnet set, but no tailnet host was found.' }
  }

  if (bind === 'lan') {
    const host = normalizeHost(params.pickLanHost())
    return host
      ? { url: `${scheme}://${host}:${params.port}`, source: 'gateway.bind=lan' }
      : { error: 'gateway.bind=lan set, but no LAN host was found.' }
  }

  return null
}

export function buildAgentSessionKey(params: {
  agentId: string
  channel: string
  accountId?: string | null
  peer?: RoutePeer | null
}): string {
  const agentId = normalizeKeyToken(params.agentId, 'main')
  const channel = normalizeKeyToken(params.channel, 'unknown')
  const accountId = normalizeAccountId(params.accountId)
  const peer = params.peer

  if (!peer) {
    return `${agentId}:${channel}:${accountId}:main`
  }

  return `${agentId}:${channel}:${accountId}:${peer.kind}:${normalizeKeyToken(peer.id, 'unknown')}`
}

export function resolveThreadSessionKeys(params: {
  baseSessionKey: string
  threadId?: string | number | null
  useSuffix?: boolean
  normalizeThreadId?: (threadId: string) => string
}): {
  baseSessionKey: string
  sessionKey: string
  threadId?: string
} {
  const baseSessionKey = params.baseSessionKey.trim()
  const rawThreadId = params.threadId == null ? '' : String(params.threadId).trim()
  if (!rawThreadId || params.useSuffix === false) {
    return { baseSessionKey, sessionKey: baseSessionKey }
  }

  const normalized = params.normalizeThreadId ? params.normalizeThreadId(rawThreadId) : rawThreadId.toLowerCase()
  if (!normalized) {
    return { baseSessionKey, sessionKey: baseSessionKey }
  }

  return {
    baseSessionKey,
    sessionKey: `${baseSessionKey}:thread:${normalized}`,
    threadId: normalized,
  }
}

function normalizeHost(value: string | null | undefined): string | null {
  const normalized = (value ?? '').trim()
  return normalized ? normalized : null
}

function normalizeKeyToken(value: string, fallback: string): string {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9:_-]+/g, '-').replace(/^-+|-+$/g, '')
  return normalized || fallback
}
