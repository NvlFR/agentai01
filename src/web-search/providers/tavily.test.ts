import { describe, expect, mock, test } from 'bun:test'

import { normalizeSearchResults } from '../runtime.js'
import { createTavilyWebSearchProvider, TAVILY_WEB_SEARCH_URL } from './tavily.js'

describe('web-search/providers/tavily', () => {
  test('posts search requests and returns normalized results', async () => {
    const fetchImpl = mock((input: string | URL | Request, init?: RequestInit) => {
      expect(String(input)).toBe(TAVILY_WEB_SEARCH_URL)
      expect(init?.method).toBe('POST')
      expect(init?.headers).toMatchObject({
        authorization: 'Bearer tavily-key',
        'content-type': 'application/json',
      })
      expect(init?.body).toBe(
        JSON.stringify({
          query: 'agent runtime',
          max_results: 2,
          topic: 'general',
          search_depth: 'basic',
          include_answer: false,
          include_raw_content: false,
        }),
      )

      return Promise.resolve(
        new Response(
          JSON.stringify({
            results: [
              {
                title: ' Tavily Result ',
                url: 'https://example.com/tavily',
                content: ' useful   content ',
                score: 0.92,
              },
            ],
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          },
        ),
      )
    })

    const provider = createTavilyWebSearchProvider({ apiKey: 'tavily-key', fetch: fetchImpl })
    const raw = await provider.search({ query: 'agent runtime', limit: 2 })
    const results = normalizeSearchResults(raw, provider.id)

    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      provider_id: 'tavily',
      title: 'Tavily Result',
      url: 'https://example.com/tavily',
      snippet: 'useful content',
      score: 0.92,
    })
  })

  test('throws a descriptive error for invalid api keys', async () => {
    const fetchImpl = mock(() =>
      Promise.resolve(new Response('{}', { status: 401, headers: { 'content-type': 'application/json' } })),
    )
    const provider = createTavilyWebSearchProvider({ apiKey: 'bad-key', fetch: fetchImpl })

    await expect(provider.search({ query: 'agent runtime' })).rejects.toThrow(
      'Tavily authentication failed with HTTP 401',
    )
  })
})
