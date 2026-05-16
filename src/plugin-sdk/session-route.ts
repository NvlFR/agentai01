// Adapted from referensi/openclaw/src/plugin-sdk/core.ts (session route helpers)

export type RoutePeerKind = 'direct' | 'group' | 'channel'

export type ChannelOutboundSessionRoute = {
  /** Full session key including optional thread suffix. */
  sessionKey: string
  /** Base session key without thread suffix. */
  baseSessionKey: string
  peer: { kind: RoutePeerKind; id: string }
  chatType: 'direct' | 'group' | 'channel'
  from: string
  to: string
  threadId?: string | number
}

export type ThreadAwareOutboundSessionRouteThreadSource =
  | 'replyToId'
  | 'threadId'
  | 'currentSession'

export type ThreadAwareOutboundSessionRouteRecoveryContext = {
  route: ChannelOutboundSessionRoute
  currentBaseSessionKey: string
  currentThreadId: string
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function normalizeLowercase(value: string | null | undefined): string {
  return (value ?? '').toLowerCase()
}

/** Normalize a thread ID to a string suitable for session key suffix. */
function normalizeOutboundThreadId(
  threadId?: string | number | null,
): string | undefined {
  if (threadId == null) return undefined
  const str = String(threadId).trim()
  return str.length > 0 ? str : undefined
}

/**
 * Parse a session key that may contain a `:thread:<id>` suffix.
 * Returns `{ baseSessionKey, threadId }` — both undefined if no suffix found.
 */
function parseThreadSessionSuffix(sessionKey?: string | null): {
  baseSessionKey: string | undefined
  threadId: string | undefined
} {
  if (!sessionKey) return { baseSessionKey: undefined, threadId: undefined }
  const marker = ':thread:'
  const idx = sessionKey.lastIndexOf(marker)
  if (idx === -1) return { baseSessionKey: undefined, threadId: undefined }
  return {
    baseSessionKey: sessionKey.slice(0, idx),
    threadId: sessionKey.slice(idx + marker.length),
  }
}

/**
 * Build the session key and base session key for a thread-aware route.
 */
function resolveThreadSessionKeys(params: {
  baseSessionKey: string
  threadId?: string
  parentSessionKey?: string
  useSuffix?: boolean
  normalizeThreadId?: (threadId: string) => string
}): { sessionKey: string } {
  if (!params.threadId || params.useSuffix === false) {
    return { sessionKey: params.baseSessionKey }
  }
  const normalized = params.normalizeThreadId
    ? params.normalizeThreadId(params.threadId)
    : params.threadId.toLowerCase()
  return { sessionKey: `${params.baseSessionKey}:thread:${normalized}` }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build the canonical outbound session route payload returned by channel
 * message adapters.
 */
export function buildChannelOutboundSessionRoute(params: {
  agentId: string
  channel: string
  accountId?: string | null
  peer: { kind: RoutePeerKind; id: string }
  chatType: 'direct' | 'group' | 'channel'
  from: string
  to: string
  threadId?: string | number
}): ChannelOutboundSessionRoute {
  const accountPart = params.accountId ? `:${params.accountId}` : ''
  const baseSessionKey = `${params.agentId}:${params.channel}${accountPart}:${params.peer.kind}:${params.peer.id}`
  return {
    sessionKey: baseSessionKey,
    baseSessionKey,
    peer: params.peer,
    chatType: params.chatType,
    from: params.from,
    to: params.to,
    ...(params.threadId !== undefined ? { threadId: params.threadId } : {}),
  }
}

/**
 * Attempt to recover the thread ID from the current session key when the base
 * session matches the route's base session key.
 */
export function recoverCurrentThreadSessionId(params: {
  route: ChannelOutboundSessionRoute
  currentSessionKey?: string | null
  canRecover?: (context: ThreadAwareOutboundSessionRouteRecoveryContext) => boolean
}): string | undefined {
  const current = parseThreadSessionSuffix(params.currentSessionKey)
  if (!current.baseSessionKey || !current.threadId) return undefined
  if (
    normalizeLowercase(current.baseSessionKey) !==
    normalizeLowercase(params.route.baseSessionKey)
  ) {
    return undefined
  }
  const context: ThreadAwareOutboundSessionRouteRecoveryContext = {
    route: params.route,
    currentBaseSessionKey: current.baseSessionKey,
    currentThreadId: current.threadId,
  }
  if (params.canRecover && !params.canRecover(context)) return undefined
  return current.threadId
}

/**
 * Build a thread-aware outbound session route by resolving the best thread
 * candidate from replyToId, threadId, or the current session key.
 *
 * Default precedence: `['replyToId', 'threadId', 'currentSession']`
 */
export function buildThreadAwareOutboundSessionRoute(params: {
  route: ChannelOutboundSessionRoute
  replyToId?: string | number | null
  threadId?: string | number | null
  currentSessionKey?: string | null
  precedence?: readonly ThreadAwareOutboundSessionRouteThreadSource[]
  useSuffix?: boolean
  parentSessionKey?: string
  normalizeThreadId?: (threadId: string) => string
  canRecoverCurrentThread?: (context: ThreadAwareOutboundSessionRouteRecoveryContext) => boolean
}): ChannelOutboundSessionRoute {
  const recoveredThreadId = recoverCurrentThreadSessionId({
    route: params.route,
    currentSessionKey: params.currentSessionKey,
    canRecover: params.canRecoverCurrentThread,
  })

  type Candidate =
    | { routeThreadId: string | number; sessionThreadId: string }
    | undefined

  const resolveCandidate = (
    threadId?: string | number | null,
  ): Candidate => {
    const sessionThreadId = normalizeOutboundThreadId(threadId)
    if (sessionThreadId === undefined) return undefined
    return {
      routeThreadId: typeof threadId === 'number' ? threadId : sessionThreadId,
      sessionThreadId,
    }
  }

  const candidates: Record<ThreadAwareOutboundSessionRouteThreadSource, Candidate> = {
    replyToId: resolveCandidate(params.replyToId),
    threadId: resolveCandidate(params.threadId),
    currentSession: resolveCandidate(recoveredThreadId),
  }

  const precedence = params.precedence ?? ['replyToId', 'threadId', 'currentSession']
  const candidate = precedence.map((source) => candidates[source]).find(Boolean)

  const threadKeys = resolveThreadSessionKeys({
    baseSessionKey: params.route.baseSessionKey,
    threadId: candidate?.sessionThreadId,
    parentSessionKey: candidate ? params.parentSessionKey : undefined,
    useSuffix: params.useSuffix,
    normalizeThreadId: params.normalizeThreadId,
  })

  return {
    ...params.route,
    sessionKey: threadKeys.sessionKey,
    ...(candidate !== undefined ? { threadId: candidate.routeThreadId } : {}),
  }
}

/** Remove one of the known provider prefixes from a free-form target string. */
export function stripChannelTargetPrefix(raw: string, ...providers: string[]): string {
  const trimmed = raw.trim()
  for (const provider of providers) {
    const prefix = `${provider.toLowerCase()}:`
    if (trimmed.toLowerCase().startsWith(prefix)) {
      return trimmed.slice(prefix.length).trim()
    }
  }
  return trimmed
}

/** Remove generic target-kind prefixes such as `user:` or `group:`. */
export function stripTargetKindPrefix(raw: string): string {
  return raw.replace(/^(user|channel|group|conversation|room|dm):/i, '').trim()
}
