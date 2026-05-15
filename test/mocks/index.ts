import {
  createSecretsAccessor,
  type SecretKey,
  type SecretsAccessor,
} from '../../src/secrets/index.js'
import type {
  ProviderResponse,
  ProviderTextGenerationRequest,
} from '../../src/runtime-app/providers/openaiCompatibleProvider.js'

export function createMockProvider(
  response: Partial<ProviderResponse> = {},
): {
  calls: ProviderTextGenerationRequest[]
  generateText(request: ProviderTextGenerationRequest): Promise<ProviderResponse>
} {
  const calls: ProviderTextGenerationRequest[] = []

  return {
    calls,
    async generateText(request) {
      calls.push(request)
      return {
        model: response.model ?? 'gpt-4.1-mini',
        content: response.content ?? 'Mock provider response',
        raw: response.raw ?? { ok: true },
        latencyMs: response.latencyMs ?? 0,
        attempts: response.attempts ?? 1,
      }
    },
  }
}

export function createMockStorage(
  seed: Record<string, string> = {},
): {
  read(path: string): string | null
  write(path: string, value: string): void
  list(): string[]
} {
  const store = new Map(Object.entries(seed))

  return {
    read(path) {
      return store.get(path) ?? null
    },
    write(path, value) {
      store.set(path, value)
    },
    list() {
      return [...store.keys()].sort()
    },
  }
}

export function createMockSecrets(
  values: Partial<Record<SecretKey, string>> = {},
): SecretsAccessor {
  return createSecretsAccessor({
    OPERATOR_TOKEN: values['OPERATOR_TOKEN'],
    AI_API_KEY: values['AI_API_KEY'],
    TOKEN_TELE: values['TOKEN_TELE'],
  })
}
