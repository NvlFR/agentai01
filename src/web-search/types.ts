import { normalizeWhitespace } from '../shared/index.js'

export const WEB_SEARCH_PROVIDER_IDS = ['tavily', 'duckduckgo'] as const
export const DEFAULT_WEB_SEARCH_LIMIT = 10
export const DEFAULT_WEB_SEARCH_TTL_MS = 60_000

export type BuiltInWebSearchProviderId = (typeof WEB_SEARCH_PROVIDER_IDS)[number]

export type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>

export type WebSearchSearchOptions = {
  limit?: number
  locale?: string
  signal?: AbortSignal
}

export type WebSearchRequest = WebSearchSearchOptions & {
  query: string
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
  search: (request: WebSearchRequest) => Promise<unknown>
}

export type SearchCacheEntry = {
  expiresAt: number
  response: WebSearchResponse
}

export type WebSearchClient = {
  search: (query: string, options?: WebSearchSearchOptions) => Promise<WebSearchResponse>
}

export type WebSearchClientOptions = {
  providers?: readonly WebSearchProvider[]
  ttlMs?: number
  now?: () => number
  cache?: Map<string, SearchCacheEntry>
  env?: Record<string, string | undefined>
  fetch?: FetchLike
}

export function createWebSearchRequest(
  query: string,
  options: WebSearchSearchOptions = {},
): WebSearchRequest {
  const normalizedQuery = normalizeWhitespace(query)
  const normalizedLocale = normalizeOptionalText(options.locale)
  const normalizedLimit = normalizeLimit(options.limit)

  return {
    query: normalizedQuery,
    limit: normalizedLimit,
    locale: normalizedLocale,
    signal: options.signal,
  }
}

export function isBuiltInWebSearchProviderId(value: string): value is BuiltInWebSearchProviderId {
  return WEB_SEARCH_PROVIDER_IDS.includes(value as BuiltInWebSearchProviderId)
}

function normalizeOptionalText(value?: string): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = normalizeWhitespace(value)
  return normalized.length > 0 ? normalized : undefined
}

function normalizeLimit(value?: number): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined
  }

  return Math.max(1, Math.floor(value))
}
