import { describe, expect, it, mock } from 'bun:test'

import { createCachedLazyValueGetter } from './lazy-value.js'

describe('createCachedLazyValueGetter', () => {
  it('calls the factory once and caches the value', () => {
    const resolveValue = mock(() => ({ name: 'demo' }))
    const getValue = createCachedLazyValueGetter(resolveValue)

    expect(getValue()).toEqual({ name: 'demo' })
    expect(getValue()).toEqual({ name: 'demo' })
    expect(resolveValue).toHaveBeenCalledTimes(1)
  })

  it('uses fallback when lazy value resolves to nullish', () => {
    const getValue = createCachedLazyValueGetter(() => undefined, { name: 'fallback' })
    expect(getValue()).toEqual({ name: 'fallback' })
  })
})
