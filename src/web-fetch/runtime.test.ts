import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'

import { evaluateUrlSafety, fetchWebContent, safeFetch } from './runtime.js'
import type { FetchLike } from './types.js'

const originalFetch = globalThis.fetch

describe('web-fetch/runtime', () => {
  beforeEach(() => {
    globalThis.fetch = originalFetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  test('blocks localhost and private resolved addresses', () => {
    expect(evaluateUrlSafety('http://localhost:8080').safe).toBe(false)
    expect(evaluateUrlSafety('https://example.com', ['10.0.0.4']).safe).toBe(false)
    expect(evaluateUrlSafety('https://example.com').safe).toBe(true)
  })

  test('retries retryable responses and records audit events', async () => {
    let calls = 0
    const fetchImpl: FetchLike = async () => {
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

  test('returns extracted readable content for html responses', async () => {
    const fetchImpl: FetchLike = mock(async () =>
      new Response(
        `
          <html>
            <head><title>Example Article</title></head>
            <body>
              <article>
                <h1>Example Article</h1>
                <p>Main paragraph with enough content to keep readability happy for this test case.</p>
                <p>Another paragraph gives the extractor a little more signal to work with.</p>
              </article>
            </body>
          </html>
        `,
        {
          status: 200,
          headers: { 'content-type': 'text/html; charset=utf-8' },
        },
      ),
    )

    const result = await fetchWebContent('https://example.com/article', {}, { fetch: fetchImpl })

    expect(result.error).toBeUndefined()
    expect(result.content).toContain('Main paragraph')
    expect(result.title).toBeTruthy()
  })

  test('returns raw text for non-html responses', async () => {
    const fetchImpl: FetchLike = mock(async () =>
      new Response('{"ok":true,"source":"agentai01"}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const result = await fetchWebContent(
      'https://example.com/data.json',
      { maxContentLength: 64 },
      { fetch: fetchImpl },
    )

    expect(result.content).toBe('{"ok":true,"source":"agentai01"}')
    expect(result.title).toBeUndefined()
  })

  test('returns an error result for unsafe urls', async () => {
    const result = await fetchWebContent('http://127.0.0.1/private')

    expect(result.content).toBe('')
    expect(result.error).toBe('blocked_ip')
  })
})
