import { describe, expect, it } from 'bun:test'
import {
  isWhatsAppGroupJid,
  isWhatsAppNewsletterJid,
  isWhatsAppUserTarget,
  looksLikeWhatsAppTargetId,
  normalizeWhatsAppAllowFromEntries,
  normalizeWhatsAppAllowFromEntry,
  normalizeWhatsAppMessagingTarget,
  normalizeWhatsAppTarget,
} from './normalize-target.js'

describe('isWhatsAppGroupJid', () => {
  it('returns true for valid group JID', () => {
    expect(isWhatsAppGroupJid('1234567890-1234567890@g.us')).toBe(true)
    expect(isWhatsAppGroupJid('9876543210@g.us')).toBe(true)
  })

  it('returns true with whatsapp: prefix', () => {
    expect(isWhatsAppGroupJid('whatsapp:1234567890-1234567890@g.us')).toBe(true)
  })

  it('returns false for user JID', () => {
    expect(isWhatsAppGroupJid('1234567890@s.whatsapp.net')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isWhatsAppGroupJid('')).toBe(false)
  })

  it('returns false for non-numeric local part', () => {
    expect(isWhatsAppGroupJid('abc@g.us')).toBe(false)
  })
})

describe('isWhatsAppNewsletterJid', () => {
  it('returns true for newsletter JID', () => {
    expect(isWhatsAppNewsletterJid('1234567890@newsletter')).toBe(true)
  })

  it('returns false for group JID', () => {
    expect(isWhatsAppNewsletterJid('1234567890@g.us')).toBe(false)
  })
})

describe('isWhatsAppUserTarget', () => {
  it('returns true for s.whatsapp.net JID', () => {
    expect(isWhatsAppUserTarget('1234567890@s.whatsapp.net')).toBe(true)
  })

  it('returns true for legacy c.us JID', () => {
    expect(isWhatsAppUserTarget('1234567890@c.us')).toBe(true)
  })

  it('returns true for lid JID', () => {
    expect(isWhatsAppUserTarget('1234567890@lid')).toBe(true)
  })

  it('returns false for group JID', () => {
    expect(isWhatsAppUserTarget('1234567890@g.us')).toBe(false)
  })
})

describe('normalizeWhatsAppTarget', () => {
  it('normalizes a group JID', () => {
    expect(normalizeWhatsAppTarget('1234567890-1234567890@g.us')).toBe(
      '1234567890-1234567890@g.us',
    )
  })

  it('normalizes a newsletter JID', () => {
    expect(normalizeWhatsAppTarget('1234567890@newsletter')).toBe('1234567890@newsletter')
  })

  it('normalizes a user JID to E.164', () => {
    const result = normalizeWhatsAppTarget('1234567890@s.whatsapp.net')
    expect(result).toBe('+1234567890')
  })

  it('normalizes a plain phone number', () => {
    const result = normalizeWhatsAppTarget('+1234567890')
    expect(result).toBe('+1234567890')
  })

  it('strips whatsapp: prefix before normalizing', () => {
    const result = normalizeWhatsAppTarget('whatsapp:+1234567890')
    expect(result).toBe('+1234567890')
  })

  it('returns null for empty string', () => {
    expect(normalizeWhatsAppTarget('')).toBeNull()
  })

  it('returns null for unknown @ domain', () => {
    expect(normalizeWhatsAppTarget('user@unknown.domain')).toBeNull()
  })

  it('returns null for non-whatsapp provider prefix', () => {
    expect(normalizeWhatsAppTarget('telegram:+1234567890')).toBeNull()
  })
})

describe('normalizeWhatsAppMessagingTarget', () => {
  it('returns undefined for empty string', () => {
    expect(normalizeWhatsAppMessagingTarget('')).toBeUndefined()
  })

  it('returns undefined for whitespace-only string', () => {
    expect(normalizeWhatsAppMessagingTarget('   ')).toBeUndefined()
  })

  it('returns normalized target for valid input', () => {
    expect(normalizeWhatsAppMessagingTarget('+1234567890')).toBe('+1234567890')
  })

  it('returns undefined for invalid input', () => {
    expect(normalizeWhatsAppMessagingTarget('not-a-number')).toBeUndefined()
  })
})

describe('normalizeWhatsAppAllowFromEntry', () => {
  it('returns * unchanged', () => {
    expect(normalizeWhatsAppAllowFromEntry('*')).toBe('*')
  })

  it('strips leading + from normalized phone', () => {
    const result = normalizeWhatsAppAllowFromEntry('+1234567890')
    expect(result).toBe('1234567890')
  })

  it('returns null for invalid entry', () => {
    expect(normalizeWhatsAppAllowFromEntry('not-valid@@')).toBeNull()
  })
})

describe('normalizeWhatsAppAllowFromEntries', () => {
  it('deduplicates entries', () => {
    const result = normalizeWhatsAppAllowFromEntries(['+1234567890', '+1234567890'])
    expect(result).toHaveLength(1)
  })

  it('filters out invalid entries', () => {
    const result = normalizeWhatsAppAllowFromEntries(['+1234567890', 'invalid@@'])
    expect(result).toHaveLength(1)
    expect(result[0]).toBe('1234567890')
  })

  it('handles wildcard', () => {
    const result = normalizeWhatsAppAllowFromEntries(['*'])
    expect(result).toEqual(['*'])
  })

  it('handles numeric entries', () => {
    const result = normalizeWhatsAppAllowFromEntries([1234567890])
    expect(result).toHaveLength(1)
  })
})

describe('looksLikeWhatsAppTargetId', () => {
  it('returns true for whatsapp: prefix', () => {
    expect(looksLikeWhatsAppTargetId('whatsapp:+1234567890')).toBe(true)
  })

  it('returns true for group JID', () => {
    expect(looksLikeWhatsAppTargetId('1234567890@g.us')).toBe(true)
  })

  it('returns true for user JID', () => {
    expect(looksLikeWhatsAppTargetId('1234567890@s.whatsapp.net')).toBe(true)
  })

  it('returns true for plain phone number', () => {
    expect(looksLikeWhatsAppTargetId('+1234567890')).toBe(true)
  })

  it('returns false for empty string', () => {
    expect(looksLikeWhatsAppTargetId('')).toBe(false)
  })

  it('returns false for telegram prefix', () => {
    expect(looksLikeWhatsAppTargetId('telegram:+1234567890')).toBe(false)
  })
})
