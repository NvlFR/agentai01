import type { FetchLike } from '../../../providers/openaiCompatibleProvider.js'
import {
  type SearchExecution,
  type SearchOptions,
  type SearchResult,
  type SearchTool,
  SearchError,
  normalizeSearchResult,
} from '../searchTool.js'

const PERPLEXITY_SEARCH_URL = 'https://api.perplexity.ai/search'
const PERPLEXITY_SONAR_URL = 'https://api.perplexity.ai/v1/sonar'
const DEFAULT_MAX_RESULTS = 10
const DEFAULT_MODEL = 'sonar'

type PerplexitySearchBody = {
  results?: Array<{
    title?: string
    url?: string
    snippet?: string
  }>
}

type PerplexitySonarBody = {
  citations?: string[]
  search_results?: Array<{
    title?: string
    url?: string
    snippet?: string
  }>
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

export class PerplexitySearchTool implements SearchTool {
  readonly id = 'perplexity'
  private readonly fetchFn: FetchLike
  private readonly model: string

  constructor(
    private readonly apiKey: string,
    options: {
      fetchFn?: FetchLike
      model?: string
    } = {},
  ) {
    this.fetchFn = options.fetchFn ?? fetch
    this.model = options.model ?? DEFAULT_MODEL
  }

  isEnabled(): boolean {
    return Boolean(this.apiKey)
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const execution = await this.run(query, options)
    return execution.results
  }

  async run(query: string, options: SearchOptions = {}): Promise<SearchExecution> {
    const mode = options.mode ?? 'results'
    const warnings: string[] = []
    const rawResults =
      mode === 'results'
        ? await this.fetchRawResults(query, options)
        : await this.fetchAnswerResults(query, options)

    if (rawResults.answer && mode === 'hybrid' && rawResults.results.length === 0) {
      warnings.push('Perplexity returned an answer without cited search results.')
    }

    return {
      toolId: this.id,
      query,
      mode,
      answer: rawResults.answer,
      results: rawResults.results,
      audit: {
        timestamp: new Date().toISOString(),
        warnings,
        resultCount: rawResults.results.length,
      },
    }
  }

  private async fetchRawResults(
    query: string,
    options: SearchOptions,
  ): Promise<{ answer: null; results: SearchResult[] }> {
    const maxResults = options.maxResults ?? DEFAULT_MAX_RESULTS

    const response = await this.request(PERPLEXITY_SEARCH_URL, {
      query,
      max_results: maxResults,
      ...(options.language ? { search_language_filter: [options.language] } : {}),
      ...(options.domains && options.domains.length > 0
        ? { search_domain_filter: options.domains }
        : {}),
    })

    const body = await response.json() as PerplexitySearchBody
    return {
      answer: null,
      results: (body.results ?? [])
        .map(result => normalizeSearchResult({
          source: this.id,
          title: result.title,
          url: result.url,
          snippet: result.snippet,
        }))
        .filter((result): result is SearchResult => result !== null),
    }
  }

  private async fetchAnswerResults(
    query: string,
    options: SearchOptions,
  ): Promise<{ answer: string | null; results: SearchResult[] }> {
    const response = await this.request(PERPLEXITY_SONAR_URL, {
      model: this.model,
      messages: [{ role: 'user', content: query }],
      stream: false,
      web_search_options: {
        ...(options.domains && options.domains.length > 0 ? { search_domain_filter: options.domains } : {}),
      },
    })

    const body = await response.json() as PerplexitySonarBody
    const answer = body.choices?.[0]?.message?.content?.trim() || null

    return {
      answer,
      results: (body.search_results ?? [])
        .map(result => normalizeSearchResult({
          source: this.id,
          title: result.title,
          url: result.url,
          snippet: result.snippet,
        }))
        .filter((result): result is SearchResult => result !== null),
    }
  }

  private async request(url: string, payload: Record<string, unknown>): Promise<Response> {
    let response: Response
    try {
      response = await this.fetchFn(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      })
    } catch (err) {
      throw new SearchError({
        toolId: this.id,
        message: `Perplexity: network error - ${err instanceof Error ? err.message : 'unknown'}`,
        retryable: true,
        cause: err,
      })
    }

    if (response.status === 401 || response.status === 403) {
      throw new SearchError({
        toolId: this.id,
        message: `Perplexity: invalid API key (HTTP ${response.status}).`,
        retryable: false,
      })
    }

    if (response.status === 429) {
      throw new SearchError({
        toolId: this.id,
        message: 'Perplexity: rate limit exceeded. Retry after cooldown.',
        retryable: true,
      })
    }

    if (!response.ok) {
      throw new SearchError({
        toolId: this.id,
        message: `Perplexity: API error (HTTP ${response.status}).`,
        retryable: response.status >= 500,
      })
    }

    return response
  }
}

export function createPerplexitySearchTool(fetchFn?: FetchLike): PerplexitySearchTool {
  return new PerplexitySearchTool(process.env['PERPLEXITY_API_KEY'] ?? '', { fetchFn })
}
