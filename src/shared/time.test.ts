import { describe, expect, it } from 'bun:test'

import { formatIso8601, parseIso8601 } from './time.js'

describe('iso8601 helpers', () => {
  it('round-trips a Date through formatting and parsing', () => {
    const date = new Date('2026-05-15T10:11:12.345Z')
    const parsed = parseIso8601(formatIso8601(date))

    expect(parsed?.getTime()).toBe(date.getTime())
  })

  it('returns null for invalid date strings', () => {
    expect(parseIso8601('not-a-date')).toBeNull()
  })
})
