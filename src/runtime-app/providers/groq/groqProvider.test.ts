// src/runtime-app/providers/groq/groqProvider.test.ts

import { describe, it, expect, mock } from 'bun:test'
import { GroqProvider, type GroqProviderOptions } from './groqProvider.js'
import { ProviderRequestError } from '../openaiCompatibleProvider.js'

function makeMockResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function makeOptions(overrides: Partial<GroqProviderOptions> = {}): GroqProviderOptions {
  return {
    apiKey: 'test-key',
    model: 'llama3-8b-8192',
    timeoutMs: 5_000,
    retryLimit: 0,
    sleep: () => Promise.resolve(),
    ...overrides,
  }
}

const successBody = {
  choices: [{ message: { content: 'Hello from Groq' } }],
}

describe('GroqProvider', () => {
  it('returns ProviderResponse on successful call', async () => {
    const fetchFn = mock(() => Promise.resolve(makeMockResponse(200, successBody)))
    const provider = new GroqProvider(makeOptions({ fetchFn }))
    const result = await provider.generateText({ messages: [{ role: 'user', content: 'Hi' }] })

    expect(result.content).toBe('Hello from Groq')
    expect(result.model).toBe('llama3-8b-8192')
    expect(result.attempts).toBe(1)
  })

  it('throws non-retryable ProviderRequestError on 401', async () => {
    const fetchFn = mock(() => Promise.resolve(makeMockResponse(401, { error: 'invalid key' })))
    const provider = new GroqProvider(makeOptions({ fetchFn }))

    await expect(
      provider.generateText({ messages: [{ role: 'user', content: 'Hi' }] }),
    ).rejects.toThrow(ProviderRequestError)

    try {
      await provider.generateText({ messages: [{ role: 'user', content: 'Hi' }] })
    } catch (err) {
      expect(err instanceof ProviderRequestError).toBe(true)
      if (err instanceof ProviderRequestError) {
        expect(err.retryable).toBe(false)
        expect(err.status).toBe(401)
      }
    }
  })

  it('throws retryable ProviderRequestError on 429', async () => {
    const fetchFn = mock(() => Promise.resolve(makeMockResponse(429, { error: 'rate limit' })))
    const provider = new GroqProvider(makeOptions({ fetchFn, retryLimit: 0 }))

    try {
      await provider.generateText({ messages: [{ role: 'user', content: 'Hi' }] })
    } catch (err) {
      expect(err instanceof ProviderRequestError).toBe(true)
      if (err instanceof ProviderRequestError) {
        expect(err.retryable).toBe(true)
        expect(err.status).toBe(429)
        expect(err.message).toContain('rate limit')
      }
    }
  })

  it('has consistent response structure regardless of content', async () => {
    const bodies = [
      { choices: [{ message: { content: 'A' } }] },
      { choices: [{ message: { content: '' } }] },
      { choices: [] },
    ]

    for (const body of bodies) {
      const fetchFn = mock(() => Promise.resolve(makeMockResponse(200, body)))
      const provider = new GroqProvider(makeOptions({ fetchFn }))
      const result = await provider.generateText({ messages: [{ role: 'user', content: 'test' }] })

      expect(typeof result.content).toBe('string')
      expect(typeof result.model).toBe('string')
      expect(typeof result.latencyMs).toBe('number')
      expect(result.attempts).toBeGreaterThan(0)
    }
  })
})
