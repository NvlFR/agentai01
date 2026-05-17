import { describe, expect, mock, test } from 'bun:test'

import { normalizeSearchResults } from '../runtime.js'
import { createDuckDuckGoWebSearchProvider } from './duckduckgo.js'

describe('web-search/providers/duckduckgo', () => {
  test('requests instant answers and flattens related topics', async () => {
    const fetchImpl = mock((input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(String(input))
      expect(url.origin + url.pathname).toBe('https://api.duckduckgo.com/')
      expect(url.searchParams.get('q')).toBe('agent runtime')
      expect(url.searchParams.get('format')).toBe('json')
      expect(url.searchParams.get('kl')).toBe('wt-wt')
      expect(init?.headers).toMatchObject({ 'user-agent': 'agentai01-web-search/0.1' })

      return Promise.resolve(
        new Response(
          JSON.stringify({
            AbstractTitle: 'Agent Runtime',
            AbstractURL: 'https://example.com/overview',
            AbstractText: 'Primary summary',
            RelatedTopics: [
              {
                Name: 'Guides',
                Topics: [
                  {
                    Text: 'Deep dive article',
                    FirstURL: 'https://example.com/guide',
                  },
                ],
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

    const provider = createDuckDuckGoWebSearchProvider({ fetch: fetchImpl })
    const raw = await provider.search({ query: 'agent runtime', locale: 'wt-wt' })
    const results = normalizeSearchResults(raw, provider.id)

    expect(results).toHaveLength(2)
    expect(results[0]).toMatchObject({
      provider_id: 'duckduckgo',
      title: 'Agent Runtime',
      url: 'https://example.com/overview',
      snippet: 'Primary summary',
    })
    expect(results[1]).toMatchObject({
      provider_id: 'duckduckgo',
      url: 'https://example.com/guide',
      snippet: 'Deep dive article',
    })
  })

  test('throws a descriptive error when the upstream request fails', async () => {
    const fetchImpl = mock(() =>
      Promise.resolve(new Response('{}', { status: 503, headers: { 'content-type': 'application/json' } })),
    )
    const provider = createDuckDuckGoWebSearchProvider({ fetch: fetchImpl })

    await expect(provider.search({ query: 'agent runtime' })).rejects.toThrow(
      'DuckDuckGo search failed with HTTP 503',
    )
  })
})
