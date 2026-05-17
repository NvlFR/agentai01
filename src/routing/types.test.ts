import { describe, expect, it } from 'bun:test'

import { DEAD_LETTER_REASONS, isDeadLetterReason } from './types.js'

describe('routing type runtime helpers', () => {
  it('exports supported dead-letter reasons', () => {
    expect(DEAD_LETTER_REASONS).toEqual(['invalid-message', 'no-route'])
  })

  it('narrows known dead-letter reasons', () => {
    expect(isDeadLetterReason('no-route')).toBe(true)
    expect(isDeadLetterReason('retry')).toBe(false)
  })
})
