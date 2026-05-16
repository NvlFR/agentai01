// src/runtime-app/tools/search/searchTool.ts
// SearchTool interface contract — all search backends implement this.

export type SearchResult = {
  title: string
  url: string
  snippet: string
  source: string
}

export type SearchOptions = {
  maxResults?: number
  language?: string
  mode?: 'results' | 'answer' | 'hybrid'
  domains?: string[]
}

export type SearchTool = {
  readonly id: string
  isEnabled(): boolean
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>
}

export type SearchToolError = {
  readonly toolId: string
  readonly message: string
  readonly retryable: boolean
}

export class SearchError extends Error {
  readonly toolId: string
  readonly retryable: boolean

  constructor(args: { toolId: string; message: string; retryable: boolean; cause?: unknown }) {
    super(args.message, args.cause ? { cause: args.cause } : undefined)
    this.name = 'SearchError'
    this.toolId = args.toolId
    this.retryable = args.retryable
  }
}

export type SearchExecution = {
  toolId: string
  query: string
  mode: NonNullable<SearchOptions['mode']>
  answer: string | null
  results: SearchResult[]
  audit: {
    timestamp: string
    warnings: string[]
    resultCount: number
  }
}

export function normalizeSearchResult(args: {
  source: string
  title?: string | null
  url?: string | null
  snippet?: string | null
}): SearchResult | null {
  const url = args.url?.trim() ?? ''
  if (!url) {
    return null
  }

  const title = args.title?.trim() || url
  const snippet = args.snippet?.trim() ?? ''

  return {
    title,
    url,
    snippet,
    source: args.source,
  }
}
