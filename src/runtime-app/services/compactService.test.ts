import { describe, expect, it } from 'bun:test'
import { compactTextEntries } from './compactService.js'

describe('compactTextEntries', () => {
  it('trims over-budget context and reports warning state', () => {
    let trimmedBy = 0
    expect(compactTextEntries({
      entries: ['hello', 'world', 'from compact'],
      maxCharacters: 8,
      onTrimmed: count => { trimmedBy = count },
    })).toEqual({
      text: 'hello\nwo...',
      trimmed: true,
    })
    expect(trimmedBy).toBeGreaterThan(0)
  })
})
