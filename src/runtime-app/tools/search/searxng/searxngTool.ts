import type { FetchLike } from '../../../providers/openaiCompatibleProvider.js'
import {
  type SearchExecution,
  type SearchOptions,
  type SearchResult,
  type SearchTool,
  SearchError,
  normalizeSearchResult,
} from '../searchTool.js'

const DEFAULT_MAX_RESULTS = 10

export class SearxngSearchTool implements SearchTool {
  readonly id = 'searxng'
  private readonly fetchFn: FetchLike

  constructor(
    private readonly baseUrl: string,
    fetchFn?: FetchLike,
  ) {
    this.fetchFn = fetchFn ?? fetch
  }

  isEnabled(): boolean {
    return Boolean(this.baseUrl)
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const execution = await this.run(query, options)
    return execution.results
  }

  async run(query: string, options: SearchOptions = {}): Promise<SearchExecution> {
    if (!this.baseUrl) {
      throw new SearchError({
        toolId: this.id,
        message: 'SearXNG: SEARXNG_BASE_URL is not configured.',
        retryable: false,
      })
    }

    const url = new URL('/search', ensureTrailingSlash(this.baseUrl))
    url.searchParams.set('q', query)
    url.searchParams.set('format', 'json')
    url.searchParams.set('pageno', '1')
    url.searchParams.set('language', options.language ?? 'en')
    if (options.domains && options.domains.length > 0) {
      url.searchParams.set('q', `${query} ${options.domains.map(domain => `site:${domain}`).join(' ')}`.trim())
    }

    let response: Response
    try {
      response = await this.fetchFn(url.toString(), {
        headers: {
          accept: 'application/json',
        },
      })
    } catch (err) {
      throw new SearchError({
        toolId: this.id,
        message: `SearXNG: network error - ${err instanceof Error ? err.message : 'unknown'}`,
        retryable: true,
        cause: err,
      })
    }

    if (response.status === 403) {
      throw new SearchError({
        toolId: this.id,
        message: 'SearXNG: JSON format not enabled on the configured instance.',
        retryable: false,
      })
    }

    if (response.status === 429) {
      throw new SearchError({
        toolId: this.id,
        message: 'SearXNG: rate limit exceeded.',
        retryable: true,
      })
    }

    if (!response.ok) {
      throw new SearchError({
        toolId: this.id,
        message: `SearXNG: API error (HTTP ${response.status}).`,
        retryable: response.status >= 500,
      })
    }

    const body = await response.json() as {
      results?: Array<{
        title?: string
        url?: string
        content?: string
      }>
    }

    const results = (body.results ?? [])
      .slice(0, options.maxResults ?? DEFAULT_MAX_RESULTS)
      .map(result => normalizeSearchResult({
        source: this.id,
        title: result.title,
        url: result.url,
        snippet: result.content,
      }))
      .filter((result): result is SearchResult => result !== null)

    return {
      toolId: this.id,
      query,
      mode: options.mode ?? 'results',
      answer: null,
      results,
      audit: {
        timestamp: new Date().toISOString(),
        warnings: [],
        resultCount: results.length,
      },
    }
  }
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

export function createSearxngSearchTool(fetchFn?: FetchLike): SearxngSearchTool {
  return new SearxngSearchTool(process.env['SEARXNG_BASE_URL'] ?? '', fetchFn)
}
