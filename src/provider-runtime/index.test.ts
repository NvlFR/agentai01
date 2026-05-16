import { describe, expect, it } from 'bun:test'

import {
  checkProviderHealth,
  createCircuitBreaker,
  executeProviderOperation,
  isRateLimitError,
  ProviderTimeoutError,
} from './index.js'

describe('executeProviderOperation', () => {
  it('retries retryable provider failures and returns attempts', async () => {
    let calls = 0
    const result = await executeProviderOperation({
      providerId: 'test-provider',
      retry: { maxAttempts: 3, baseDelayMs: 1 },
      sleep: async () => undefined,
      operation: async () => {
        calls += 1
        if (calls < 2) {
          const error = new Error('busy') as Error & { status: number }
          error.status = 429
          throw error
        }

        return 'ok'
      },
    })

    expect(result.value).toBe('ok')
    expect(result.attempts).toBe(2)
    expect(calls).toBe(2)
  })

  it('times out operations and marks them as retryable', async () => {
    await expect(
      executeProviderOperation({
        providerId: 'slow-provider',
        timeoutMs: 1,
        operation: async () => new Promise(resolve => setTimeout(resolve, 50)),
      }),
    ).rejects.toBeInstanceOf(ProviderTimeoutError)
  })

  it('opens circuit after the failure threshold', async () => {
    const breaker = createCircuitBreaker({ failureThreshold: 1, resetAfterMs: 10_000 })

    await expect(
      executeProviderOperation({
        providerId: 'down-provider',
        circuitBreaker: breaker,
        operation: async () => {
          throw new Error('down')
        },
      }),
    ).rejects.toThrow('down')

    await expect(
      executeProviderOperation({
        providerId: 'down-provider',
        circuitBreaker: breaker,
        operation: async () => 'unused',
      }),
    ).rejects.toThrow('circuit is open')
  })
})

describe('provider health', () => {
  it('reports rate limited checks as degraded', async () => {
    const rateLimitError = new Error('too many requests') as Error & { status: number }
    rateLimitError.status = 429

    const health = await checkProviderHealth('limited', async () => {
      throw rateLimitError
    })

    expect(health.status).toBe('degraded')
    expect(isRateLimitError(rateLimitError)).toBe(true)
  })
})
