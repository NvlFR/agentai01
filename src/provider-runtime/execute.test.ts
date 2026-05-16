import { describe, expect, it } from 'bun:test'

import { createCircuitBreaker } from './circuit-breaker.js'
import { executeProviderOperation, isRateLimitError } from './execute.js'
import { checkProviderHealth } from './health.js'
import { ProviderTimeoutError } from './timeout.js'

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
        retry: { maxAttempts: 1, baseDelayMs: 0 },
        timeoutMs: 10,
        operation: async signal =>
          new Promise((_resolve, reject) => {
            const timer = setTimeout(() => {
              reject(new Error('operation should have been aborted'))
            }, 200)

            signal.addEventListener(
              'abort',
              () => {
                clearTimeout(timer)
                reject(new DOMException('Aborted', 'AbortError'))
              },
              { once: true },
            )
          }),
      }),
    ).rejects.toBeInstanceOf(ProviderTimeoutError)
  })

  it('opens the circuit after the failure threshold and blocks the next call', async () => {
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

describe('checkProviderHealth', () => {
  it('reports rate-limited checks as degraded', async () => {
    const rateLimitError = new Error('too many requests') as Error & { status: number }
    rateLimitError.status = 429

    const health = await checkProviderHealth('limited', async () => {
      throw rateLimitError
    })

    expect(health.status).toBe('degraded')
    expect(isRateLimitError(rateLimitError)).toBe(true)
  })
})
