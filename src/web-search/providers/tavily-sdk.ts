import { tavily, type TavilyClient } from 'tavily'

import type { ProviderSearchResult, WebSearchProvider, WebSearchRequest } from '../types.js'

export function createTavilySdkWebSearchProvider(input: {
  apiKey: string
  client?: Pick<TavilyClient, 'search'>
}): WebSearchProvider {
  const client = input.client ?? tavily({
    apiKey: input.apiKey,
    clientName: 'agentai01',
  })

  return {
    id: 'tavily',
    async search(request: WebSearchRequest): Promise<ProviderSearchResult[]> {
      const response = await client.search(request.query, {
        maxResults: request.limit,
        topic: 'general',
        searchDepth: 'basic',
        includeAnswer: false,
        includeRawContent: false,
      })

      return response.results.map(result => ({
        title: result.title,
        url: result.url,
        snippet: result.content,
        score: result.score,
        publishedAt: result.publishedDate,
      }))
    },
  }
}
