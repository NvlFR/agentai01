import { describe, expect, it } from 'bun:test'
import { normalizeStringEntries } from './string-normalization.js'

describe('normalizeStringEntries', () => {
  it('returns empty array for null/undefined', () => {
    expect(normalizeStringEntries(null)).toEqual([])
    expect(normalizeStringEntries(undefined)).toEqual([])
  })

  it('trims strings and filters empty values', () => {
    expect(normalizeStringEntries(['  hello ', '', ' world '])).toEqual(['hello', 'world'])
  })

  it('deduplicates entries', () => {
    expect(normalizeStringEntries(['a', 'b', 'a', 'b'])).toEqual(['a', 'b'])
  })

  it('converts numbers to strings', () => {
    expect(normalizeStringEntries([1, 2, 3])).toEqual(['1', '2', '3'])
  })

  it('handles mixed string and number entries', () => {
    expect(normalizeStringEntries(['hello', 42, ' hello ', 42])).toEqual(['hello', '42'])
  })
})
