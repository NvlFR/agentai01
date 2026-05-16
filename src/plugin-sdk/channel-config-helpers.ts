import { normalizeStringEntries } from '../shared/string-normalization.js'
import { isRecord } from '../shared/guard.js'

export type ChannelDmAllowFromMode = 'topOnly' | 'topOrNested' | 'nestedOnly'
export type ChannelDmPolicy = 'pairing' | 'allowlist' | 'open' | 'disabled'

export type ChannelDmAccess = {
  readonly dmPolicy?: ChannelDmPolicy
  readonly allowFrom?: Array<string | number>
}

export type DmAccessRecord = Record<string, unknown>

export function normalizeChannelDmPolicy(value: string | undefined): ChannelDmPolicy | undefined {
  if (value === 'pairing' || value === 'allowlist' || value === 'open' || value === 'disabled') {
    return value
  }
  return undefined
}

/**
 * Ensures that if a DM policy is set to "open", the allowlist contains a wildcard "*".
 * Adapted for agentai01 from OpenClaw's dm-access.ts.
 */
export function ensureOpenDmPolicyAllowFromWildcard(params: {
  readonly entry: DmAccessRecord
  readonly mode: ChannelDmAllowFromMode
  readonly pathPrefix: string
  readonly changes: string[]
}): void {
  const policy = resolveChannelDmPolicy({
    account: params.entry,
    mode: params.mode,
  })

  if (policy !== 'open') {
    return
  }

  const allowFrom = resolveChannelDmAllowFrom({
    account: params.entry,
    mode: params.mode,
  })

  if (allowFrom?.some(entry => String(entry).trim() === '*')) {
    return
  }

  const nextAllowFrom = [...(allowFrom ?? []), '*']
  setCanonicalDmAllowFrom({
    entry: params.entry,
    mode: params.mode,
    allowFrom: nextAllowFrom,
    pathPrefix: params.pathPrefix,
    changes: params.changes,
    reason: allowFrom ? 'added "*" (required by dmPolicy="open")' : 'set to ["*"] (required by dmPolicy="open")',
  })
}

export function resolveChannelDmPolicy(params: {
  readonly account?: DmAccessRecord | null
  readonly mode?: ChannelDmAllowFromMode
  readonly defaultPolicy?: string
}): ChannelDmPolicy | undefined {
  const dm = isRecord(params.account?.dm) ? params.account?.dm : undefined
  const value = params.account?.dmPolicy ?? (dm as Record<string, unknown> | undefined)?.policy ?? params.defaultPolicy
  return typeof value === 'string' ? normalizeChannelDmPolicy(value) : undefined
}

export function resolveChannelDmAllowFrom(params: {
  readonly account?: DmAccessRecord | null
  readonly mode?: ChannelDmAllowFromMode
}): Array<string | number> | undefined {
  const dm = isRecord(params.account?.dm) ? params.account?.dm : undefined
  const value = params.account?.allowFrom ?? (dm as Record<string, unknown> | undefined)?.allowFrom
  return Array.isArray(value) ? (value as Array<string | number>) : undefined
}

export function setCanonicalDmAllowFrom(params: {
  readonly entry: DmAccessRecord
  readonly mode: ChannelDmAllowFromMode
  readonly allowFrom: Array<string | number>
  readonly pathPrefix: string
  readonly changes?: string[]
  readonly reason: string
}): void {
  const entry = params.entry as Record<string, unknown>
  entry.allowFrom = [...params.allowFrom]
  const dm = entry.dm as Record<string, unknown> | undefined
  if (dm && dm.allowFrom !== undefined) {
    delete dm.allowFrom
    if (Object.keys(dm).length === 0) {
      delete entry.dm
    }
  }
  params.changes?.push(`- ${params.pathPrefix}.allowFrom: ${params.reason}`)
}

/**
 * Normalizes legacy DM configuration fields (dm.policy, dm.allowFrom) into 
 * the top-level canonical fields (dmPolicy, allowFrom).
 */
export function normalizeLegacyDmAliases(params: {
  readonly entry: DmAccessRecord
  readonly pathPrefix: string
  readonly changes: string[]
}): { readonly entry: DmAccessRecord; readonly changed: boolean } {
  let changed = false
  const updated = { ...params.entry } as Record<string, unknown>
  const dm = updated.dm as Record<string, unknown> | undefined

  if (dm?.policy !== undefined && updated.dmPolicy === undefined) {
    updated.dmPolicy = dm.policy
    delete dm.policy
    changed = true
    params.changes.push(`Moved ${params.pathPrefix}.dm.policy -> ${params.pathPrefix}.dmPolicy`)
  }

  if (dm?.allowFrom !== undefined && updated.allowFrom === undefined) {
    updated.allowFrom = dm.allowFrom
    delete dm.allowFrom
    changed = true
    params.changes.push(`Moved ${params.pathPrefix}.dm.allowFrom -> ${params.pathPrefix}.allowFrom`)
  }

  if (dm && Object.keys(dm).length === 0) {
    delete updated.dm
    changed = true
  }

  return { entry: updated, changed }
}
