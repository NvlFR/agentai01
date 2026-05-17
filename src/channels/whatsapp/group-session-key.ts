// Adapted using referensi/openclaw/extensions/whatsapp/src/group-session-key.ts
import {
  DEFAULT_ACCOUNT_ID,
  normalizeAccountId,
  resolveThreadSessionKeys,
} from '../../plugin-sdk/gateway-utils.js'

export type ResolvedAgentRoute = {
  sessionKey: string
  accountId: string
  agentId?: string
  channel?: string
}

function resolveWhatsAppGroupAccountThreadId(accountId: string): string {
  return `whatsapp-account-${normalizeAccountId(accountId)}`
}

/**
 * For legacy group session keys that were scoped with an account thread suffix,
 * strip the suffix and return the base session key.
 * Returns null if the key is not a legacy scoped group key.
 */
export function resolveWhatsAppLegacyGroupSessionKey(params: {
  sessionKey: string
  accountId?: string | null
}): string | null {
  const accountId = normalizeAccountId(params.accountId)
  if (!accountId || accountId === DEFAULT_ACCOUNT_ID || !params.sessionKey.includes(':group:')) {
    return null
  }
  const suffix = `:thread:${resolveWhatsAppGroupAccountThreadId(accountId)}`
  return params.sessionKey.endsWith(suffix)
    ? params.sessionKey.slice(0, -suffix.length)
    : null
}

/**
 * For non-default accounts, append an account-scoped thread suffix to group session keys.
 * Default account and non-group sessions are returned unchanged.
 */
export function resolveWhatsAppGroupSessionRoute(route: ResolvedAgentRoute): ResolvedAgentRoute {
  if (route.accountId === DEFAULT_ACCOUNT_ID || !route.sessionKey.includes(':group:')) {
    return route
  }
  const scopedSession = resolveThreadSessionKeys({
    baseSessionKey: route.sessionKey,
    threadId: resolveWhatsAppGroupAccountThreadId(route.accountId),
  })
  return {
    ...route,
    sessionKey: scopedSession.sessionKey,
  }
}

export const __testing = {
  resolveWhatsAppGroupAccountThreadId,
  resolveWhatsAppLegacyGroupSessionKey,
}
