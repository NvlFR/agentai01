// src/runtime-app/providers/gemini-cli/geminiProvider.test.ts

import { describe, it, expect, mock } from 'bun:test'
import { GeminiProvider, type GeminiProviderOptions } from './geminiProvider.js'
import { ProviderRequestError } from '../openaiCompatibleProvider.js'

function makeMockResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function makeOptions(overrides: Partial<GeminiProviderOptions> = {}): GeminiProviderOptions {
  return {
    apiKey: 'test-key',
    model: 'gemini-1.5-flash',
    timeoutMs: 5_000,
    retryLimit: 0,
    sleep: () => Promise.resolve(),
    ...overrides,
  }
}

const successBody = {
  choices: [{ message: { content: 'Hello from Gemini' } }],
}

describe('GeminiProvider', () => {
  it('returns ProviderResponse on successful call', async () => {
    const fetchFn = mock(() => Promise.resolve(makeMockResponse(200, successBody)))
    const provider = new GeminiProvider(makeOptions({ fetchFn }))
    const result = await provider.generateText({ messages: [{ role: 'user', content: 'Hi' }] })

    expect(result.content).toBe('Hello from Gemini')
    expect(result.model).toBe('gemini-1.5-flash')
    expect(result.attempts).toBe(1)
  })

  it('throws non-retryable ProviderRequestError on 403', async () => {
    const fetchFn = mock(() => Promise.resolve(makeMockResponse(403, { error: 'forbidden' })))
    const provider = new GeminiProvider(makeOptions({ fetchFn }))

    try {
      await provider.generateText({ messages: [{ role: 'user', content: 'Hi' }] })
    } catch (err) {
      expect(err instanceof ProviderRequestError).toBe(true)
      if (err instanceof ProviderRequestError) {
        expect(err.retryable).toBe(false)
        expect(err.status).toBe(403)
        expect(err.message).toContain('API key')
      }
    }
  })

  it('throws retryable ProviderRequestError on 429', async () => {
    const fetchFn = mock(() => Promise.resolve(makeMockResponse(429, { error: 'quota' })))
    const provider = new GeminiProvider(makeOptions({ fetchFn, retryLimit: 0 }))

    try {
      await provider.generateText({ messages: [{ role: 'user', content: 'Hi' }] })
    } catch (err) {
      expect(err instanceof ProviderRequestError).toBe(true)
      if (err instanceof ProviderRequestError) {
        expect(err.retryable).toBe(true)
        expect(err.message).toContain('quota')
      }
    }
  })

  it('returns consistent response structure', async () => {
    const fetchFn = mock(() => Promise.resolve(makeMockResponse(200, successBody)))
    const provider = new GeminiProvider(makeOptions({ fetchFn }))
    const result = await provider.generateText({ messages: [{ role: 'user', content: 'test' }] })

    expect(typeof result.content).toBe('string')
    expect(typeof result.latencyMs).toBe('number')
    expect(result.attempts).toBeGreaterThan(0)
    expect(result.raw).toBeDefined()
  })
})
