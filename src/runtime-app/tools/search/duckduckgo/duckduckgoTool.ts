// src/runtime-app/tools/search/duckduckgo/duckduckgoTool.ts
// DuckDuckGo search tool — no API key required, uses public HTML endpoint.
// Uses DuckDuckGo Instant Answers API (returns JSON summary, not full results).

import {
  type SearchTool,
  type SearchResult,
  type SearchOptions,
  SearchError,
  normalizeSearchResult,
} from '../searchTool.js'
import type { FetchLike } from '../../../providers/openaiCompatibleProvider.js'

const DDG_API_URL = 'https://api.duckduckgo.com/'
const DEFAULT_MAX_RESULTS = 10

export class DuckDuckGoSearchTool implements SearchTool {
  readonly id = 'duckduckgo'
  private readonly fetchFn: FetchLike

  constructor(fetchFn?: FetchLike) {
    this.fetchFn = fetchFn ?? fetch
  }

  isEnabled(): boolean {
    // No API key required — always available.
    return true
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const url = new URL(DDG_API_URL)
    url.searchParams.set('q', query)
    url.searchParams.set('format', 'json')
    url.searchParams.set('no_redirect', '1')
    url.searchParams.set('no_html', '1')
    url.searchParams.set('skip_disambig', '1')

    let response: Response
    try {
      response = await this.fetchFn(url.toString(), {
        headers: { 'User-Agent': 'agentai01-runtime/0.1 (search tool)' },
      })
    } catch (err) {
      throw new SearchError({
        toolId: this.id,
        message: `DuckDuckGo: network error — ${err instanceof Error ? err.message : 'unknown'}`,
        retryable: true,
        cause: err,
      })
    }

    if (response.status === 429) {
      throw new SearchError({
        toolId: this.id,
        message: `DuckDuckGo: rate limit hit. Retry after a short delay.`,
        retryable: true,
      })
    }

    if (!response.ok) {
      throw new SearchError({
        toolId: this.id,
        message: `DuckDuckGo: API error (HTTP ${response.status}).`,
        retryable: response.status >= 500,
      })
    }

    const body = await response.json() as {
      AbstractText?: string
      AbstractURL?: string
      AbstractTitle?: string
      RelatedTopics?: Array<{
        Text?: string
        FirstURL?: string
        Name?: string
      }>
    }

    const results: SearchResult[] = []
    const max = options.maxResults ?? DEFAULT_MAX_RESULTS

    // Primary result from Abstract
    if (body.AbstractURL && body.AbstractTitle) {
      results.push({
        title: body.AbstractTitle,
        url: body.AbstractURL,
        snippet: body.AbstractText ?? '',
        source: this.id,
      })
    }

    // Related topics as additional results
    for (const topic of (body.RelatedTopics ?? [])) {
      if (results.length >= max) break
      if (!topic.FirstURL) continue
      const result = normalizeSearchResult({
        source: this.id,
        title: topic.Name ?? topic.Text?.slice(0, 80) ?? '',
        url: topic.FirstURL,
        snippet: topic.Text ?? '',
      })
      if (result) {
        results.push(result)
      }
    }

    return results
  }
}

export function createDuckDuckGoSearchTool(fetchFn?: FetchLike): DuckDuckGoSearchTool {
  return new DuckDuckGoSearchTool(fetchFn)
}
