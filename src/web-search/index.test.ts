import { describe, expect, test } from 'bun:test'

import {
  createDuckDuckGoWebSearchProvider,
  createTavilyWebSearchProvider,
  createWebSearchClient,
  normalizeSearchResults,
} from './index.js'

describe('web-search/index', () => {
  test('re-exports runtime and provider factories', () => {
    expect(typeof createWebSearchClient).toBe('function')
    expect(typeof normalizeSearchResults).toBe('function')
    expect(typeof createTavilyWebSearchProvider).toBe('function')
    expect(typeof createDuckDuckGoWebSearchProvider).toBe('function')
  })
})
