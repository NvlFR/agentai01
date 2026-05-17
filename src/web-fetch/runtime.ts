import { createAuditTrail } from '../security/index.js'
import { formatIso8601 } from '../shared/index.js'
import { retry } from '../utils/index.js'
import { extractReadableContent } from './content-extractors.js'
import type {
  FetchAuditEvent,
  FetchLike,
  ReadableContent,
  NormalizedFetchResponse,
  SafeFetchOptions,
  SafeFetchRequest,
  SafeFetchResult,
  UrlSafetyDecision,
  WebFetchOptions,
  WebFetchResult,
} from './types.js'

const DEFAULT_TIMEOUT_MS = 30_000
const DEFAULT_USER_AGENT = 'agentai01-web-fetch/0.1'

export function evaluateUrlSafety(url: string, resolvedAddresses: readonly string[] = []): UrlSafetyDecision {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return { safe: false, reason: 'invalid_url' }
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { safe: false, reason: 'unsupported_protocol' }
  }

  const hostname = parsed.hostname.toLowerCase()
  if (isBlockedHostname(hostname)) {
    return { safe: false, reason: 'blocked_host' }
  }

  const addresses = [hostname, ...resolvedAddresses]
  if (addresses.some(address => isPrivateAddress(address))) {
    return { safe: false, reason: 'blocked_ip' }
  }

  parsed.username = ''
  parsed.password = ''
  return { safe: true, url: parsed }
}

export function createSafeFetchClient(options: SafeFetchOptions = {}) {
  const fetchImpl = options.fetch ?? fetch
  const defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS
  const defaultRetryAttempts = options.defaultRetryAttempts ?? 2

  return {
    async fetch(request: SafeFetchRequest): Promise<SafeFetchResult> {
      const trail = createAuditTrail(event => {
        options.auditSink?.(event as unknown as FetchAuditEvent)
      })
      const actor = request.auditActor ?? 'runtime'
      const initialSafety = evaluateUrlSafety(request.url)
      const resolved = initialSafety.safe && options.resolveHost
        ? await options.resolveHost(initialSafety.url.hostname).catch(() => [])
        : []
      const safety = initialSafety.safe ? evaluateUrlSafety(initialSafety.url.toString(), resolved) : initialSafety

      if (!safety.safe) {
        trail.auditLog({
          event_type: 'web_fetch',
          actor,
          outcome: 'blocked',
          metadata: { url: request.url, reason: safety.reason },
        })
        return {
          ok: false,
          error: { code: 'unsafe_url', message: safety.reason },
          audit: trail.list() as unknown as FetchAuditEvent[],
        }
      }

      trail.auditLog({
        event_type: 'web_fetch',
        actor,
        outcome: 'allowed',
        metadata: { url: safety.url.toString(), method: request.method ?? 'GET' },
      })

      try {
        const response = await retry(
          async attempt => {
            if (attempt > 1) {
              trail.auditLog({
                event_type: 'web_fetch',
                actor,
                outcome: 'retry',
                metadata: { url: safety.url.toString(), attempt },
              })
            }

            const response = await fetchWithTimeout(fetchImpl, safety.url, request, defaultTimeoutMs)
            if (response.status >= 500) {
              throw new RetryableHttpError(response.status)
            }
            return response
          },
          {
            attempts: request.retryAttempts ?? defaultRetryAttempts,
            baseDelayMs: 25,
            maxDelayMs: 250,
            shouldRetry: error => error instanceof RetryableHttpError,
          },
        )

        const normalized = await normalizeResponse(response)
        trail.auditLog({
          event_type: 'web_fetch',
          actor,
          outcome: normalized.ok ? 'success' : 'failure',
          metadata: { url: normalized.url, status: normalized.status, bytes: normalized.bytes },
        })

        if (!normalized.ok) {
          return {
            ok: false,
            error: { code: 'http_error', message: `HTTP ${normalized.status}` },
            audit: trail.list() as unknown as FetchAuditEvent[],
          }
        }

        return { ok: true, value: normalized, audit: trail.list() as unknown as FetchAuditEvent[] }
      } catch (error) {
        const code = error instanceof TimeoutError ? 'timeout' : request.signal?.aborted ? 'aborted' : 'network_error'
        trail.auditLog({
          event_type: 'web_fetch',
          actor,
          outcome: 'failure',
          metadata: { url: safety.url.toString(), code, error: error instanceof Error ? error.message : 'unknown' },
        })
        return {
          ok: false,
          error: { code, message: error instanceof Error ? error.message : 'Fetch failed' },
          audit: trail.list() as unknown as FetchAuditEvent[],
        }
      }
    },
  }
}

export async function safeFetch(request: SafeFetchRequest, options: SafeFetchOptions = {}): Promise<SafeFetchResult> {
  return createSafeFetchClient(options).fetch(request)
}

export async function fetchWebContent(
  url: string,
  options: WebFetchOptions = {},
  runtimeOptions: SafeFetchOptions = {},
): Promise<WebFetchResult> {
  const response = await safeFetch(
    {
      url,
      method: 'GET',
      timeoutMs: options.timeoutMs,
      retryAttempts: 1,
      headers: {
        Accept: 'text/html,application/xhtml+xml,text/plain,application/json;q=0.9,*/*;q=0.8',
        'User-Agent': options.userAgent ?? DEFAULT_USER_AGENT,
      },
      auditActor: 'web_fetch',
    },
    runtimeOptions,
  )

  const fetchedAt = formatIso8601(new Date())
  if (!response.ok) {
    return {
      url,
      content: '',
      fetchedAt,
      error: response.error.message,
    }
  }

  const contentType = response.value.contentType?.toLowerCase() ?? ''
  const result = isHtmlContentType(contentType)
    ? extractReadableContent(response.value.body, response.value.url, options.maxContentLength)
    : extractPlainContent(response.value.body, options.maxContentLength)

  return {
    url,
    title: result.title,
    content: result.content,
    excerpt: result.excerpt,
    fetchedAt,
  }
}

function isHtmlContentType(contentType: string): boolean {
  return contentType.includes('text/html') || contentType.includes('application/xhtml+xml')
}

function extractPlainContent(body: string, maxContentLength?: number): ReadableContent {
  const content = limitContent(body, maxContentLength)
  return {
    content,
    excerpt: content.length <= 220 ? content : `${content.slice(0, 217).trimEnd()}...`,
  }
}

async function fetchWithTimeout(
  fetchImpl: FetchLike,
  url: URL,
  request: SafeFetchRequest,
  defaultTimeoutMs: number,
): Promise<Response> {
  const timeoutMs = request.timeoutMs ?? defaultTimeoutMs
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(new TimeoutError(`Fetch timed out after ${timeoutMs}ms`)), timeoutMs)
  const abort = () => controller.abort(request.signal?.reason)
  request.signal?.addEventListener('abort', abort, { once: true })

  try {
    return await fetchImpl(url, {
      method: request.method ?? 'GET',
      headers: request.headers,
      body: request.body,
      signal: controller.signal,
    })
  } catch (error) {
    if (controller.signal.reason instanceof TimeoutError) {
      throw controller.signal.reason
    }
    throw error
  } finally {
    clearTimeout(timeout)
    request.signal?.removeEventListener('abort', abort)
  }
}

async function normalizeResponse(response: Response): Promise<NormalizedFetchResponse> {
  const body = await response.text()
  const headers = Object.fromEntries(response.headers.entries())
  return {
    url: response.url,
    status: response.status,
    ok: response.ok,
    headers,
    contentType: response.headers.get('content-type') ?? undefined,
    body,
    bytes: new TextEncoder().encode(body).byteLength,
  }
}

function limitContent(content: string, maxContentLength?: number): string {
  if (!maxContentLength || maxContentLength < 1 || content.length <= maxContentLength) {
    return content
  }

  return `${content.slice(0, Math.max(0, maxContentLength - 3)).trimEnd()}...`
}

function isBlockedHostname(hostname: string): boolean {
  return hostname === 'localhost' || hostname.endsWith('.localhost')
}

function isPrivateAddress(address: string): boolean {
  const normalized = address.trim().toLowerCase().replace(/^\[|\]$/g, '')
  if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') {
    return true
  }
  if (normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80:')) {
    return true
  }
  const parts = normalized.split('.').map(part => Number(part))
  if (parts.length !== 4 || parts.some(part => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false
  }
  const [a, b] = parts
  return a === 10 || a === 127 || a === 0 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254)
}

class TimeoutError extends Error {}

class RetryableHttpError extends Error {
  constructor(readonly status: number) {
    super(`Retryable HTTP ${status}`)
  }
}
