import { describe, expect, test } from 'bun:test'

import type { WebFetchOptions, WebFetchResult } from './types.js'

describe('web-fetch/types', () => {
  test('supports the required web fetch shapes', () => {
    const options: WebFetchOptions = {
      timeoutMs: 5_000,
      maxContentLength: 2_000,
      userAgent: 'agentai01-test',
    }
    const result: WebFetchResult = {
      url: 'https://example.com',
      title: 'Example',
      content: 'Hello world',
      excerpt: 'Hello world',
      fetchedAt: '2026-05-17T00:00:00.000Z',
    }

    expect(options.timeoutMs).toBe(5_000)
    expect(result.content).toBe('Hello world')
  })
})
