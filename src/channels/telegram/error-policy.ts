export type TelegramErrorPolicy = 'always' | 'once' | 'silent'

export type TelegramErrorPolicyConfig = {
  errorPolicy?: TelegramErrorPolicy
  errorCooldownMs?: number
}

export const DEFAULT_TELEGRAM_ERROR_COOLDOWN_MS = 4 * 60 * 60 * 1000

const cooldownStore = new Map<string, Map<string, number>>()

export function resolveTelegramErrorPolicy(configs: {
  accountConfig?: TelegramErrorPolicyConfig
  chatConfig?: TelegramErrorPolicyConfig
  threadConfig?: TelegramErrorPolicyConfig
}): {
  policy: TelegramErrorPolicy
  cooldownMs: number
} {
  const candidates = [configs.accountConfig, configs.chatConfig, configs.threadConfig]
  let policy: TelegramErrorPolicy = 'always'
  let cooldownMs = DEFAULT_TELEGRAM_ERROR_COOLDOWN_MS

  for (const candidate of candidates) {
    if (candidate?.errorPolicy) {
      policy = candidate.errorPolicy
    }

    if (typeof candidate?.errorCooldownMs === 'number' && Number.isFinite(candidate.errorCooldownMs)) {
      cooldownMs = candidate.errorCooldownMs
    }
  }

  return { policy, cooldownMs }
}

export function buildTelegramErrorScopeKey(params: {
  accountId: string
  chatId: string | number
  threadId?: string | number | null
}): string {
  return `${params.accountId}:${String(params.chatId)}:${params.threadId == null ? 'main' : String(params.threadId)}`
}

export function shouldSuppressTelegramError(params: {
  scopeKey: string
  cooldownMs: number
  errorMessage?: string
  now?: number
}): boolean {
  const now = params.now ?? Date.now()
  const messageKey = params.errorMessage ?? ''
  const scopeStore = cooldownStore.get(params.scopeKey)
  if (scopeStore) {
    pruneExpiredCooldowns(scopeStore, now)
    if (scopeStore.size === 0) {
      cooldownStore.delete(params.scopeKey)
    }
  }

  if (cooldownStore.size > 100) {
    for (const [scopeKey, entries] of cooldownStore) {
      pruneExpiredCooldowns(entries, now)
      if (entries.size === 0) {
        cooldownStore.delete(scopeKey)
      }
    }
  }

  const expiresAt = scopeStore?.get(messageKey)
  if (typeof expiresAt === 'number' && expiresAt > now) {
    return true
  }

  const nextScopeStore = scopeStore ?? new Map<string, number>()
  nextScopeStore.set(messageKey, now + params.cooldownMs)
  cooldownStore.set(params.scopeKey, nextScopeStore)
  return false
}

export function isSilentErrorPolicy(policy: TelegramErrorPolicy): boolean {
  return policy === 'silent'
}

export function resetTelegramErrorPolicyStoreForTest(): void {
  cooldownStore.clear()
}

function pruneExpiredCooldowns(messageStore: Map<string, number>, now: number): void {
  for (const [messageKey, expiresAt] of messageStore) {
    if (expiresAt <= now) {
      messageStore.delete(messageKey)
    }
  }
}
