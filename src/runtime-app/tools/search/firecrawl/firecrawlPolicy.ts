import type { FetchLike } from '../../../providers/openaiCompatibleProvider.js'
import { SearchError } from '../searchTool.js'

const DEFAULT_MAX_DEPTH = 2
const DEFAULT_RATE_LIMIT_MS = 1_000

type FirecrawlPolicyOptions = {
  fetchFn?: FetchLike
  maxDepth?: number
  rateLimitMs?: number
  now?: () => number
}

export class FirecrawlPolicy {
  private readonly fetchFn: FetchLike
  private readonly maxDepth: number
  private readonly rateLimitMs: number
  private readonly now: () => number
  private nextAllowedAt = 0

  constructor(options: FirecrawlPolicyOptions = {}) {
    this.fetchFn = options.fetchFn ?? fetch
    this.maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH
    this.rateLimitMs = options.rateLimitMs ?? DEFAULT_RATE_LIMIT_MS
    this.now = options.now ?? Date.now
  }

  resolveDepth(requestedDepth: number | undefined): number {
    const depth = requestedDepth ?? 0
    if (depth < 0) {
      throw new SearchError({
        toolId: 'firecrawl',
        message: 'Firecrawl: depth must be >= 0.',
        retryable: false,
      })
    }

    return Math.min(depth, this.maxDepth)
  }

  async enforceSitePolicy(url: string, domains: string[]): Promise<string[]> {
    const warnings: string[] = []
    const parsed = new URL(url)

    if (domains.length > 0 && !domains.includes(parsed.hostname)) {
      throw new SearchError({
        toolId: 'firecrawl',
        message: `Firecrawl: URL host ${parsed.hostname} is outside allowed domains.`,
        retryable: false,
      })
    }

    if (this.now() < this.nextAllowedAt) {
      throw new SearchError({
        toolId: 'firecrawl',
        message: 'Firecrawl: local rate limit still cooling down.',
        retryable: true,
      })
    }
    this.nextAllowedAt = this.now() + this.rateLimitMs

    const robotsUrl = new URL('/robots.txt', parsed)
    try {
      const response = await this.fetchFn(robotsUrl.toString(), {
        headers: { 'user-agent': 'agentai01-runtime-firecrawl/0.1' },
      })
      if (!response.ok) {
        warnings.push(`robots.txt unavailable (HTTP ${response.status}); proceeding with restrictive defaults.`)
        return warnings
      }

      const robots = await response.text()
      if (isPathDisallowed(robots, parsed.pathname)) {
        throw new SearchError({
          toolId: 'firecrawl',
          message: `Firecrawl: robots.txt disallows crawling ${parsed.pathname || '/'} on ${parsed.hostname}.`,
          retryable: false,
        })
      }
    } catch (err) {
      if (err instanceof SearchError) {
        throw err
      }
      warnings.push(`robots.txt check failed: ${err instanceof Error ? err.message : 'unknown error'}`)
    }

    return warnings
  }
}

function isPathDisallowed(robotsTxt: string, pathname: string): boolean {
  const lines = robotsTxt.split(/\r?\n/)
  let appliesToGenericAgent = false
  const disallows: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const [rawKey, ...rawValue] = trimmed.split(':')
    const key = rawKey?.trim().toLowerCase()
    const value = rawValue.join(':').trim()

    if (key === 'user-agent') {
      appliesToGenericAgent = value === '*'
      continue
    }

    if (key === 'disallow' && appliesToGenericAgent && value) {
      disallows.push(value)
    }
  }

  return disallows.some(rule => pathname.startsWith(rule))
}

export function createFirecrawlPolicy(fetchFn?: FetchLike): FirecrawlPolicy {
  const envMaxDepth = Number.parseInt(process.env['FIRECRAWL_MAX_DEPTH'] ?? '', 10)
  const envRateLimit = Number.parseInt(process.env['FIRECRAWL_RATE_LIMIT_MS'] ?? '', 10)

  return new FirecrawlPolicy({
    fetchFn,
    maxDepth: Number.isFinite(envMaxDepth) ? envMaxDepth : undefined,
    rateLimitMs: Number.isFinite(envRateLimit) ? envRateLimit : undefined,
  })
}
