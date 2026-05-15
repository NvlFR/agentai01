import type { FetchLike } from '../../../providers/openaiCompatibleProvider.js'
import {
  type SearchExecution,
  type SearchOptions,
  type SearchResult,
  type SearchTool,
  SearchError,
  normalizeSearchResult,
} from '../searchTool.js'
import { FirecrawlPolicy, createFirecrawlPolicy } from './firecrawlPolicy.js'

const DEFAULT_BASE_URL = 'https://api.firecrawl.dev'
const DEFAULT_MAX_RESULTS = 10
const DEFAULT_TIMEOUT_MS = 30_000
const DEFAULT_POLL_INTERVAL_MS = 250

type FirecrawlCrawlOptions = SearchOptions & {
  startUrl: string
  depth?: number
}

type FirecrawlCrawlDocument = {
  markdown?: string
  metadata?: {
    title?: string
    description?: string
    sourceURL?: string
    url?: string
  }
}

export class FirecrawlSearchTool implements SearchTool {
  readonly id = 'firecrawl'
  private readonly fetchFn: FetchLike
  private readonly baseUrl: string
  private readonly timeoutMs: number
  private readonly pollIntervalMs: number
  private readonly sleep: (ms: number) => Promise<void>
  private readonly policy: FirecrawlPolicy

  constructor(
    private readonly apiKey: string,
    options: {
      fetchFn?: FetchLike
      baseUrl?: string
      timeoutMs?: number
      pollIntervalMs?: number
      sleep?: (ms: number) => Promise<void>
      policy?: FirecrawlPolicy
    } = {},
  ) {
    this.fetchFn = options.fetchFn ?? fetch
    this.baseUrl = trimTrailingSlash(options.baseUrl ?? process.env['FIRECRAWL_BASE_URL'] ?? DEFAULT_BASE_URL)
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
    this.pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS
    this.sleep = options.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms)))
    this.policy = options.policy ?? createFirecrawlPolicy(this.fetchFn)
  }

  isEnabled(): boolean {
    return Boolean(this.apiKey || this.baseUrl !== DEFAULT_BASE_URL)
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const execution = await this.searchWeb(query, options)
    return execution.results
  }

  async searchWeb(query: string, options: SearchOptions = {}): Promise<SearchExecution> {
    const maxResults = options.maxResults ?? DEFAULT_MAX_RESULTS
    const response = await this.request('/v2/search', {
      query,
      limit: maxResults,
      sources: ['web'],
      ...(options.domains && options.domains.length > 0 ? { includeDomains: options.domains } : {}),
      ...(options.language ? { location: options.language } : {}),
    })

    const body = await response.json() as {
      data?: {
        web?: Array<{
          title?: string
          description?: string
          url?: string
          markdown?: string
        }>
      }
      warning?: string | null
    }

    const warnings = body.warning ? [body.warning] : []

    return {
      toolId: this.id,
      query,
      mode: options.mode ?? 'results',
      answer: null,
      results: (body.data?.web ?? [])
        .map(result => normalizeSearchResult({
          source: this.id,
          title: result.title,
          url: result.url,
          snippet: result.description ?? result.markdown,
        }))
        .filter((result): result is SearchResult => result !== null),
      audit: {
        timestamp: new Date().toISOString(),
        warnings,
        resultCount: body.data?.web?.length ?? 0,
      },
    }
  }

  async crawl(startUrl: string, options: Omit<FirecrawlCrawlOptions, 'startUrl'> = {}): Promise<SearchExecution> {
    const domainList = options.domains ?? [new URL(startUrl).hostname]
    const warnings = await this.policy.enforceSitePolicy(startUrl, domainList)
    const depth = this.policy.resolveDepth(options.depth)

    const submit = await this.request('/v2/crawl', {
      url: startUrl,
      maxDiscoveryDepth: depth,
      crawlEntireDomain: true,
      allowExternalLinks: false,
      allowSubdomains: false,
      limit: options.maxResults ?? DEFAULT_MAX_RESULTS,
      scrapeOptions: {
        formats: ['markdown'],
        onlyMainContent: true,
      },
    })
    const submitted = await submit.json() as { id?: string }
    const crawlId = submitted.id
    if (!crawlId) {
      throw new SearchError({
        toolId: this.id,
        message: 'Firecrawl: crawl submission did not return an id.',
        retryable: true,
      })
    }

    const startedAt = Date.now()
    for (;;) {
      const statusResponse = await this.request(`/v2/crawl/${crawlId}`)
      const body = await statusResponse.json() as {
        status?: string
        data?: FirecrawlCrawlDocument[]
      }

      if (body.status === 'completed') {
        const results = (body.data ?? [])
          .map(document => normalizeSearchResult({
            source: this.id,
            title: document.metadata?.title,
            url: document.metadata?.sourceURL ?? document.metadata?.url,
            snippet: document.metadata?.description ?? document.markdown,
          }))
          .filter((result): result is SearchResult => result !== null)

        return {
          toolId: this.id,
          query: startUrl,
          mode: options.mode ?? 'results',
          answer: null,
          results,
          audit: {
            timestamp: new Date().toISOString(),
            warnings,
            resultCount: results.length,
          },
        }
      }

      if (body.status === 'failed') {
        throw new SearchError({
          toolId: this.id,
          message: `Firecrawl: crawl failed for ${startUrl}.`,
          retryable: true,
        })
      }

      if (Date.now() - startedAt >= this.timeoutMs) {
        throw new SearchError({
          toolId: this.id,
          message: `Firecrawl: crawl timed out after ${this.timeoutMs}ms.`,
          retryable: true,
        })
      }

      await this.sleep(this.pollIntervalMs)
    }
  }

  private async request(pathname: string, payload?: Record<string, unknown>): Promise<Response> {
    let response: Response
    try {
      response = await this.fetchFn(`${this.baseUrl}${pathname}`, {
        method: payload ? 'POST' : 'GET',
        headers: {
          'content-type': 'application/json',
          ...(this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {}),
        },
        ...(payload ? { body: JSON.stringify(payload) } : {}),
      })
    } catch (err) {
      throw new SearchError({
        toolId: this.id,
        message: `Firecrawl: network error - ${err instanceof Error ? err.message : 'unknown'}`,
        retryable: true,
        cause: err,
      })
    }

    if (response.status === 401 || response.status === 403) {
      throw new SearchError({
        toolId: this.id,
        message: `Firecrawl: invalid credentials (HTTP ${response.status}).`,
        retryable: false,
      })
    }

    if (response.status === 408 || response.status === 429) {
      throw new SearchError({
        toolId: this.id,
        message: `Firecrawl: upstream timeout or rate limit (HTTP ${response.status}).`,
        retryable: true,
      })
    }

    if (!response.ok) {
      throw new SearchError({
        toolId: this.id,
        message: `Firecrawl: API error (HTTP ${response.status}).`,
        retryable: response.status >= 500,
      })
    }

    return response
  }
}

function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

export function createFirecrawlSearchTool(fetchFn?: FetchLike): FirecrawlSearchTool {
  return new FirecrawlSearchTool(process.env['FIRECRAWL_API_KEY'] ?? '', { fetchFn })
}
