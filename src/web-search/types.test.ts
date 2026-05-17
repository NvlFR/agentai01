import { describe, expect, test } from 'bun:test'

import {
  DEFAULT_WEB_SEARCH_LIMIT,
  createWebSearchRequest,
  isBuiltInWebSearchProviderId,
} from './types.js'

describe('web-search/types', () => {
  test('normalizes query, locale, and limit into a request shape', () => {
    const request = createWebSearchRequest('  agent   runtime  ', {
      limit: 3.8,
      locale: '  us-en  ',
    })

    expect(request.query).toBe('agent runtime')
    expect(request.limit).toBe(3)
    expect(request.locale).toBe('us-en')
  })

  test('exposes built-in provider ids and sane defaults', () => {
    expect(DEFAULT_WEB_SEARCH_LIMIT).toBe(10)
    expect(isBuiltInWebSearchProviderId('tavily')).toBe(true)
    expect(isBuiltInWebSearchProviderId('duckduckgo')).toBe(true)
    expect(isBuiltInWebSearchProviderId('custom')).toBe(false)
  })
})
