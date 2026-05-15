// src/runtime-app/tools/search/tavily/tavilyTool.ts
// Tavily search tool — AI-optimized search, requires TAVILY_API_KEY.

import {
  type SearchTool,
  type SearchResult,
  type SearchOptions,
  SearchError,
  normalizeSearchResult,
} from '../searchTool.js'
import type { FetchLike } from '../../../providers/openaiCompatibleProvider.js'

const TAVILY_API_URL = 'https://api.tavily.com/search'
const DEFAULT_MAX_RESULTS = 10

export class TavilySearchTool implements SearchTool {
  readonly id = 'tavily'
  private readonly fetchFn: FetchLike

  constructor(
    private readonly apiKey: string,
    fetchFn?: FetchLike,
  ) {
    this.fetchFn = fetchFn ?? fetch
  }

  isEnabled(): boolean {
    return Boolean(this.apiKey)
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const maxResults = options.maxResults ?? DEFAULT_MAX_RESULTS

    let response: Response
    try {
      response = await this.fetchFn(TAVILY_API_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          query,
          max_results: maxResults,
          search_depth: 'basic',
          include_answer: false,
          include_raw_content: false,
        }),
      })
    } catch (err) {
      throw new SearchError({
        toolId: this.id,
        message: `Tavily: network error — ${err instanceof Error ? err.message : 'unknown'}`,
        retryable: true,
        cause: err,
      })
    }

    if (response.status === 401 || response.status === 403) {
      throw new SearchError({
        toolId: this.id,
        message: `Tavily: invalid API key (HTTP ${response.status}).`,
        retryable: false,
      })
    }

    if (response.status === 429) {
      throw new SearchError({
        toolId: this.id,
        message: `Tavily: rate limit exceeded. Retry after cooldown.`,
        retryable: true,
      })
    }

    if (!response.ok) {
      throw new SearchError({
        toolId: this.id,
        message: `Tavily: API error (HTTP ${response.status}).`,
        retryable: response.status >= 500,
      })
    }

    const body = await response.json() as {
      results?: Array<{ title?: string; url?: string; content?: string; score?: number }>
    }

    return (body.results ?? [])
      .map(r => normalizeSearchResult({
        source: this.id,
        title: r.title ?? r.url,
        url: r.url,
        snippet: r.content,
      }))
      .filter((result): result is SearchResult => result !== null)
  }
}

export function createTavilySearchTool(fetchFn?: FetchLike): TavilySearchTool {
  const apiKey = process.env['TAVILY_API_KEY'] ?? ''
  return new TavilySearchTool(apiKey, fetchFn)
}
