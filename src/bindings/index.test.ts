import { describe, expect, it } from 'bun:test'

import { createUnavailableBinding, requireBinding, resolveBinding } from './index.js'

describe('bindings', () => {
  it('resolves available optional capability candidates', () => {
    const binding = resolveBinding('search', [
      { capability: 'missing', load: () => null },
      { capability: 'memory-search', load: () => ({ query: () => 'ok' }) },
    ], {
      query: () => 'fallback',
    })

    expect(binding.status).toBe('available')
    expect(requireBinding(binding).query()).toBe('ok')
  })

  it('uses explicit fallback when candidates are absent', () => {
    const binding = resolveBinding('search', [], { query: () => 'fallback' })

    expect(binding.status).toBe('fallback')
    expect(requireBinding(binding).query()).toBe('fallback')
  })

  it('throws when unavailable bindings are required', () => {
    expect(() => requireBinding(createUnavailableBinding('native'))).toThrow('unavailable')
  })
})
