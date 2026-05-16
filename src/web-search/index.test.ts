import { describe, expect, test } from 'bun:test'

import { createWebSearchClient, type WebSearchProvider } from './index.js'

describe('web-search', () => {
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
    const first = await client.search({ query: ' agent runtime ', limit: 5 })
    const second = await client.search({ query: 'agent runtime', limit: 5 })

    expect(first.provider_id).toBe('fallback')
    expect(first.results).toHaveLength(1)
    expect(first.results[0]?.snippet).toBe('useful text')
    expect(second.cached).toBe(true)
    expect(secondCalls).toBe(1)
  })
})
