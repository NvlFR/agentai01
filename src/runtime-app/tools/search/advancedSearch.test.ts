import { describe, expect, it } from 'bun:test'

import { FirecrawlPolicy } from './firecrawl/firecrawlPolicy.js'
import { FirecrawlSearchTool } from './firecrawl/firecrawlTool.js'
import { PerplexitySearchTool } from './perplexity/perplexityTool.js'
import { SearxngSearchTool } from './searxng/searxngTool.js'

describe('PerplexitySearchTool', () => {
  it('supports raw search results and synthesized answers', async () => {
    const calls: string[] = []
    const tool = new PerplexitySearchTool('test-key', {
      fetchFn: async (url, init) => {
        calls.push(String(url))
        if (String(url).endsWith('/search')) {
          expect(init?.body).toContain('"query":"latest ai"')
          return Response.json({
            results: [
              { title: 'Result A', url: 'https://example.com/a', snippet: 'raw snippet' },
            ],
          })
        }

        return Response.json({
          choices: [{ message: { content: 'Synthesized answer' } }],
          search_results: [
            { title: 'Result B', url: 'https://example.com/b', snippet: 'answer snippet' },
          ],
        })
      },
    })

    const raw = await tool.run('latest ai', { mode: 'results' })
    const answer = await tool.run('latest ai', { mode: 'hybrid' })

    expect(calls).toEqual([
      'https://api.perplexity.ai/search',
      'https://api.perplexity.ai/v1/sonar',
    ])
    expect(raw.results).toEqual([
      {
        title: 'Result A',
        url: 'https://example.com/a',
        snippet: 'raw snippet',
        source: 'perplexity',
      },
    ])
    expect(answer.answer).toBe('Synthesized answer')
    expect(answer.results[0]?.source).toBe('perplexity')
  })
})

describe('FirecrawlPolicy', () => {
  it('blocks robots-disallowed paths and enforces domain restrictions', async () => {
    const policy = new FirecrawlPolicy({
      now: () => 10,
      rateLimitMs: 1,
      fetchFn: async () => new Response('User-agent: *\nDisallow: /private\n'),
    })

    await expect(
      policy.enforceSitePolicy('https://example.com/private/report', ['example.com']),
    ).rejects.toMatchObject({
      toolId: 'firecrawl',
      message: 'Firecrawl: robots.txt disallows crawling /private/report on example.com.',
    })
  })

  it('caps max depth at configured maximum', () => {
    const policy = new FirecrawlPolicy({ maxDepth: 3 })
    expect(policy.resolveDepth(8)).toBe(3)
  })
})

describe('FirecrawlSearchTool', () => {
  it('returns normalized crawl results with audit warnings', async () => {
    let callCount = 0
    const tool = new FirecrawlSearchTool('fc-key', {
      sleep: async () => undefined,
      policy: new FirecrawlPolicy({
        now: () => 100,
        rateLimitMs: 0,
        fetchFn: async () => new Response('User-agent: *\nDisallow:\n'),
      }),
      fetchFn: async (url, init) => {
        callCount += 1
        if (String(url).endsWith('/v2/crawl')) {
          expect(init?.method).toBe('POST')
          return Response.json({ id: 'crawl-123' })
        }
        return Response.json({
          status: 'completed',
          data: [
            {
              markdown: '# Example',
              metadata: {
                title: 'Example',
                description: 'Snippet',
                sourceURL: 'https://example.com/page',
              },
            },
          ],
        })
      },
    })

    const result = await tool.crawl('https://example.com', { depth: 9, domains: ['example.com'] })

    expect(callCount).toBe(2)
    expect(result.results).toEqual([
      {
        title: 'Example',
        url: 'https://example.com/page',
        snippet: 'Snippet',
        source: 'firecrawl',
      },
    ])
    expect(result.audit.resultCount).toBe(1)
  })
})

describe('SearxngSearchTool', () => {
  it('parses JSON search results from a configured instance', async () => {
    const tool = new SearxngSearchTool('https://searx.example', async url => {
      expect(String(url)).toContain('format=json')
      return Response.json({
        results: [
          {
            title: 'SearXNG result',
            url: 'https://example.org/result',
            content: 'Meta search result',
          },
        ],
      })
    })

    const results = await tool.search('agent runtime')

    expect(results).toEqual([
      {
        title: 'SearXNG result',
        url: 'https://example.org/result',
        snippet: 'Meta search result',
        source: 'searxng',
      },
    ])
  })
})
