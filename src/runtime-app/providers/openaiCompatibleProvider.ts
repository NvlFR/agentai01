export type ProviderMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>

export type OpenAICompatibleProviderOptions = {
  baseURL: string
  apiKey: string
  model: string
  timeoutMs: number
  retryLimit: number
  logger?: (entry: ProviderLogEntry) => void
  fetchFn?: FetchLike
  sleep?: (ms: number) => Promise<void>
}

export type ProviderLogEntry = {
  event: 'provider_attempt' | 'provider_success' | 'provider_retry' | 'provider_failure'
  model: string
  url: string
  attempt: number
  latencyMs: number
  status?: number
  retryable?: boolean
  error?: string
}

export type ProviderTextGenerationRequest = {
  messages: ProviderMessage[]
  temperature?: number
  maxTokens?: number
  metadata?: Record<string, string>
}

export type ProviderResponse = {
  model: string
  content: string
  raw: unknown
  latencyMs: number
  attempts: number
}

export class ProviderRequestError extends Error {
  readonly status: number | null
  readonly attempt: number
  readonly retryable: boolean
  readonly responseBody: string | null

  constructor(args: {
    message: string
    status: number | null
    attempt: number
    retryable: boolean
    responseBody?: string | null
    cause?: unknown
  }) {
    super(args.message, args.cause ? { cause: args.cause } : undefined)
    this.name = 'ProviderRequestError'
    this.status = args.status
    this.attempt = args.attempt
    this.retryable = args.retryable
    this.responseBody = args.responseBody ?? null
  }
}

export class OpenAICompatibleProvider {
  private readonly endpoint: string
  private readonly fetchFn: FetchLike
  private readonly logger?: (entry: ProviderLogEntry) => void
  private readonly sleep: (ms: number) => Promise<void>

  constructor(private readonly options: OpenAICompatibleProviderOptions) {
    this.endpoint = `${options.baseURL.replace(/\/$/, '')}/chat/completions`
    this.fetchFn = options.fetchFn ?? fetch
    this.logger = options.logger
    this.sleep = options.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms)))
  }

  async generateText(
    request: ProviderTextGenerationRequest,
  ): Promise<ProviderResponse> {
    let lastError: ProviderRequestError | undefined

    for (let attempt = 1; attempt <= this.options.retryLimit + 1; attempt += 1) {
      const startedAt = Date.now()
      try {
        const response = await this.executeRequest(request)
        const raw = await response.json()
        const latencyMs = Date.now() - startedAt
        const content = extractMessageContent(raw)

        this.logger?.({
          event: 'provider_success',
          model: this.options.model,
          url: this.endpoint,
          attempt,
          latencyMs,
          status: response.status,
        })

        return {
          model: this.options.model,
          content,
          raw,
          latencyMs,
          attempts: attempt,
        }
      } catch (error) {
        const latencyMs = Date.now() - startedAt
        const normalized = normalizeProviderError(error, attempt)
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
        if (!normalized.retryable || attempt > this.options.retryLimit) {
          throw normalized
        }

        await this.sleep(getRetryDelayMs(attempt))
      }
    }

    throw lastError ?? new ProviderRequestError({
      message: 'Provider request failed without an explicit error.',
      status: null,
      attempt: 1,
      retryable: false,
    })
  }

  private async executeRequest(
    request: ProviderTextGenerationRequest,
  ): Promise<Response> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs)

    this.logger?.({
      event: 'provider_attempt',
      model: this.options.model,
      url: this.endpoint,
      attempt: 0,
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
          metadata: request.metadata,
        }),
      })

      if (!response.ok) {
        const responseBody = await response.text()
        throw new ProviderRequestError({
          message: `Provider responded with HTTP ${response.status}.`,
          status: response.status,
          attempt: 1,
          retryable: response.status === 429 || response.status >= 500,
          responseBody,
        })
      }

      return response
    } catch (error) {
      if (error instanceof ProviderRequestError) {
        throw error
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ProviderRequestError({
          message: `Provider request timed out after ${this.options.timeoutMs}ms.`,
          status: null,
          attempt: 1,
          retryable: true,
          cause: error,
        })
      }

      throw new ProviderRequestError({
        message: 'Provider request failed before a response was received.',
        status: null,
        attempt: 1,
        retryable: true,
        cause: error,
      })
    } finally {
      clearTimeout(timeout)
    }
  }
}

export function createOpenAICompatibleProvider(
  options: OpenAICompatibleProviderOptions,
): OpenAICompatibleProvider {
  return new OpenAICompatibleProvider(options)
}

function extractMessageContent(payload: unknown): string {
  const content = (payload as {
    choices?: Array<{ message?: { content?: string | Array<{ text?: string }> } }>
  }).choices?.[0]?.message?.content

  if (typeof content === 'string') {
    return content
  }

  if (Array.isArray(content)) {
    return content
      .map(item => item?.text ?? '')
      .filter(Boolean)
      .join('')
  }

  return ''
}

function normalizeProviderError(
  error: unknown,
  attempt: number,
): ProviderRequestError {
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

  return new ProviderRequestError({
    message: error instanceof Error ? error.message : 'Unknown provider error.',
    status: null,
    attempt,
    retryable: true,
    cause: error,
  })
}

function getRetryDelayMs(attempt: number): number {
  return Math.min(1_000, 100 * 2 ** (attempt - 1))
}
