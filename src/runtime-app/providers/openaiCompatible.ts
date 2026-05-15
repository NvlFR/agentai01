import { redactSecrets } from '../config/index.js'

export type ProviderRequest = {
  systemPrompt?: string
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  temperature?: number
}

export type ProviderResponse = {
  model: string
  content: string
  raw: unknown
  latencyMs: number
  retries: number
}

export type ProviderTelemetry = {
  totalCalls: number
  failedCalls: number
  averageLatencyMs: number
  lastError?: string
}

export class OpenAICompatibleProvider {
  private totalCalls = 0
  private failedCalls = 0
  private totalLatencyMs = 0
  private lastError?: string

  constructor(
    private readonly config: {
      baseUrl: string
      apiKey: string
      model: string
      timeoutMs: number
      maxRetries: number
    },
    private readonly log: (event: Record<string, unknown>) => void = () => undefined,
  ) {}

  async complete(request: ProviderRequest): Promise<ProviderResponse> {
    let retries = 0
    let lastFailure: unknown

    while (retries <= this.config.maxRetries) {
      const startedAt = Date.now()
      try {
        const response = await fetchWithTimeout(
          `${this.config.baseUrl.replace(/\/$/, '')}/chat/completions`,
          {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              authorization: `Bearer ${this.config.apiKey}`,
            },
            body: JSON.stringify({
              model: this.config.model,
              temperature: request.temperature ?? 0.2,
              messages: request.systemPrompt
                ? [
                    { role: 'system', content: request.systemPrompt },
                    ...request.messages,
                  ]
                : request.messages,
            }),
          },
          this.config.timeoutMs,
        )

        if (!response.ok) {
          throw new Error(`Provider HTTP ${response.status}: ${await response.text()}`)
        }

        const raw = await response.json()
        const content = normalizeContent(raw)
        const latencyMs = Date.now() - startedAt
        this.totalCalls += 1
        this.totalLatencyMs += latencyMs
        this.log({
          type: 'provider_call',
          ok: true,
          latencyMs,
          retries,
          request: redactSecrets(request),
        })
        return {
          model: this.config.model,
          content,
          raw,
          latencyMs,
          retries,
        }
      } catch (error) {
        lastFailure = error
        retries += 1
        if (retries > this.config.maxRetries) {
          break
        }
        this.log({
          type: 'provider_retry',
          ok: false,
          retry: retries,
          error: String(error),
        })
      }
    }

    this.totalCalls += 1
    this.failedCalls += 1
    this.lastError = String(lastFailure)
    this.log({
      type: 'provider_call',
      ok: false,
      error: this.lastError,
    })
    throw new Error(`Provider request failed: ${this.lastError}`)
  }

  async smokeTest(): Promise<ProviderResponse> {
    return this.complete({
      systemPrompt: 'You are a terse healthcheck assistant.',
      messages: [{ role: 'user', content: 'Reply with: runtime provider ok' }],
      temperature: 0,
    })
  }

  getTelemetry(): ProviderTelemetry {
    return {
      totalCalls: this.totalCalls,
      failedCalls: this.failedCalls,
      averageLatencyMs: this.totalCalls === 0 ? 0 : this.totalLatencyMs / this.totalCalls,
      lastError: this.lastError,
    }
  }
}

function normalizeContent(raw: any): string {
  const content = raw?.choices?.[0]?.message?.content
  if (typeof content === 'string') {
    return content
  }
  if (Array.isArray(content)) {
    return content
      .map(item => (typeof item?.text === 'string' ? item.text : typeof item === 'string' ? item : ''))
      .join('\n')
      .trim()
  }
  return JSON.stringify(raw)
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}
