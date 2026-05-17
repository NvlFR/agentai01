// Adapted using referensi/openclaw/extensions/whatsapp/src/inbound/access-control.ts
// Platform-specific OpenClaw pairing/upsert hooks are dropped; reusable access control logic retained.

import { normalizeWhatsAppAllowFromEntries } from '../normalize-target.js'

export type InboundAccessControlResult = {
  allowed: boolean
  shouldMarkRead: boolean
  isSelfChat: boolean
  resolvedAccountId: string
}

export type DmPolicy = 'pairing' | 'allowlist' | 'open' | 'disabled'
export type GroupPolicy = 'open' | 'allowlist' | 'disabled'

export type WhatsAppInboundPolicy = {
  accountId: string
  dmPolicy: DmPolicy
  groupPolicy: GroupPolicy
  allowFrom: string[]
  groupAllowFrom: string[]
  selfE164: string | null
}

export type AccessControlConfig = {
  web?: {
    whatsapp?: {
      accounts?: Record<
        string,
        {
          dmPolicy?: string
          groupPolicy?: string
          allowFrom?: Array<string | number>
          groupAllowFrom?: Array<string | number>
          phone?: string
        }
      >
      dmPolicy?: string
      groupPolicy?: string
      allowFrom?: Array<string | number>
      groupAllowFrom?: Array<string | number>
    }
  }
}

const PAIRING_REPLY_HISTORY_GRACE_MS = 30_000

function normalizeDmPolicy(value: unknown): DmPolicy {
  if (value === 'allowlist' || value === 'open' || value === 'disabled') return value
  return 'pairing'
}

function normalizeGroupPolicy(value: unknown): GroupPolicy {
  if (value === 'allowlist' || value === 'disabled') return value
  return 'open'
}

/**
 * Resolve the inbound policy for a given account from config.
 */
export function resolveWhatsAppInboundPolicy(params: {
  cfg: AccessControlConfig
  accountId: string
  selfE164?: string | null
}): WhatsAppInboundPolicy {
  const whatsapp = params.cfg.web?.whatsapp ?? {}
  const accountCfg = whatsapp.accounts?.[params.accountId] ?? {}

  const dmPolicy = normalizeDmPolicy(accountCfg.dmPolicy ?? whatsapp.dmPolicy)
  const groupPolicy = normalizeGroupPolicy(accountCfg.groupPolicy ?? whatsapp.groupPolicy)

  const rawAllowFrom = [
    ...(accountCfg.allowFrom ?? []),
    ...(whatsapp.allowFrom ?? []),
  ]
  const rawGroupAllowFrom = [
    ...(accountCfg.groupAllowFrom ?? []),
    ...(whatsapp.groupAllowFrom ?? []),
  ]

  return {
    accountId: params.accountId,
    dmPolicy,
    groupPolicy,
    allowFrom: normalizeWhatsAppAllowFromEntries(rawAllowFrom),
    groupAllowFrom: normalizeWhatsAppAllowFromEntries(rawGroupAllowFrom),
    selfE164: params.selfE164 ?? accountCfg.phone ?? null,
  }
}

function isSamePhone(selfE164: string | null, from: string): boolean {
  if (!selfE164) return false
  const normalize = (v: string) => v.replace(/\D/g, '')
  return normalize(selfE164) === normalize(from)
}

function isAllowed(allowFrom: string[], senderId: string): boolean {
  if (allowFrom.includes('*')) return true
  const normalized = senderId.replace(/\D/g, '')
  return allowFrom.some((entry) => entry.replace(/\D/g, '') === normalized)
}

export type PairingReplyFn = (text: string) => Promise<void>

/**
 * Check inbound access control for a WhatsApp message.
 *
 * - Rejects self-chat (fromMe on non-self-phone)
 * - Enforces group policy (open / allowlist / disabled)
 * - Enforces DM policy (pairing / allowlist / open / disabled)
 * - Calls pairingReply when pairing challenge is needed (optional)
 */
export async function checkInboundAccessControl(params: {
  cfg: AccessControlConfig
  accountId: string
  from: string
  selfE164: string | null
  senderE164: string | null
  group: boolean
  isFromMe: boolean
  messageTimestampMs?: number
  connectedAtMs?: number
  pairingGraceMs?: number
  verbose?: boolean
  pairingReply?: PairingReplyFn
}): Promise<InboundAccessControlResult> {
  const policy = resolveWhatsAppInboundPolicy({
    cfg: params.cfg,
    accountId: params.accountId,
    selfE164: params.selfE164,
  })

  const isSelf = isSamePhone(policy.selfE164, params.from)

  // Self-chat: fromMe on a non-self-phone number → skip
  if (!params.group && params.isFromMe && !isSelf) {
    return {
      allowed: false,
      shouldMarkRead: false,
      isSelfChat: isSelf,
      resolvedAccountId: policy.accountId,
    }
  }

  // Group policy
  if (params.group) {
    if (policy.groupPolicy === 'disabled') {
      if (params.verbose) console.log('[whatsapp] Blocked group message (groupPolicy: disabled)')
      return {
        allowed: false,
        shouldMarkRead: false,
        isSelfChat: isSelf,
        resolvedAccountId: policy.accountId,
      }
    }
    if (policy.groupPolicy === 'allowlist') {
      const senderId = params.senderE164 ?? params.from
      const effectiveAllowFrom =
        policy.groupAllowFrom.length > 0 ? policy.groupAllowFrom : policy.allowFrom
      if (effectiveAllowFrom.length === 0) {
        if (params.verbose)
          console.log('[whatsapp] Blocked group message (groupPolicy: allowlist, no groupAllowFrom)')
        return {
          allowed: false,
          shouldMarkRead: false,
          isSelfChat: isSelf,
          resolvedAccountId: policy.accountId,
        }
      }
      if (!isAllowed(effectiveAllowFrom, senderId)) {
        if (params.verbose)
          console.log(`[whatsapp] Blocked group message from ${senderId} (groupPolicy: allowlist)`)
        return {
          allowed: false,
          shouldMarkRead: false,
          isSelfChat: isSelf,
          resolvedAccountId: policy.accountId,
        }
      }
    }
    // groupPolicy === 'open' → allow
    return {
      allowed: true,
      shouldMarkRead: true,
      isSelfChat: isSelf,
      resolvedAccountId: policy.accountId,
    }
  }

  // DM policy
  if (policy.dmPolicy === 'disabled') {
    if (params.verbose) console.log('[whatsapp] Blocked DM (dmPolicy: disabled)')
    return {
      allowed: false,
      shouldMarkRead: false,
      isSelfChat: isSelf,
      resolvedAccountId: policy.accountId,
    }
  }

  if (policy.dmPolicy === 'open') {
    return {
      allowed: true,
      shouldMarkRead: true,
      isSelfChat: isSelf,
      resolvedAccountId: policy.accountId,
    }
  }

  if (policy.dmPolicy === 'allowlist') {
    if (!isAllowed(policy.allowFrom, params.from)) {
      if (params.verbose)
        console.log(`[whatsapp] Blocked unauthorized sender ${params.from} (dmPolicy: allowlist)`)
      return {
        allowed: false,
        shouldMarkRead: false,
        isSelfChat: isSelf,
        resolvedAccountId: policy.accountId,
      }
    }
    return {
      allowed: true,
      shouldMarkRead: true,
      isSelfChat: isSelf,
      resolvedAccountId: policy.accountId,
    }
  }

  // dmPolicy === 'pairing'
  if (!isSelf) {
    const pairingGraceMs =
      typeof params.pairingGraceMs === 'number' && params.pairingGraceMs > 0
        ? params.pairingGraceMs
        : PAIRING_REPLY_HISTORY_GRACE_MS

    const suppressPairingReply =
      typeof params.connectedAtMs === 'number' &&
      typeof params.messageTimestampMs === 'number' &&
      params.messageTimestampMs < params.connectedAtMs - pairingGraceMs

    if (!isAllowed(policy.allowFrom, params.from)) {
      if (!suppressPairingReply && params.pairingReply) {
        try {
          await params.pairingReply(
            `To pair with this assistant, send your phone number: ${params.from}`,
          )
        } catch {
          // pairing reply failure is non-fatal
        }
      }
      return {
        allowed: false,
        shouldMarkRead: false,
        isSelfChat: isSelf,
        resolvedAccountId: policy.accountId,
      }
    }
  }

  return {
    allowed: true,
    shouldMarkRead: true,
    isSelfChat: isSelf,
    resolvedAccountId: policy.accountId,
  }
}
