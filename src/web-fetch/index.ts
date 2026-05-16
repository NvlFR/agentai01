import { createAuditTrail, type RecordedAuditEvent } from '../security/index.js'
import { retry } from '../utils/index.js'

export type FetchAuditOutcome = 'allowed' | 'blocked' | 'success' | 'failure' | 'retry'

export type FetchAuditEvent = RecordedAuditEvent & {
  event_type: 'web_fetch'
  outcome: FetchAuditOutcome
}

export type UrlSafetyDecision =
  | { safe: true; url: URL }
  | { safe: false; reason: 'invalid_url' | 'unsupported_protocol' | 'blocked_host' | 'blocked_ip' }

export type SafeFetchRequest = {
  url: string
  method?: 'GET' | 'HEAD'
  headers?: Record<string, string>
  body?: BodyInit
  timeoutMs?: number
  retryAttempts?: number
  signal?: AbortSignal
  auditActor?: string
}

export type NormalizedFetchResponse = {
  url: string
  status: number
  ok: boolean
  headers: Record<string, string>
  contentType?: string
  body: string
  bytes: number
}

export type SafeFetchErrorCode =
  | 'unsafe_url'
  | 'timeout'
  | 'network_error'
  | 'http_error'
  | 'aborted'

export type SafeFetchResult =
  | { ok: true; value: NormalizedFetchResponse; audit: FetchAuditEvent[] }
  | { ok: false; error: { code: SafeFetchErrorCode; message: string }; audit: FetchAuditEvent[] }

export type HostResolver = (hostname: string) => Promise<readonly string[]>
export type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>

export type SafeFetchOptions = {
  fetch?: FetchLike
  resolveHost?: HostResolver
  defaultTimeoutMs?: number
  defaultRetryAttempts?: number
  auditSink?: (event: FetchAuditEvent) => void
}

const DEFAULT_TIMEOUT_MS = 30_000

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
        options.auditSink?.(event as FetchAuditEvent)
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
          audit: trail.list() as FetchAuditEvent[],
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
            audit: trail.list() as FetchAuditEvent[],
          }
        }

        return { ok: true, value: normalized, audit: trail.list() as FetchAuditEvent[] }
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
          audit: trail.list() as FetchAuditEvent[],
        }
      }
    },
  }
}

export async function safeFetch(request: SafeFetchRequest, options: SafeFetchOptions = {}): Promise<SafeFetchResult> {
  return createSafeFetchClient(options).fetch(request)
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
