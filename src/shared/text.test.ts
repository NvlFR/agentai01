import { describe, expect, it } from 'bun:test'

import { normalizeWhitespace } from './text.js'

describe('normalizeWhitespace', () => {
  it('trims the string and collapses internal whitespace', () => {
    expect(normalizeWhitespace(' hello   runtime\nplatform\t ')).toBe(
      'hello runtime platform',
    )
  })
})
