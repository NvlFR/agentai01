// src/runtime-app/tools/search/brave/braveTool.ts
// Brave Search tool — requires BRAVE_API_KEY.

import {
  type SearchTool,
  type SearchResult,
  type SearchOptions,
  SearchError,
  normalizeSearchResult,
} from '../searchTool.js'
import type { FetchLike } from '../../../providers/openaiCompatibleProvider.js'

const BRAVE_API_URL = 'https://api.search.brave.com/res/v1/web/search'
const DEFAULT_MAX_RESULTS = 10

export class BraveSearchTool implements SearchTool {
  readonly id = 'brave'
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
    const count = options.maxResults ?? DEFAULT_MAX_RESULTS
    const url = new URL(BRAVE_API_URL)
    url.searchParams.set('q', query)
    url.searchParams.set('count', String(count))
    if (options.language) url.searchParams.set('search_lang', options.language)

    let response: Response
    try {
      response = await this.fetchFn(url.toString(), {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': this.apiKey,
        },
      })
    } catch (err) {
      throw new SearchError({
        toolId: this.id,
        message: `Brave Search: network error — ${err instanceof Error ? err.message : 'unknown'}`,
        retryable: true,
        cause: err,
      })
    }

    if (response.status === 401 || response.status === 403) {
      throw new SearchError({
        toolId: this.id,
        message: `Brave Search: invalid API key (HTTP ${response.status}).`,
        retryable: false,
      })
    }

    if (response.status === 429) {
      throw new SearchError({
        toolId: this.id,
        message: `Brave Search: rate limit exceeded. Retry after cooldown.`,
        retryable: true,
      })
    }

    if (!response.ok) {
      throw new SearchError({
        toolId: this.id,
        message: `Brave Search: API error (HTTP ${response.status}).`,
        retryable: response.status >= 500,
      })
    }

    const body = await response.json() as {
      web?: { results?: Array<{ title?: string; url?: string; description?: string }> }
    }

    return (body.web?.results ?? [])
      .map(r => normalizeSearchResult({
        source: this.id,
        title: r.title,
        url: r.url,
        snippet: r.description,
      }))
      .filter((result): result is SearchResult => result !== null)
  }
}

export function createBraveSearchTool(fetchFn?: FetchLike): BraveSearchTool {
  const apiKey = process.env['BRAVE_API_KEY'] ?? ''
  return new BraveSearchTool(apiKey, fetchFn)
}
