import { CircuitOpenError, type CircuitBreakerState } from './circuit-breaker.js'
import { calculateRetryDelayMs, normalizeRetry, type RetryStrategy } from './retry.js'
import { type ProviderOperation, withProviderTimeout } from './timeout.js'

export type ProviderRuntimeErrorCode =
  | 'timeout'
  | 'rate_limited'
  | 'unavailable'
  | 'circuit_open'
  | 'unknown'

export type ProviderRuntimeError = Error & {
  code?: ProviderRuntimeErrorCode
  status?: number
  retryable?: boolean
}

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
      const value = await withProviderTimeout(options.operation, options.timeoutMs)
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

function defaultSleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
