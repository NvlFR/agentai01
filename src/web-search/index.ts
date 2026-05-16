import { generateId, normalizeWhitespace } from '../shared/index.js'

export type WebSearchRequest = {
  query: string
  limit?: number
  locale?: string
  signal?: AbortSignal
}

export type ProviderSearchResult = {
  title?: string
  url: string
  snippet?: string
  score?: number
  publishedAt?: string
  metadata?: Record<string, unknown>
}

export type WebSearchResult = {
  id: string
  title: string
  url: string
  snippet: string
  score?: number
  published_at?: string
  provider_id: string
  metadata?: Record<string, unknown>
}

export type WebSearchResponse = {
  provider_id: string
  query: string
  results: WebSearchResult[]
  cached: boolean
}

export type WebSearchProvider = {
  id: string
  search: (request: WebSearchRequest) => Promise<readonly ProviderSearchResult[]>
}

export type SearchCacheEntry = {
  expiresAt: number
  response: WebSearchResponse
}

export type WebSearchOptions = {
  providers: readonly WebSearchProvider[]
  ttlMs?: number
  now?: () => number
  cache?: Map<string, SearchCacheEntry>
}

const DEFAULT_TTL_MS = 60_000

export function normalizeSearchResults(
  providerId: string,
  results: readonly ProviderSearchResult[],
): WebSearchResult[] {
  const seen = new Set<string>()
  const normalized: WebSearchResult[] = []

  for (const result of results) {
    const url = result.url.trim()
    if (!url || seen.has(url)) {
      continue
    }
    seen.add(url)
    normalized.push({
      id: generateId('search'),
      title: normalizeWhitespace(result.title ?? url),
      url,
      snippet: normalizeWhitespace(result.snippet ?? ''),
      score: result.score,
      published_at: result.publishedAt,
      provider_id: providerId,
      metadata: result.metadata,
    })
  }

  return normalized
}

export function createWebSearchClient(options: WebSearchOptions) {
  const cache = options.cache ?? new Map<string, SearchCacheEntry>()
  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS
  const now = options.now ?? Date.now

  return {
    async search(request: WebSearchRequest): Promise<WebSearchResponse> {
      const key = cacheKey(request)
      const cached = cache.get(key)
      if (cached && cached.expiresAt > now()) {
        return { ...cached.response, cached: true }
      }

      const errors: string[] = []
      for (const provider of options.providers) {
        try {
          const rawResults = await provider.search(request)
          const response: WebSearchResponse = {
            provider_id: provider.id,
            query: normalizeWhitespace(request.query),
            results: normalizeSearchResults(provider.id, rawResults).slice(0, request.limit),
            cached: false,
          }
          cache.set(key, { expiresAt: now() + ttlMs, response })
          return response
        } catch (error) {
          errors.push(`${provider.id}: ${error instanceof Error ? error.message : 'search failed'}`)
        }
      }

      throw new Error(`No web search provider succeeded: ${errors.join('; ')}`)
    },
  }
}

function cacheKey(request: WebSearchRequest): string {
  return JSON.stringify({
    query: normalizeWhitespace(request.query).toLowerCase(),
    limit: request.limit,
    locale: request.locale,
  })
}
