export type RetryStrategy = {
  maxAttempts: number
  baseDelayMs: number
  maxDelayMs?: number
  jitterMs?: number
}

export const DEFAULT_RETRY: RetryStrategy = {
  maxAttempts: 1,
  baseDelayMs: 0,
}

export function normalizeRetry(strategy: RetryStrategy | undefined): RetryStrategy {
  const retry = strategy ?? DEFAULT_RETRY
  return {
    ...retry,
    maxAttempts: Math.max(1, Math.floor(retry.maxAttempts)),
    baseDelayMs: Math.max(0, retry.baseDelayMs),
  }
}

export function calculateRetryDelayMs(strategy: RetryStrategy, attempt: number): number {
  const exponentialDelay = strategy.baseDelayMs * 2 ** Math.max(0, attempt - 1)
  const cappedDelay = Math.min(exponentialDelay, strategy.maxDelayMs ?? exponentialDelay)
  return cappedDelay + Math.max(0, strategy.jitterMs ?? 0)
}
