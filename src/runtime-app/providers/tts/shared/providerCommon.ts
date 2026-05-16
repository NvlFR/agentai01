export type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>

export type ProviderBinaryArtifact = {
  mimeType: string
  data: Uint8Array
  bytes: number
}

export type RetryableMediaErrorCode =
  | 'auth_error'
  | 'rate_limited'
  | 'quota_exceeded'
  | 'timeout'
  | 'provider_unavailable'
  | 'invalid_request'
  | 'generation_failed'
  | 'response_invalid'

export class MediaProviderError extends Error {
  readonly provider: string
  readonly code: RetryableMediaErrorCode
  readonly status: number | null
  readonly attempt: number
  readonly retryable: boolean

  constructor(args: {
    provider: string
    code: RetryableMediaErrorCode
    message: string
    status: number | null
    attempt: number
    retryable: boolean
    cause?: unknown
  }) {
    super(args.message, args.cause ? { cause: args.cause } : undefined)
    this.name = 'MediaProviderError'
    this.provider = args.provider
    this.code = args.code
    this.status = args.status
    this.attempt = args.attempt
    this.retryable = args.retryable
  }
}

export type RetryContext = {
  attempt: number
}

export type RetryOptions = {
  provider: string
  retryLimit: number
  sleep?: (ms: number) => Promise<void>
  getDelayMs?: (attempt: number) => number
}

export async function withRetry<T>(
  operation: (context: RetryContext) => Promise<T>,
  options: RetryOptions,
): Promise<{ value: T; attempts: number }> {
  const sleep = options.sleep ?? defaultSleep
  const getDelayMs = options.getDelayMs ?? defaultRetryDelayMs
  let lastError: MediaProviderError | undefined

  for (let attempt = 1; attempt <= options.retryLimit + 1; attempt += 1) {
    try {
      const value = await operation({ attempt })
      return { value, attempts: attempt }
    } catch (error) {
      const normalized = normalizeUnknownError(error, options.provider, attempt)
      lastError = normalized
      if (!normalized.retryable || attempt > options.retryLimit) {
        throw normalized
      }

      await sleep(getDelayMs(attempt))
    }
  }

  throw lastError ?? new MediaProviderError({
    provider: options.provider,
    code: 'provider_unavailable',
    message: `${options.provider}: request failed without an explicit error.`,
    status: null,
    attempt: 1,
    retryable: false,
  })
}

export async function fetchWithTimeout(
  fetchFn: FetchLike,
  input: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetchFn(input, {
      ...init,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

export async function responseToBinaryArtifact(
  response: Response,
  fallbackMimeType: string,
): Promise<ProviderBinaryArtifact> {
  const data = new Uint8Array(await response.arrayBuffer())
  return {
    mimeType: response.headers.get('content-type') ?? fallbackMimeType,
    bytes: data.byteLength,
    data,
  }
}

export async function downloadBinaryArtifact(
  fetchFn: FetchLike,
  url: string,
  timeoutMs: number,
  headers?: HeadersInit,
): Promise<ProviderBinaryArtifact> {
  const response = await fetchWithTimeout(
    fetchFn,
    url,
    { method: 'GET', headers },
    timeoutMs,
  )

  if (!response.ok) {
    throw new MediaProviderError({
      provider: 'asset-download',
      code: response.status === 429 ? 'rate_limited' : 'provider_unavailable',
      message: `Asset download failed with HTTP ${response.status}.`,
      status: response.status,
      attempt: 1,
      retryable: response.status === 429 || response.status >= 500,
    })
  }

  return responseToBinaryArtifact(response, 'application/octet-stream')
}

export function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Missing required environment variable ${name}.`)
  }

  return value
}

export function readOptionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim()
  return value ? value : undefined
}

export function readNumberEnv(name: string, fallback: number): number {
  const value = process.env[name]?.trim()
  if (!value) {
    return fallback
  }

  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function buildSsmlDocument(text: string, voice: string, locale: string): string {
  return [
    `<speak version="1.0" xml:lang="${escapeXml(locale)}">`,
    `<voice xml:lang="${escapeXml(locale)}" name="${escapeXml(voice)}">`,
    escapeXml(text),
    '</voice>',
    '</speak>',
  ].join('')
}

export function normalizeUnknownError(
  error: unknown,
  provider: string,
  attempt: number,
  timeoutMs?: number,
): MediaProviderError {
  if (error instanceof MediaProviderError) {
    return new MediaProviderError({
      provider: error.provider,
      code: error.code,
      message: error.message,
      status: error.status,
      attempt,
      retryable: error.retryable,
      cause: error.cause,
    })
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return new MediaProviderError({
      provider,
      code: 'timeout',
      message: `${provider}: request timed out after ${timeoutMs ?? 0}ms.`,
      status: null,
      attempt,
      retryable: true,
      cause: error,
    })
  }

  return new MediaProviderError({
    provider,
    code: 'provider_unavailable',
    message: `${provider}: request failed before a valid response was received.`,
    status: null,
    attempt,
    retryable: true,
    cause: error,
  })
}

export function createHttpError(args: {
  provider: string
  status: number
  attempt: number
  authMessage: string
  rateLimitMessage: string
  failureMessage?: string
}): MediaProviderError {
  if (args.status === 401 || args.status === 403) {
    return new MediaProviderError({
      provider: args.provider,
      code: 'auth_error',
      message: args.authMessage,
      status: args.status,
      attempt: args.attempt,
      retryable: false,
    })
  }

  if (args.status === 429) {
    return new MediaProviderError({
      provider: args.provider,
      code: 'rate_limited',
      message: args.rateLimitMessage,
      status: args.status,
      attempt: args.attempt,
      retryable: true,
    })
  }

  if (args.status >= 500) {
    return new MediaProviderError({
      provider: args.provider,
      code: 'provider_unavailable',
      message: args.failureMessage ?? `${args.provider}: provider is temporarily unavailable.`,
      status: args.status,
      attempt: args.attempt,
      retryable: true,
    })
  }

  return new MediaProviderError({
    provider: args.provider,
    code: 'generation_failed',
    message: args.failureMessage ?? `${args.provider}: request failed with HTTP ${args.status}.`,
    status: args.status,
    attempt: args.attempt,
    retryable: false,
  })
}

function defaultRetryDelayMs(attempt: number): number {
  return Math.min(1_000, 150 * 2 ** (attempt - 1))
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}
