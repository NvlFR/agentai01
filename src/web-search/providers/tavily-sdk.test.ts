import { describe, expect, it } from 'bun:test'

import { createTavilySdkWebSearchProvider } from './tavily-sdk.js'

describe('tavily-sdk provider', () => {
  it('maps Tavily SDK results into provider search results', async () => {
    const provider = createTavilySdkWebSearchProvider({
      apiKey: 'sdk-key',
      client: {
        search: async query => ({
          query,
          responseTime: 1,
          images: [],
          requestId: 'req_1',
          results: [
            {
              title: 'Example',
              url: 'https://example.com',
              content: 'Snippet',
              score: 0.9,
              publishedDate: '2026-05-17',
            },
          ],
        }),
      },
    })

    await expect(provider.search({
      query: 'agent runtime',
      limit: 5,
      locale: 'en',
    })).resolves.toEqual([
      {
        title: 'Example',
        url: 'https://example.com',
        snippet: 'Snippet',
        score: 0.9,
        publishedAt: '2026-05-17',
      },
    ])
  })
})
