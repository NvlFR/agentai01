import { z } from 'zod'

import type { FetchLike, ProviderSearchResult, WebSearchProvider, WebSearchRequest } from '../types.js'

export const TAVILY_WEB_SEARCH_URL = 'https://api.tavily.com/search'

const tavilyResultSchema = z.object({
  title: z.string().optional(),
  url: z.string().min(1),
  content: z.string().optional(),
  score: z.number().optional(),
  published_date: z.string().optional(),
})

const tavilyResponseSchema = z.object({
  results: z.array(tavilyResultSchema).default([]),
})

export type TavilySearchResponse = z.infer<typeof tavilyResponseSchema>

export type TavilyWebSearchProviderOptions = {
  apiKey?: string
  fetch?: FetchLike
  baseUrl?: string
}

export function createTavilyWebSearchProvider(
  options: TavilyWebSearchProviderOptions = {},
): WebSearchProvider {
  const apiKey = options.apiKey ?? process.env['TAVILY_API_KEY'] ?? ''
  const fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis)
  const baseUrl = options.baseUrl ?? TAVILY_WEB_SEARCH_URL

  return {
    id: 'tavily',
    async search(request: WebSearchRequest): Promise<TavilySearchResponse> {
      if (!apiKey) {
        throw new Error('TAVILY_API_KEY is required')
      }

      let response: Response
      try {
        response = await fetchImpl(baseUrl, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${apiKey}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            query: request.query,
            max_results: request.limit,
            topic: request.locale ? 'general' : 'general',
            search_depth: 'basic',
            include_answer: false,
            include_raw_content: false,
          }),
          signal: request.signal,
        })
      } catch (error) {
        throw new Error(`Tavily network error: ${error instanceof Error ? error.message : 'unknown error'}`)
      }

      if (response.status === 401 || response.status === 403) {
        throw new Error(`Tavily authentication failed with HTTP ${response.status}`)
      }

      if (!response.ok) {
        throw new Error(`Tavily search failed with HTTP ${response.status}`)
      }

      const payload = await readJsonResponse(response, 'tavily')
      return tavilyResponseSchema.parse(payload)
    },
  }
}

export function normalizeTavilySearchResults(raw: unknown): ProviderSearchResult[] {
  const parsed = tavilyResponseSchema.safeParse(raw)
  if (!parsed.success) {
    return []
  }

  return parsed.data.results.map(result => ({
    title: result.title,
    url: result.url,
    snippet: result.content,
    score: result.score,
    publishedAt: result.published_date,
  }))
}

async function readJsonResponse(response: Response, providerId: string): Promise<unknown> {
  try {
    return await response.json()
  } catch (error) {
    throw new Error(
      `${providerId} returned invalid JSON: ${error instanceof Error ? error.message : 'unknown error'}`,
    )
  }
}
