import { describe, expect, it } from 'bun:test'
import { chunkTextByBreakResolver } from './text-chunking.js'

describe('chunkTextByBreakResolver', () => {
  it('returns empty array for empty text', () => {
    expect(chunkTextByBreakResolver('', 100, () => -1)).toEqual([])
  })

  it('returns single chunk for text within limit', () => {
    expect(chunkTextByBreakResolver('hello', 100, () => -1)).toEqual(['hello'])
  })

  it('splits at resolver-provided break point', () => {
    const text = 'hello world test'
    const chunks = chunkTextByBreakResolver(text, 12, (window) => {
      const idx = window.lastIndexOf(' ')
      return idx > 0 ? idx : -1
    })
    expect(chunks.length).toBeGreaterThan(1)
    // All chunks rejoin to form the original text (modulo whitespace trimming)
    expect(chunks.join(' ').replace(/\s+/g, ' ')).toBe(text)
  })

  it('force-splits when resolver returns no break point', () => {
    const text = 'abcdefghijklmnop'
    const chunks = chunkTextByBreakResolver(text, 5, () => -1)
    expect(chunks).toEqual(['abcde', 'fghij', 'klmno', 'p'])
  })

  it('handles limit <= 0 by returning full text', () => {
    expect(chunkTextByBreakResolver('hello', 0, () => -1)).toEqual(['hello'])
    expect(chunkTextByBreakResolver('hello', -1, () => -1)).toEqual(['hello'])
  })
})
