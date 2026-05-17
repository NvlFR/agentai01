import { describe, expect, mock, test } from 'bun:test'

import { createWebSearchClient, normalizeSearchResults } from './runtime.js'
import type { FetchLike, WebSearchProvider } from './types.js'

describe('web-search/runtime', () => {
  test('uses tavily by default when TAVILY_API_KEY is configured', async () => {
    const fetchImpl: FetchLike = mock((input: string | URL | Request) => {
      expect(String(input)).toBe('https://api.tavily.com/search')
      return Promise.resolve(
        new Response(
          JSON.stringify({
            results: [{ title: ' Tavily ', url: 'https://example.com/tavily', content: ' best   match ' }],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      )
    })

    const client = createWebSearchClient({
      env: { TAVILY_API_KEY: 'present' },
      fetch: fetchImpl,
      now: () => 1,
    })
    const response = await client.search('  agent runtime  ', { limit: 1 })

    expect(response.provider_id).toBe('tavily')
    expect(response.query).toBe('agent runtime')
    expect(response.cached).toBe(false)
    expect(response.results[0]).toMatchObject({
      title: 'Tavily',
      snippet: 'best match',
    })
  })

  test('falls back to duckduckgo when no api key is configured', async () => {
    const fetchImpl: FetchLike = mock((input: string | URL | Request) => {
      const url = new URL(String(input))
      expect(url.hostname).toBe('api.duckduckgo.com')
      expect(url.searchParams.get('q')).toBe('agent runtime')
      return Promise.resolve(
        new Response(
          JSON.stringify({
            AbstractTitle: 'DuckDuckGo Result',
            AbstractURL: 'https://example.com/ddg',
            AbstractText: 'secondary provider',
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      )
    })

    const client = createWebSearchClient({ env: {}, fetch: fetchImpl, now: () => 1 })
    const response = await client.search('agent runtime')

    expect(response.provider_id).toBe('duckduckgo')
    expect(response.results).toHaveLength(1)
  })

  test('falls back to the next provider and caches normalized results', async () => {
    let secondCalls = 0
    const providers: WebSearchProvider[] = [
      {
        id: 'primary',
        search: async () => {
          throw new Error('offline')
        },
      },
      {
        id: 'fallback',
        search: async () => {
          secondCalls += 1
          return [
            { title: ' Result ', url: 'https://example.com', snippet: ' useful   text ' },
            { title: 'Duplicate', url: 'https://example.com' },
          ]
        },
      },
    ]

    const client = createWebSearchClient({ providers, ttlMs: 1_000, now: () => 1 })
    const first = await client.search(' agent runtime ', { limit: 5 })
    const second = await client.search('agent runtime', { limit: 5 })

    expect(first.provider_id).toBe('fallback')
    expect(first.results).toHaveLength(1)
    expect(first.results[0]?.snippet).toBe('useful text')
    expect(second.cached).toBe(true)
    expect(secondCalls).toBe(1)
  })

  test('normalizes generic provider arrays for custom providers', () => {
    const results = normalizeSearchResults(
      [
        { title: ' Custom ', url: 'https://example.com/custom', snippet: '  custom snippet  ' },
        { title: 'Duplicate', url: 'https://example.com/custom' },
      ],
      'custom',
    )

    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      provider_id: 'custom',
      title: 'Custom',
      snippet: 'custom snippet',
    })
  })
})
