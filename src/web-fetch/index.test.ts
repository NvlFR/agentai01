import { describe, expect, test } from 'bun:test'

import { extractReadableContent, fetchWebContent } from './index.js'

describe('web-fetch/index', () => {
  test('re-exports runtime and extractor contracts', () => {
    expect(typeof fetchWebContent).toBe('function')
    expect(typeof extractReadableContent).toBe('function')
  })
})
