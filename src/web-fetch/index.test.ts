import { describe, expect, test } from 'bun:test'

import { evaluateUrlSafety, safeFetch, type FetchLike } from './index.js'

describe('web-fetch', () => {
  test('blocks localhost and private resolved addresses', () => {
    expect(evaluateUrlSafety('http://localhost:8080').safe).toBe(false)
    expect(evaluateUrlSafety('https://example.com', ['10.0.0.4']).safe).toBe(false)
    expect(evaluateUrlSafety('https://example.com').safe).toBe(true)
  })

  test('retries retryable responses and records audit events', async () => {
    let calls = 0
    const fetchImpl: FetchLike = async input => {
      calls += 1
      return new Response(calls === 1 ? 'bad' : 'ok', {
        status: calls === 1 ? 503 : 200,
        headers: { 'content-type': 'text/plain' },
      })
    }

    const result = await safeFetch(
      { url: 'https://example.com/resource', retryAttempts: 2 },
      { fetch: fetchImpl, resolveHost: async () => ['93.184.216.34'] },
    )

    expect(result.ok).toBe(true)
    expect(calls).toBe(2)
    expect(result.audit.map(event => event.outcome)).toContain('retry')
  })
})
