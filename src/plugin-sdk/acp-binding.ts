// Adapted using referensi/openclaw/src/plugin-sdk/acp-binding-resolve-runtime.ts
export type ResolvedConfiguredAcpBinding = {
  sessionKey: string
  channel: string
  accountId: string
  state?: 'ready' | 'pending'
  metadata?: Record<string, unknown>
}

export function resolveConfiguredAcpBindingRecord(params: {
  cfg: unknown
  sessionKey: string
}): ResolvedConfiguredAcpBinding | null {
  const records = listBindingRecords(params.cfg)
  const normalizedSessionKey = params.sessionKey.trim()
  if (!normalizedSessionKey) {
    return null
  }

  for (const record of records) {
    if (record.sessionKey === normalizedSessionKey) {
      return record
    }
  }

  return null
}

export async function ensureConfiguredAcpBindingReady(params: {
  cfg: unknown
  configuredBinding: ResolvedConfiguredAcpBinding | null
  isBindingReady?: (binding: ResolvedConfiguredAcpBinding) => boolean | Promise<boolean>
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!params.configuredBinding) {
    return { ok: false, error: 'ACP binding not configured' }
  }

  const ready =
    (await params.isBindingReady?.(params.configuredBinding)) ??
    (params.configuredBinding.state === 'ready' || params.configuredBinding.state == null)

  if (!ready) {
    return {
      ok: false,
      error: `ACP binding for session ${params.configuredBinding.sessionKey} is not ready`,
    }
  }

  return { ok: true }
}

function listBindingRecords(cfg: unknown): ResolvedConfiguredAcpBinding[] {
  const root = readRecord(cfg)
  const direct = normalizeBindingArray(root?.acpBindings)
  if (direct.length > 0) {
    return direct
  }

  const acp = readRecord(root?.acp)
  const nested = normalizeBindingArray(acp?.bindings)
  if (nested.length > 0) {
    return nested
  }

  return normalizeBindingArray(root?.bindings)
}

function normalizeBindingArray(value: unknown): ResolvedConfiguredAcpBinding[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap(entry => {
    const record = readRecord(entry)
    if (!record) {
      return []
    }

    const sessionKey = typeof record.sessionKey === 'string' ? record.sessionKey.trim() : ''
    const channel = typeof record.channel === 'string' ? record.channel.trim() : ''
    const accountId = typeof record.accountId === 'string' ? record.accountId.trim() : ''
    if (!sessionKey || !channel || !accountId) {
      return []
    }

    return [
      {
        sessionKey,
        channel,
        accountId,
        state:
          record.state === 'ready' || record.state === 'pending'
            ? record.state
            : undefined,
        metadata: readRecord(record.metadata) ?? undefined,
      },
    ]
  })
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}
