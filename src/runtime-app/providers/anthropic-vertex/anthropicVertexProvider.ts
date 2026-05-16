// src/runtime-app/providers/anthropic-vertex/anthropicVertexProvider.ts
// Anthropic Vertex AI provider adapter — wraps Anthropic on Google Cloud Vertex AI.
// Uses Anthropic Messages API format (not OpenAI-compatible).
// Config: ANTHROPIC_VERTEX_PROJECT_ID, ANTHROPIC_VERTEX_REGION, ANTHROPIC_VERTEX_MODEL,
//         GOOGLE_APPLICATION_CREDENTIALS (or default ADC), ANTHROPIC_VERTEX_TIMEOUT_MS

import {
  type ProviderTextGenerationRequest,
  type ProviderResponse,
  type ProviderLogEntry,
  type FetchLike,
  ProviderRequestError,
} from '../openaiCompatibleProvider.js'

const VERTEX_DEFAULT_REGION = 'us-central1'
const VERTEX_DEFAULT_MODEL = 'claude-3-5-sonnet-v2@20241022'
const VERTEX_DEFAULT_TIMEOUT_MS = 30_000

// Vertex AI Anthropic endpoint pattern:
// https://<region>-aiplatform.googleapis.com/v1/projects/<project>/locations/<region>/publishers/anthropic/models/<model>:rawPredict
function buildEndpoint(project: string, region: string, model: string): string {
  return `https://${region}-aiplatform.googleapis.com/v1/projects/${project}/locations/${region}/publishers/anthropic/models/${model}:rawPredict`
}

export type AnthropicVertexProviderOptions = {
  projectId: string
  region: string
  model: string
  timeoutMs: number
  retryLimit: number
  /** Access token provider — injected for testability. Defaults to ADC via metadata server. */
  getAccessToken: () => Promise<string>
  logger?: (entry: ProviderLogEntry) => void
  fetchFn?: FetchLike
  sleep?: (ms: number) => Promise<void>
}

export function isAnthropicVertexEnabled(): boolean {
  return Boolean(
    process.env['ANTHROPIC_VERTEX_PROJECT_ID'] && process.env['ANTHROPIC_VERTEX_REGION'],
  )
}

/**
 * Fetch GCP access token from metadata server (Application Default Credentials).
 * In production, runs on GCE/Cloud Run/GKE — metadata server is available.
 * For local dev, requires `gcloud auth application-default login`.
 */
async function getGcpAccessTokenFromADC(): Promise<string> {
  const metadataUrl =
    'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token'
  const response = await fetch(metadataUrl, {
    headers: { 'Metadata-Flavor': 'Google' },
  })
  if (!response.ok) {
    throw new ProviderRequestError({
      message: `Anthropic Vertex: failed to obtain GCP access token (HTTP ${response.status}). ` +
        `Ensure Application Default Credentials are configured.`,
      status: response.status,
      attempt: 1,
      retryable: false,
    })
  }
  const body = await response.json() as { access_token?: string }
  if (!body.access_token) {
    throw new ProviderRequestError({
      message: 'Anthropic Vertex: GCP token response missing access_token.',
      status: null,
      attempt: 1,
      retryable: false,
    })
  }
  return body.access_token
}

export function createAnthropicVertexProviderOptionsFromEnv(): AnthropicVertexProviderOptions {
  const projectId = process.env['ANTHROPIC_VERTEX_PROJECT_ID'] ?? ''
  const region = process.env['ANTHROPIC_VERTEX_REGION'] ?? VERTEX_DEFAULT_REGION
  const model = process.env['ANTHROPIC_VERTEX_MODEL'] ?? VERTEX_DEFAULT_MODEL
  const timeoutMs = Number(process.env['ANTHROPIC_VERTEX_TIMEOUT_MS'] ?? VERTEX_DEFAULT_TIMEOUT_MS)
  return {
    projectId,
    region,
    model,
    timeoutMs,
    retryLimit: 2,
    getAccessToken: getGcpAccessTokenFromADC,
  }
}

export class AnthropicVertexProvider {
  private readonly fetchFn: FetchLike
  private readonly logger?: (entry: ProviderLogEntry) => void
  private readonly sleep: (ms: number) => Promise<void>

  constructor(private readonly options: AnthropicVertexProviderOptions) {
    this.fetchFn = options.fetchFn ?? fetch
    this.logger = options.logger
    this.sleep = options.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms)))
  }

  get id(): string {
    return 'anthropic-vertex'
  }

  async generateText(request: ProviderTextGenerationRequest): Promise<ProviderResponse> {
    let lastError: ProviderRequestError | undefined
    const endpoint = buildEndpoint(
      this.options.projectId,
      this.options.region,
      this.options.model,
    )

    for (let attempt = 1; attempt <= this.options.retryLimit + 1; attempt++) {
      const startedAt = Date.now()
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs)

      this.logger?.({
        event: 'provider_attempt',
        model: this.options.model,
        url: endpoint,
        attempt,
        latencyMs: 0,
      })

      try {
        const accessToken = await this.options.getAccessToken()

        // Separate system messages from conversation messages (Anthropic API format).
        const systemMessages = request.messages
          .filter(m => m.role === 'system')
          .map(m => m.content)
          .join('\n')
          .trim()

        const conversationMessages = request.messages
          .filter(m => m.role !== 'system')
          .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

        const body: Record<string, unknown> = {
          anthropic_version: 'vertex-2023-10-16',
          model: this.options.model,
          messages: conversationMessages,
          max_tokens: request.maxTokens ?? 1024,
        }
        if (systemMessages) body['system'] = systemMessages
        if (request.temperature !== undefined) body['temperature'] = request.temperature

        const response = await this.fetchFn(endpoint, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(body),
        })

        clearTimeout(timeout)
        const latencyMs = Date.now() - startedAt

        if (!response.ok) {
          const responseBody = await response.text()
          const isRateLimit = response.status === 429
          const isServerError = response.status >= 500
          const isAuthError = response.status === 401 || response.status === 403
          throw new ProviderRequestError({
            message: isAuthError
              ? `Anthropic Vertex: authentication failed (HTTP ${response.status}). Check GCP credentials.`
              : isRateLimit
                ? `Anthropic Vertex: rate limit exceeded. Retry after cooldown.`
                : `Anthropic Vertex: provider responded with HTTP ${response.status}.`,
            status: response.status,
            attempt,
            retryable: isRateLimit || isServerError,
            responseBody: isAuthError ? null : responseBody,
          })
        }

        const raw = await response.json()
        const content = extractAnthropicContent(raw)

        this.logger?.({
          event: 'provider_success',
          model: this.options.model,
          url: endpoint,
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
          url: endpoint,
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
      message: 'Anthropic Vertex: request failed without explicit error.',
      status: null,
      attempt: 1,
      retryable: false,
    })
  }
}

export function createAnthropicVertexProvider(
  options: AnthropicVertexProviderOptions,
): AnthropicVertexProvider {
  return new AnthropicVertexProvider(options)
}

function extractAnthropicContent(payload: unknown): string {
  // Anthropic response format: { content: [{ type: 'text', text: '...' }] }
  const content = (payload as {
    content?: Array<{ type: string; text?: string }>
  }).content

  if (!Array.isArray(content)) return ''
  return content
    .filter(block => block.type === 'text')
    .map(block => block.text ?? '')
    .join('')
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
      message: `Anthropic Vertex: request timed out after ${timeoutMs}ms.`,
      status: null,
      attempt,
      retryable: true,
      cause: error,
    })
  }

  return new ProviderRequestError({
    message: `Anthropic Vertex: request failed — ${error instanceof Error ? error.message : 'unknown error'}.`,
    status: null,
    attempt,
    retryable: true,
    cause: error,
  })
}
