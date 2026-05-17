// Adapted using referensi/openclaw/extensions/whatsapp/src/inbound/dedupe.ts

const RECENT_INBOUND_TTL_MS = 20 * 60_000
const RECENT_INBOUND_MAX = 5000
const RECENT_OUTBOUND_TTL_MS = 20 * 60_000
const RECENT_OUTBOUND_MAX = 5000

// ---------------------------------------------------------------------------
// Internal cache factory
// ---------------------------------------------------------------------------

type CacheEntry = { key: string; claimedAtMs: number; committed: boolean }

type ClaimResult = { kind: 'claimed' } | { kind: 'duplicate' }

function createClaimableCache(options: { ttlMs: number; maxSize: number }) {
  const ttlMs = Math.max(0, options.ttlMs)
  const maxSize = Math.max(1, Math.floor(options.maxSize))
  const entries = new Map<string, CacheEntry>()

  function prune(now: number): void {
    if (ttlMs > 0) {
      const cutoff = now - ttlMs
      for (const [key, entry] of entries) {
        if (entry.claimedAtMs < cutoff) {
          entries.delete(key)
        }
      }
    }
    while (entries.size > maxSize) {
      const oldest = entries.keys().next().value
      if (!oldest) break
      entries.delete(oldest)
    }
  }

  return {
    claim(key: string, now = Date.now()): ClaimResult {
      prune(now)
      if (entries.has(key)) {
        return { kind: 'duplicate' }
      }
      entries.set(key, { key, claimedAtMs: now, committed: false })
      prune(now)
      return { kind: 'claimed' }
    },
    commit(key: string): void {
      const entry = entries.get(key)
      if (entry) entry.committed = true
    },
    release(key: string): void {
      entries.delete(key)
    },
    clearMemory(): void {
      entries.clear()
    },
    size(): number {
      return entries.size
    },
  }
}

function createRecentMessageCache(options: { ttlMs: number; maxSize: number }) {
  const ttlMs = Math.max(0, options.ttlMs)
  const maxSize = Math.max(1, Math.floor(options.maxSize))
  const cache = new Map<string, number>()

  function prune(now: number): void {
    if (ttlMs > 0) {
      const cutoff = now - ttlMs
      for (const [key, timestamp] of cache) {
        if (timestamp < cutoff) cache.delete(key)
      }
    }
    while (cache.size > maxSize) {
      const oldest = cache.keys().next().value
      if (!oldest) break
      cache.delete(oldest)
    }
  }

  return {
    /** Record the key and return whether it was already present (echo detection). */
    check(key: string, now = Date.now()): boolean {
      const existed = cache.has(key)
      cache.delete(key)
      cache.set(key, now)
      prune(now)
      return existed
    },
    /** Peek without recording. */
    peek(key: string, now = Date.now()): boolean {
      const timestamp = cache.get(key)
      if (timestamp === undefined) return false
      if (ttlMs > 0 && now - timestamp >= ttlMs) {
        cache.delete(key)
        return false
      }
      return true
    },
    clear(): void {
      cache.clear()
    },
    size(): number {
      return cache.size
    },
  }
}

// ---------------------------------------------------------------------------
// Module-level caches (singleton per process)
// ---------------------------------------------------------------------------

const claimableInbound = createClaimableCache({
  ttlMs: RECENT_INBOUND_TTL_MS,
  maxSize: RECENT_INBOUND_MAX,
})

const recentOutbound = createRecentMessageCache({
  ttlMs: RECENT_OUTBOUND_TTL_MS,
  maxSize: RECENT_OUTBOUND_MAX,
})

// ---------------------------------------------------------------------------
// Key builder
// ---------------------------------------------------------------------------

function buildMessageKey(params: {
  accountId: string
  remoteJid: string
  messageId: string
}): string | null {
  const accountId = params.accountId.trim()
  const remoteJid = params.remoteJid.trim()
  const messageId = params.messageId.trim()
  if (!accountId || !remoteJid || !messageId || messageId === 'unknown') {
    return null
  }
  return `${accountId}:${remoteJid}:${messageId}`
}

// ---------------------------------------------------------------------------
// Public error type
// ---------------------------------------------------------------------------

export class WhatsAppRetryableInboundError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'WhatsAppRetryableInboundError'
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Reset both inbound and outbound caches (useful in tests).
 */
export function resetWebInboundDedupe(): void {
  claimableInbound.clearMemory()
  recentOutbound.clear()
}

/**
 * Attempt to claim an inbound message key.
 * Returns true if this is the first claim (not a duplicate).
 * Returns false if the key was already claimed.
 */
export function claimInboundWhatsAppMessage(key: string): boolean {
  const result = claimableInbound.claim(key)
  return result.kind === 'claimed'
}

/**
 * Commit a previously claimed inbound message key (mark as fully processed).
 */
export function commitInboundWhatsAppMessage(key: string): void {
  claimableInbound.commit(key)
}

/**
 * Release a previously claimed inbound message key (e.g. on processing error).
 */
export function releaseInboundWhatsAppMessage(key: string): void {
  claimableInbound.release(key)
}

/**
 * Record an outbound message so it can be detected as an echo on inbound.
 */
export function recordOutboundWhatsAppMessage(params: {
  accountId: string
  remoteJid: string
  messageId: string
}): void {
  const key = buildMessageKey(params)
  if (!key) return
  recentOutbound.check(key)
}

/**
 * Check whether an inbound message is a recent outbound echo.
 */
export function isRecentOutboundWhatsAppMessage(params: {
  accountId: string
  remoteJid: string
  messageId: string
}): boolean {
  const key = buildMessageKey(params)
  if (!key) return false
  return recentOutbound.peek(key)
}

/**
 * Build a canonical dedup key for a WhatsApp message.
 * Returns null for invalid/incomplete params.
 */
export function buildWhatsAppMessageKey(params: {
  accountId: string
  remoteJid: string
  messageId: string
}): string | null {
  return buildMessageKey(params)
}

// ---------------------------------------------------------------------------
// Exported for testing
// ---------------------------------------------------------------------------
export const __testing = {
  createClaimableCache,
  createRecentMessageCache,
  buildMessageKey,
}
