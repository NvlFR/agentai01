import { describe, expect, it } from 'bun:test'

import {
  OpenAICompatibleProvider,
  ProviderRequestError,
} from './openaiCompatibleProvider.js'

describe('OpenAICompatibleProvider', () => {
  it('sends OpenAI-compatible requests and retries retryable failures', async () => {
    const calls: Array<{ url: string; init: RequestInit | undefined }> = []
    const logs: string[] = []
    let attempt = 0

    const provider = new OpenAICompatibleProvider({
      baseURL: 'http://127.0.0.1:8045/v1/',
      apiKey: 'test-key',
      model: 'gpt-local',
      timeoutMs: 250,
      retryLimit: 2,
      sleep: async () => undefined,
      logger: entry => logs.push(entry.event),
      fetchFn: async (url, init) => {
        calls.push({ url: String(url), init })
        attempt += 1
        if (attempt === 1) {
          return new Response('temporary failure', { status: 503 })
        }

        return Response.json({
          choices: [{ message: { content: 'Halo runtime' } }],
        })
      },
    })

    const response = await provider.generateText({
      messages: [{ role: 'user', content: 'Ping' }],
      temperature: 0.2,
      maxTokens: 32,
    })

    expect(response.content).toBe('Halo runtime')
    expect(response.attempts).toBe(2)
    expect(calls).toHaveLength(2)
    expect(calls[0]?.url).toBe('http://127.0.0.1:8045/v1/chat/completions')
    expect(calls[0]?.init?.headers).toEqual({
      'content-type': 'application/json',
      authorization: 'Bearer test-key',
    })
    expect(calls[0]?.init?.body).toContain('"model":"gpt-local"')
    expect(logs).toContain('provider_retry')
    expect(logs).toContain('provider_success')
  })

  it('throws a structured error after retries are exhausted', async () => {
    const provider = new OpenAICompatibleProvider({
      baseURL: 'http://127.0.0.1:8045/v1',
      apiKey: 'test-key',
      model: 'gpt-local',
      timeoutMs: 250,
      retryLimit: 1,
      sleep: async () => undefined,
      fetchFn: async () => new Response('rate limited', { status: 429 }),
    })

    const result = provider.generateText({
      messages: [{ role: 'user', content: 'Retry please' }],
    })

    await expect(result).rejects.toBeInstanceOf(ProviderRequestError)
    await expect(result).rejects.toMatchObject({
      status: 429,
      attempt: 2,
      retryable: true,
    })
  })
})
