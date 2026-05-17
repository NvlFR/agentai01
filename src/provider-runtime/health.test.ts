import { describe, expect, it } from 'bun:test'
import { checkProviderHealth } from './health.js'

describe('checkProviderHealth', () => {
  it('returns healthy when the check succeeds', async () => {
    const result = await checkProviderHealth(
      'test-provider',
      async () => 'ok',
      5_000,
    )
    expect(result.providerId).toBe('test-provider')
    expect(result.status).toBe('healthy')
    expect(typeof result.latencyMs).toBe('number')
    expect(result.reason).toBeUndefined()
  })

  it('returns unhealthy when the check throws', async () => {
    const result = await checkProviderHealth(
      'test-provider',
      async () => { throw new Error('connection refused') },
      5_000,
    )
    expect(result.providerId).toBe('test-provider')
    expect(result.status).toBe('unhealthy')
    expect(result.reason).toBe('connection refused')
  })

  it('returns degraded when the error is rate-limited', async () => {
    const result = await checkProviderHealth(
      'test-provider',
      async () => {
        const err = new Error('rate limited');
        (err as unknown as Record<string, unknown>).status = 429
        throw err
      },
      5_000,
    )
    expect(result.providerId).toBe('test-provider')
    expect(result.status).toBe('degraded')
  })

  it('includes checkedAt as ISO string', async () => {
    const result = await checkProviderHealth(
      'test-provider',
      async () => 'ok',
      5_000,
    )
    expect(() => new Date(result.checkedAt)).not.toThrow()
  })
})
