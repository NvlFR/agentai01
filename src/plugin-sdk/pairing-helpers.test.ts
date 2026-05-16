import { describe, expect, it } from 'bun:test'

import {
  formatPairingApproveHint,
  normalizeAtHashSlug,
  normalizeHyphenSlug,
  parseOptionalDelimitedEntries,
} from './pairing-helpers.js'

describe('pairing-helpers', () => {
  it('formats approval hint with pairing commands', () => {
    expect(formatPairingApproveHint('telegram')).toContain('pairing approve telegram <code>')
  })

  it('parses optional delimited entries', () => {
    expect(parseOptionalDelimitedEntries(' alice, bob\ncarol ; dave ')).toEqual([
      'alice',
      'bob',
      'carol',
      'dave',
    ])
    expect(parseOptionalDelimitedEntries('  ')).toBeUndefined()
  })

  it('normalizes slugs for pairing identifiers', () => {
    expect(normalizeHyphenSlug(' Team Room ')).toBe('team-room')
    expect(normalizeAtHashSlug('@@Room___Name')).toBe('room-name')
  })
})
