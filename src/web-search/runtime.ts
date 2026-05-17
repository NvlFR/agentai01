import { generateId, normalizeWhitespace } from '../shared/index.js'
import {
  createDuckDuckGoWebSearchProvider,
  normalizeDuckDuckGoSearchResults,
} from './providers/duckduckgo.js'
import { createTavilyWebSearchProvider, normalizeTavilySearchResults } from './providers/tavily.js'
import {
  type ProviderSearchResult,
  type SearchCacheEntry,
  type WebSearchClient,
  type WebSearchClientOptions,
  type WebSearchProvider,
  type WebSearchRequest,
  type WebSearchResponse,
  DEFAULT_WEB_SEARCH_TTL_MS,
  createWebSearchRequest,
  isBuiltInWebSearchProviderId,
} from './types.js'

const GENERIC_PROVIDER_RESULT_KEYS = ['title', 'url', 'snippet', 'score', 'publishedAt', 'metadata'] as const

export function createWebSearchClient(options: WebSearchClientOptions = {}): WebSearchClient {
  const providers = resolveProviders(options)
  if (providers.length === 0) {
    throw new Error('No web search providers configured')
  }

  const cache = options.cache ?? new Map<string, SearchCacheEntry>()
  const ttlMs = options.ttlMs ?? DEFAULT_WEB_SEARCH_TTL_MS
  const now = options.now ?? Date.now

  return {
    async search(query: string, requestOptions = {}): Promise<WebSearchResponse> {
      const request = createWebSearchRequest(query, requestOptions)
      const key = cacheKey(request)
      const cached = cache.get(key)
      if (cached && cached.expiresAt > now()) {
        return { ...cached.response, cached: true }
      }

      const errors: string[] = []
      for (const provider of providers) {
        try {
          const rawResults = await provider.search(request)
          const response: WebSearchResponse = {
            provider_id: provider.id,
            query: request.query,
            results: normalizeSearchResults(rawResults, provider.id).slice(0, request.limit),
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

export function normalizeSearchResults(raw: unknown, providerId: string): Array<ReturnType<typeof buildWebSearchResult>> {
  const providerResults = resolveProviderResults(raw, providerId)
  const seen = new Set<string>()
  const normalized = []

  for (const result of providerResults) {
    const url = result.url.trim()
    if (!url || seen.has(url)) {
      continue
    }

    seen.add(url)
    normalized.push(buildWebSearchResult(providerId, result))
  }

  return normalized
}

function buildWebSearchResult(providerId: string, result: ProviderSearchResult) {
  return {
    id: generateId('search'),
    title: normalizeWhitespace(result.title ?? result.url),
    url: result.url.trim(),
    snippet: normalizeWhitespace(result.snippet ?? ''),
    score: result.score,
    published_at: result.publishedAt,
    provider_id: providerId,
    metadata: result.metadata,
  }
}

function resolveProviderResults(raw: unknown, providerId: string): ProviderSearchResult[] {
  if (isBuiltInWebSearchProviderId(providerId)) {
    switch (providerId) {
      case 'tavily':
        return normalizeTavilySearchResults(raw)
      case 'duckduckgo':
        return normalizeDuckDuckGoSearchResults(raw)
    }
  }

  if (!Array.isArray(raw)) {
    return []
  }

  const normalized: ProviderSearchResult[] = []
  for (const item of raw) {
    const candidate = coerceProviderSearchResult(item)
    if (candidate) {
      normalized.push(candidate)
    }
  }

  return normalized
}

function coerceProviderSearchResult(value: unknown): ProviderSearchResult | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const record = value as Record<string, unknown>
  const url = typeof record.url === 'string' ? record.url : undefined
  if (!url) {
    return null
  }

  const metadata = readMetadata(record.metadata)

  return {
    title: typeof record.title === 'string' ? record.title : undefined,
    url,
    snippet: typeof record.snippet === 'string' ? record.snippet : undefined,
    score: typeof record.score === 'number' ? record.score : undefined,
    publishedAt: typeof record.publishedAt === 'string' ? record.publishedAt : undefined,
    metadata,
  }
}

function readMetadata(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined
  }

  return Object.fromEntries(
    Object.entries(value).filter(([key]) => !GENERIC_PROVIDER_RESULT_KEYS.includes(key as (typeof GENERIC_PROVIDER_RESULT_KEYS)[number])),
  )
}

function resolveProviders(options: WebSearchClientOptions): WebSearchProvider[] {
  if (options.providers && options.providers.length > 0) {
    return [...options.providers]
  }

  const env = options.env ?? process.env
  const tavilyApiKey = env['TAVILY_API_KEY']
  if (typeof tavilyApiKey === 'string' && tavilyApiKey.trim().length > 0) {
    return [createTavilyWebSearchProvider({ apiKey: tavilyApiKey, fetch: options.fetch })]
  }

  return [createDuckDuckGoWebSearchProvider({ fetch: options.fetch })]
}

function cacheKey(request: WebSearchRequest): string {
  return JSON.stringify({
    query: request.query.toLowerCase(),
    limit: request.limit,
    locale: request.locale,
  })
}
