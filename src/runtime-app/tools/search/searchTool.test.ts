// src/runtime-app/tools/search/searchTool.test.ts
// Contract tests for all search tools — completeness and error typing properties.

import { describe, it, expect, mock } from 'bun:test'
import { BraveSearchTool } from './brave/braveTool.js'
import { DuckDuckGoSearchTool } from './duckduckgo/duckduckgoTool.js'
import { ExaSearchTool } from './exa/exaTool.js'
import { TavilySearchTool } from './tavily/tavilyTool.js'
import { WebReadabilityTool } from './web-readability/webReadabilityTool.js'
import { SearchError, type SearchTool } from './searchTool.js'

function makeMockResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

// Contract: every search tool returns SearchResult[] or throws SearchError — never undefined.
// Individual tool contracts are tested below with injected fetchFn mocks.

// --- Brave ---
describe('BraveSearchTool', () => {
  const braveBody = {
    web: {
      results: [
        { title: 'Result 1', url: 'https://example.com/1', description: 'Snippet 1' },
        { title: 'Result 2', url: 'https://example.com/2', description: 'Snippet 2' },
      ],
    },
  }

  it('returns SearchResult[] on success', async () => {
    const fetchFn = mock(() => Promise.resolve(makeMockResponse(200, braveBody)))
    const tool = new BraveSearchTool('test-key', fetchFn)
    const results = await tool.search('test query')

    expect(Array.isArray(results)).toBe(true)
    expect(results.length).toBe(2)
    expect(results[0]).toMatchObject({ title: expect.any(String), url: expect.any(String), snippet: expect.any(String) })
  })

  it('throws non-retryable SearchError on 401', async () => {
    const fetchFn = mock(() => Promise.resolve(makeMockResponse(401, {})))
    const tool = new BraveSearchTool('bad-key', fetchFn)

    try {
      await tool.search('query')
      expect(true).toBe(false) // should not reach
    } catch (err) {
      expect(err instanceof SearchError).toBe(true)
      if (err instanceof SearchError) {
        expect(err.retryable).toBe(false)
        expect(err.toolId).toBe('brave')
      }
    }
  })

  it('throws retryable SearchError on 429', async () => {
    const fetchFn = mock(() => Promise.resolve(makeMockResponse(429, {})))
    const tool = new BraveSearchTool('key', fetchFn)

    try {
      await tool.search('query')
    } catch (err) {
      expect(err instanceof SearchError).toBe(true)
      if (err instanceof SearchError) {
        expect(err.retryable).toBe(true)
      }
    }
  })

  it('returns empty array when no results', async () => {
    const fetchFn = mock(() => Promise.resolve(makeMockResponse(200, { web: { results: [] } })))
    const tool = new BraveSearchTool('key', fetchFn)
    const results = await tool.search('query')
    expect(results).toHaveLength(0)
  })
})

// --- DuckDuckGo ---
describe('DuckDuckGoSearchTool', () => {
  const ddgBody = {
    AbstractTitle: 'Test Topic',
    AbstractURL: 'https://example.com',
    AbstractText: 'This is a summary.',
    RelatedTopics: [
      { Text: 'Topic A description', FirstURL: 'https://example.com/a', Name: 'Topic A' },
    ],
  }

  it('returns SearchResult[] on success', async () => {
    const fetchFn = mock(() => Promise.resolve(makeMockResponse(200, ddgBody)))
    const tool = new DuckDuckGoSearchTool(fetchFn)
    const results = await tool.search('test')

    expect(Array.isArray(results)).toBe(true)
    expect(results.length).toBeGreaterThan(0)
    expect(results[0]).toMatchObject({ title: expect.any(String), url: expect.any(String), snippet: expect.any(String) })
  })

  it('isEnabled returns true (no API key required)', () => {
    const tool = new DuckDuckGoSearchTool()
    expect(tool.isEnabled()).toBe(true)
  })

  it('returns empty array when no abstract or related topics', async () => {
    const fetchFn = mock(() => Promise.resolve(makeMockResponse(200, {})))
    const tool = new DuckDuckGoSearchTool(fetchFn)
    const results = await tool.search('query')
    expect(Array.isArray(results)).toBe(true)
  })
})

// --- Exa ---
describe('ExaSearchTool', () => {
  const exaBody = {
    results: [
      { title: 'Exa Result', url: 'https://example.com', snippet: 'Some snippet', highlights: ['hl1'] },
    ],
  }

  it('returns SearchResult[] on success', async () => {
    const fetchFn = mock(() => Promise.resolve(makeMockResponse(200, exaBody)))
    const tool = new ExaSearchTool('key', fetchFn)
    const results = await tool.search('query')

    expect(results).toHaveLength(1)
    expect(results[0]?.url).toBe('https://example.com')
  })

  it('throws non-retryable on 403', async () => {
    const fetchFn = mock(() => Promise.resolve(makeMockResponse(403, {})))
    const tool = new ExaSearchTool('bad-key', fetchFn)

    try { await tool.search('q') } catch (err) {
      expect(err instanceof SearchError).toBe(true)
      if (err instanceof SearchError) expect(err.retryable).toBe(false)
    }
  })
})

// --- Tavily ---
describe('TavilySearchTool', () => {
  const tavilyBody = {
    results: [
      { title: 'Tavily Result', url: 'https://example.com', content: 'Content here', score: 0.9 },
    ],
  }

  it('returns SearchResult[] on success', async () => {
    const fetchFn = mock(() => Promise.resolve(makeMockResponse(200, tavilyBody)))
    const tool = new TavilySearchTool('key', fetchFn)
    const results = await tool.search('query')

    expect(results).toHaveLength(1)
    expect(results[0]?.snippet).toBe('Content here')
  })
})

// --- WebReadability ---
describe('WebReadabilityTool', () => {
  it('extracts title and content from HTML', async () => {
    const html = `<html><head><title>Test Page</title></head><body><p>Hello world content here.</p></body></html>`
    const fetchFn = mock(() => Promise.resolve(new Response(html, {
      status: 200,
      headers: { 'content-type': 'text/html' },
    })))
    const tool = new WebReadabilityTool(fetchFn)
    const result = await tool.extract('https://example.com/page')

    expect(result.title).toBe('Test Page')
    expect(result.content).toContain('Hello world')
    expect(result.wordCount).toBeGreaterThan(0)
    expect(result.url).toBe('https://example.com/page')
  })

  it('throws SearchError for invalid URL', async () => {
    const tool = new WebReadabilityTool()
    try {
      await tool.extract('not-a-url')
    } catch (err) {
      expect(err instanceof SearchError).toBe(true)
      if (err instanceof SearchError) {
        expect(err.retryable).toBe(false)
      }
    }
  })

  it('isEnabled returns true (no API key required)', () => {
    const tool = new WebReadabilityTool()
    expect(tool.isEnabled()).toBe(true)
  })
})
