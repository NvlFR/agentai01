// src/runtime-app/tools/search/web-readability/webReadabilityTool.ts
// Web Readability tool — extracts readable text content from a URL.
// Strips navigation, ads, scripts, and boilerplate.
// No external dependency — uses fetch + lightweight HTML stripping.

import { type SearchResult, SearchError } from '../searchTool.js'
import type { FetchLike } from '../../../providers/openaiCompatibleProvider.js'

export type ReadabilityResult = {
  url: string
  title: string
  content: string
  wordCount: number
}

const USER_AGENT = 'agentai01-runtime/0.1 (readability tool)'
const DEFAULT_TIMEOUT_MS = 15_000

export class WebReadabilityTool {
  readonly id = 'web-readability'
  private readonly fetchFn: FetchLike

  constructor(fetchFn?: FetchLike) {
    this.fetchFn = fetchFn ?? fetch
  }

  isEnabled(): boolean {
    return true
  }

  async extract(url: string): Promise<ReadabilityResult> {
    if (!isValidUrl(url)) {
      throw new SearchError({
        toolId: this.id,
        message: `web-readability: invalid URL: ${url}`,
        retryable: false,
      })
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

    let response: Response
    try {
      response = await this.fetchFn(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml',
        },
      })
    } catch (err) {
      clearTimeout(timeout)
      if (err instanceof Error && err.name === 'AbortError') {
        throw new SearchError({
          toolId: this.id,
          message: `web-readability: timed out fetching ${url}`,
          retryable: true,
          cause: err,
        })
      }
      throw new SearchError({
        toolId: this.id,
        message: `web-readability: network error fetching ${url} — ${err instanceof Error ? err.message : 'unknown'}`,
        retryable: true,
        cause: err,
      })
    } finally {
      clearTimeout(timeout)
    }

    if (!response.ok) {
      throw new SearchError({
        toolId: this.id,
        message: `web-readability: HTTP ${response.status} fetching ${url}`,
        retryable: response.status >= 500,
      })
    }

    const html = await response.text()
    const title = extractTitle(html)
    const content = stripHtml(html)

    return {
      url,
      title,
      content,
      wordCount: content.split(/\s+/).filter(Boolean).length,
    }
  }

  /** Convenience: return as SearchResult for uniform API. */
  async extractAsSearchResult(url: string): Promise<SearchResult> {
    const result = await this.extract(url)
    return {
      title: result.title,
      url: result.url,
      snippet: result.content.slice(0, 500),
      source: this.id,
    }
  }
}

function isValidUrl(input: string): boolean {
  try {
    const parsed = new URL(input)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return match?.[1]?.trim() ?? ''
}

/** Lightweight HTML stripper — removes tags, scripts, styles, and normalizes whitespace. */
function stripHtml(html: string): string {
  return html
    // Remove script and style blocks entirely
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    // Remove HTML comments
    .replace(/<!--[\s\S]*?-->/g, ' ')
    // Replace block-level tags with newlines
    .replace(/<\/?(p|div|section|article|main|header|footer|h[1-6]|li|br)[^>]*>/gi, '\n')
    // Remove remaining tags
    .replace(/<[^>]+>/g, ' ')
    // Decode common HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Normalize whitespace
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function createWebReadabilityTool(fetchFn?: FetchLike): WebReadabilityTool {
  return new WebReadabilityTool(fetchFn)
}
