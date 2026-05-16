import { classifyProviderError, executeProviderOperation } from './execute.js'
import type { ProviderOperation } from './timeout.js'

export type ProviderRuntimeHealthStatus = 'healthy' | 'degraded' | 'unhealthy'

export type ProviderRuntimeHealth = {
  providerId: string
  status: ProviderRuntimeHealthStatus
  checkedAt: string
  latencyMs?: number
  reason?: string
}

export async function checkProviderHealth(
  providerId: string,
  check: ProviderOperation<unknown>,
  timeoutMs = 5_000,
): Promise<ProviderRuntimeHealth> {
  const startedAt = Date.now()
  try {
    await executeProviderOperation({
      providerId,
      operation: check,
      timeoutMs,
      retry: { maxAttempts: 1, baseDelayMs: 0 },
    })
    return {
      providerId,
      status: 'healthy',
      checkedAt: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
    }
  } catch (error) {
    const code = classifyProviderError(error)
    return {
      providerId,
      status: code === 'rate_limited' ? 'degraded' : 'unhealthy',
      checkedAt: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
      reason: error instanceof Error ? error.message : String(error),
    }
  }
}
