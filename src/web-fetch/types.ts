export type WebFetchResult = {
  url: string
  title?: string
  content: string
  excerpt?: string
  fetchedAt: string
  error?: string
}

export type WebFetchOptions = {
  timeoutMs?: number
  maxContentLength?: number
  userAgent?: string
}

export type FetchAuditOutcome = 'allowed' | 'blocked' | 'success' | 'failure' | 'retry'

export type FetchAuditEvent = {
  event_type: 'web_fetch'
  actor: string
  outcome: FetchAuditOutcome
  timestamp: string
  metadata?: Record<string, unknown>
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

export type ReadableContent = {
  title?: string
  content: string
  excerpt?: string
}
