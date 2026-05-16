import { describe, expect, it } from 'bun:test'
import { estimateTokens } from './estimate.js'

describe('estimateTokens', () => {
  it('returns a coarse token estimate from content length', () => {
    expect(estimateTokens('hello world')).toBe(3)
  })

  it('returns a minimum of one token for empty content', () => {
    expect(estimateTokens('')).toBe(1)
  })
})
