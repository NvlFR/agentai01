// src/runtime-app/providers/groq/groqProvider.ts
// Groq LLM provider adapter — implements same interface as openaiCompatibleProvider.
// Config: GROQ_API_KEY, GROQ_MODEL (defaults to llama3-8b-8192), GROQ_TIMEOUT_MS

import {
  type ProviderTextGenerationRequest,
  type ProviderResponse,
  type ProviderLogEntry,
  type FetchLike,
  ProviderRequestError,
} from '../openaiCompatibleProvider.js'

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1'
const GROQ_DEFAULT_MODEL = 'llama3-8b-8192'
const GROQ_DEFAULT_TIMEOUT_MS = 30_000

export type GroqProviderOptions = {
  apiKey: string
  model: string
  timeoutMs: number
  retryLimit: number
  logger?: (entry: ProviderLogEntry) => void
  fetchFn?: FetchLike
  sleep?: (ms: number) => Promise<void>
}

export function isGroqEnabled(): boolean {
  return Boolean(process.env['GROQ_API_KEY'])
}

export function createGroqProviderOptionsFromEnv(): GroqProviderOptions {
  const apiKey = process.env['GROQ_API_KEY'] ?? ''
  const model = process.env['GROQ_MODEL'] ?? GROQ_DEFAULT_MODEL
  const timeoutMs = Number(process.env['GROQ_TIMEOUT_MS'] ?? GROQ_DEFAULT_TIMEOUT_MS)
  return { apiKey, model, timeoutMs, retryLimit: 2 }
}

export class GroqProvider {
  private readonly endpoint: string
  private readonly fetchFn: FetchLike
  private readonly logger?: (entry: ProviderLogEntry) => void
  private readonly sleep: (ms: number) => Promise<void>

  constructor(private readonly options: GroqProviderOptions) {
    this.endpoint = `${GROQ_BASE_URL}/chat/completions`
    this.fetchFn = options.fetchFn ?? fetch
    this.logger = options.logger
    this.sleep = options.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms)))
  }

  get id(): string {
    return 'groq'
  }

  async generateText(request: ProviderTextGenerationRequest): Promise<ProviderResponse> {
    let lastError: ProviderRequestError | undefined

    for (let attempt = 1; attempt <= this.options.retryLimit + 1; attempt++) {
      const startedAt = Date.now()
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs)

      this.logger?.({
        event: 'provider_attempt',
        model: this.options.model,
        url: this.endpoint,
        attempt,
        latencyMs: 0,
      })

      try {
        const response = await this.fetchFn(this.endpoint, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${this.options.apiKey}`,
          },
          body: JSON.stringify({
            model: this.options.model,
            messages: request.messages,
            temperature: request.temperature,
            max_tokens: request.maxTokens,
          }),
        })

        clearTimeout(timeout)
        const latencyMs = Date.now() - startedAt

        if (!response.ok) {
          const responseBody = await response.text()
          // Parse Groq-specific error codes without leaking raw body to logs.
          const isRateLimit = response.status === 429
          const isServerError = response.status >= 500
          const isAuthError = response.status === 401 || response.status === 403
          throw new ProviderRequestError({
            message: isAuthError
              ? `Groq: invalid or missing API key (HTTP ${response.status}).`
              : isRateLimit
                ? `Groq: rate limit exceeded. Retry after cooldown.`
                : `Groq: provider responded with HTTP ${response.status}.`,
            status: response.status,
            attempt,
            retryable: isRateLimit || isServerError,
            responseBody: isAuthError ? null : responseBody,
          })
        }

        const raw = await response.json()
        const content = extractContent(raw)

        this.logger?.({
          event: 'provider_success',
          model: this.options.model,
          url: this.endpoint,
          attempt,
          latencyMs,
          status: response.status,
        })

        return { model: this.options.model, content, raw, latencyMs, attempts: attempt }
      } catch (error) {
        clearTimeout(timeout)
        const latencyMs = Date.now() - startedAt
        const normalized = normalizeError(error, attempt, this.options.timeoutMs)

        this.logger?.({
          event: normalized.retryable && attempt <= this.options.retryLimit
            ? 'provider_retry'
            : 'provider_failure',
          model: this.options.model,
          url: this.endpoint,
          attempt,
          latencyMs,
          status: normalized.status ?? undefined,
          retryable: normalized.retryable,
          error: normalized.message,
        })

        lastError = normalized
        if (!normalized.retryable || attempt > this.options.retryLimit) throw normalized
        await this.sleep(Math.min(1_000, 100 * 2 ** (attempt - 1)))
      }
    }

    throw lastError ?? new ProviderRequestError({
      message: 'Groq: request failed without explicit error.',
      status: null,
      attempt: 1,
      retryable: false,
    })
  }
}

export function createGroqProvider(options: GroqProviderOptions): GroqProvider {
  return new GroqProvider(options)
}

function extractContent(payload: unknown): string {
  const content = (payload as {
    choices?: Array<{ message?: { content?: string } }>
  }).choices?.[0]?.message?.content
  return typeof content === 'string' ? content : ''
}

function normalizeError(error: unknown, attempt: number, timeoutMs: number): ProviderRequestError {
  if (error instanceof ProviderRequestError) {
    return new ProviderRequestError({
      message: error.message,
      status: error.status,
      attempt,
      retryable: error.retryable,
      responseBody: error.responseBody,
      cause: error.cause,
    })
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return new ProviderRequestError({
      message: `Groq: request timed out after ${timeoutMs}ms.`,
      status: null,
      attempt,
      retryable: true,
      cause: error,
    })
  }

  return new ProviderRequestError({
    message: `Groq: request failed before response — ${error instanceof Error ? error.message : 'unknown error'}.`,
    status: null,
    attempt,
    retryable: true,
    cause: error,
  })
}
