export type ProviderRuntimeErrorCode =
  | 'timeout'
  | 'rate_limited'
  | 'unavailable'
  | 'circuit_open'
  | 'unknown'

export type ProviderRuntimeHealthStatus = 'healthy' | 'degraded' | 'unhealthy'

export type ProviderRuntimeError = Error & {
  code?: ProviderRuntimeErrorCode
  status?: number
  retryable?: boolean
}

export type ProviderRuntimeHealth = {
  providerId: string
  status: ProviderRuntimeHealthStatus
  checkedAt: string
  latencyMs?: number
  reason?: string
}

export type RetryStrategy = {
  maxAttempts: number
  baseDelayMs: number
  maxDelayMs?: number
  jitterMs?: number
}

export type CircuitBreakerPolicy = {
  failureThreshold: number
  resetAfterMs: number
}

export type CircuitBreakerState = {
  readonly status: 'closed' | 'open' | 'half_open'
  readonly failures: number
  canAttempt(nowMs?: number): boolean
  recordSuccess(): void
  recordFailure(nowMs?: number): void
}

export type ProviderOperation<T> = (signal: AbortSignal) => Promise<T>

export type ProviderRuntimeOptions<T> = {
  providerId: string
  operation: ProviderOperation<T>
  retry?: RetryStrategy
  timeoutMs?: number
  circuitBreaker?: CircuitBreakerState
  classifyError?: (error: unknown) => ProviderRuntimeErrorCode
  sleep?: (ms: number) => Promise<void>
}

export type ProviderRuntimeResult<T> = {
  providerId: string
  value: T
  attempts: number
  latencyMs: number
}

const DEFAULT_RETRY: RetryStrategy = {
  maxAttempts: 1,
  baseDelayMs: 0,
}

export class CircuitOpenError extends Error {
  readonly code = 'circuit_open' satisfies ProviderRuntimeErrorCode
  readonly retryable = false

  constructor(providerId: string) {
    super(`Provider circuit is open for ${providerId}.`)
    this.name = 'CircuitOpenError'
  }
}

export class ProviderTimeoutError extends Error {
  readonly code = 'timeout' satisfies ProviderRuntimeErrorCode
  readonly retryable = true

  constructor(timeoutMs: number) {
    super(`Provider operation timed out after ${timeoutMs}ms.`)
    this.name = 'ProviderTimeoutError'
  }
}

export function createCircuitBreaker(
  policy: CircuitBreakerPolicy,
): CircuitBreakerState {
  let failures = 0
  let openedAtMs: number | null = null

  return {
    get status() {
      if (openedAtMs === null) {
        return 'closed'
      }

      return Date.now() - openedAtMs >= policy.resetAfterMs ? 'half_open' : 'open'
    },
    get failures() {
      return failures
    },
    canAttempt(nowMs = Date.now()) {
      return openedAtMs === null || nowMs - openedAtMs >= policy.resetAfterMs
    },
    recordSuccess() {
      failures = 0
      openedAtMs = null
    },
    recordFailure(nowMs = Date.now()) {
      failures += 1
      if (failures >= policy.failureThreshold) {
        openedAtMs = nowMs
      }
    },
  }
}

export async function executeProviderOperation<T>(
  options: ProviderRuntimeOptions<T>,
): Promise<ProviderRuntimeResult<T>> {
  const retry = normalizeRetry(options.retry)
  const sleep = options.sleep ?? defaultSleep
  const startedAt = Date.now()
  let lastError: unknown

  if (options.circuitBreaker && !options.circuitBreaker.canAttempt()) {
    throw new CircuitOpenError(options.providerId)
  }

  for (let attempt = 1; attempt <= retry.maxAttempts; attempt += 1) {
    try {
      const value = await runWithOptionalTimeout(options.operation, options.timeoutMs)
      options.circuitBreaker?.recordSuccess()
      return {
        providerId: options.providerId,
        value,
        attempts: attempt,
        latencyMs: Date.now() - startedAt,
      }
    } catch (error) {
      lastError = error
      const code = options.classifyError?.(error) ?? classifyProviderError(error)
      const retryable = isRetryableProviderError(code, error)
      if (!retryable || attempt >= retry.maxAttempts) {
        options.circuitBreaker?.recordFailure()
        throw error
      }

      await sleep(calculateRetryDelayMs(retry, attempt))
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Provider operation failed without an Error object.')
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

export function classifyProviderError(error: unknown): ProviderRuntimeErrorCode {
  if (isProviderRuntimeError(error)) {
    if (error.code) {
      return error.code
    }

    if (error.status === 429) {
      return 'rate_limited'
    }

    if (typeof error.status === 'number' && error.status >= 500) {
      return 'unavailable'
    }
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return 'timeout'
  }

  return 'unknown'
}

export function isRateLimitError(error: unknown): boolean {
  return classifyProviderError(error) === 'rate_limited'
}

export function calculateRetryDelayMs(strategy: RetryStrategy, attempt: number): number {
  const exponentialDelay = strategy.baseDelayMs * 2 ** Math.max(0, attempt - 1)
  const cappedDelay = Math.min(exponentialDelay, strategy.maxDelayMs ?? exponentialDelay)
  return cappedDelay + (strategy.jitterMs ?? 0)
}

function normalizeRetry(strategy: RetryStrategy | undefined): RetryStrategy {
  const retry = strategy ?? DEFAULT_RETRY
  return {
    ...retry,
    maxAttempts: Math.max(1, Math.floor(retry.maxAttempts)),
    baseDelayMs: Math.max(0, retry.baseDelayMs),
  }
}

function isRetryableProviderError(
  code: ProviderRuntimeErrorCode,
  error: unknown,
): boolean {
  if (isProviderRuntimeError(error) && typeof error.retryable === 'boolean') {
    return error.retryable
  }

  return code === 'timeout' || code === 'rate_limited' || code === 'unavailable'
}

function isProviderRuntimeError(error: unknown): error is ProviderRuntimeError {
  return error instanceof Error
}

async function runWithOptionalTimeout<T>(
  operation: ProviderOperation<T>,
  timeoutMs: number | undefined,
): Promise<T> {
  const controller = new AbortController()
  if (timeoutMs === undefined) {
    return operation(controller.signal)
  }

  let timeout: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      operation(controller.signal),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          controller.abort()
          reject(new ProviderTimeoutError(timeoutMs))
        }, timeoutMs)
      }),
    ])
  } finally {
    if (timeout) {
      clearTimeout(timeout)
    }
  }
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
