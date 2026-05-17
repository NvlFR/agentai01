import { z } from 'zod'

import type { FetchLike, ProviderSearchResult, WebSearchProvider, WebSearchRequest } from '../types.js'

export const DUCKDUCKGO_WEB_SEARCH_URL = 'https://api.duckduckgo.com/'
const DUCKDUCKGO_USER_AGENT = 'agentai01-web-search/0.1'

type DuckDuckGoTopic = {
  Text?: string
  FirstURL?: string
  Name?: string
  Topics?: DuckDuckGoTopic[]
}

const duckDuckGoTopicSchema: z.ZodType<DuckDuckGoTopic> = z.lazy(() =>
  z.object({
    Text: z.string().optional(),
    FirstURL: z.string().optional(),
    Name: z.string().optional(),
    Topics: z.array(duckDuckGoTopicSchema).optional(),
  }),
)

const duckDuckGoResponseSchema = z.object({
  AbstractText: z.string().optional(),
  AbstractURL: z.string().optional(),
  AbstractTitle: z.string().optional(),
  RelatedTopics: z.array(duckDuckGoTopicSchema).default([]),
})

export type DuckDuckGoSearchResponse = z.infer<typeof duckDuckGoResponseSchema>

export type DuckDuckGoWebSearchProviderOptions = {
  fetch?: FetchLike
  baseUrl?: string
}

export function createDuckDuckGoWebSearchProvider(
  options: DuckDuckGoWebSearchProviderOptions = {},
): WebSearchProvider {
  const fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis)
  const baseUrl = options.baseUrl ?? DUCKDUCKGO_WEB_SEARCH_URL

  return {
    id: 'duckduckgo',
    async search(request: WebSearchRequest): Promise<DuckDuckGoSearchResponse> {
      const url = new URL(baseUrl)
      url.searchParams.set('q', request.query)
      url.searchParams.set('format', 'json')
      url.searchParams.set('no_redirect', '1')
      url.searchParams.set('no_html', '1')
      url.searchParams.set('skip_disambig', '1')
      if (request.locale) {
        url.searchParams.set('kl', request.locale)
      }

      let response: Response
      try {
        response = await fetchImpl(url, {
          headers: { 'user-agent': DUCKDUCKGO_USER_AGENT },
          signal: request.signal,
        })
      } catch (error) {
        throw new Error(`DuckDuckGo network error: ${error instanceof Error ? error.message : 'unknown error'}`)
      }

      if (!response.ok) {
        throw new Error(`DuckDuckGo search failed with HTTP ${response.status}`)
      }

      const payload = await readJsonResponse(response, 'duckduckgo')
      return duckDuckGoResponseSchema.parse(payload)
    },
  }
}

export function normalizeDuckDuckGoSearchResults(raw: unknown): ProviderSearchResult[] {
  const parsed = duckDuckGoResponseSchema.safeParse(raw)
  if (!parsed.success) {
    return []
  }

  const results: ProviderSearchResult[] = []
  if (parsed.data.AbstractURL) {
    results.push({
      title: parsed.data.AbstractTitle,
      url: parsed.data.AbstractURL,
      snippet: parsed.data.AbstractText,
      metadata: { source: 'abstract' },
    })
  }

  for (const topic of flattenDuckDuckGoTopics(parsed.data.RelatedTopics)) {
    if (!topic.FirstURL) {
      continue
    }

    results.push({
      title: topic.Name ?? topic.Text,
      url: topic.FirstURL,
      snippet: topic.Text,
      metadata: { source: 'related_topic' },
    })
  }

  return results
}

function flattenDuckDuckGoTopics(
  topics: ReadonlyArray<DuckDuckGoTopic>,
): DuckDuckGoTopic[] {
  const flattened: DuckDuckGoTopic[] = []

  for (const topic of topics) {
    flattened.push(topic)
    if (topic.Topics) {
      flattened.push(...flattenDuckDuckGoTopics(topic.Topics))
    }
  }

  return flattened
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
