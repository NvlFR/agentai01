import { describe, expect, it } from 'bun:test'
import { isChannelId } from './types.js'

describe('src/channels/types.ts', () => {
  it('identifies valid channel IDs', () => {
    expect(isChannelId('telegram')).toBe(true)
    expect(isChannelId(' whatsapp ')).toBe(true)
  })

  it('rejects invalid channel IDs', () => {
    expect(isChannelId('')).toBe(false)
    expect(isChannelId('  ')).toBe(false)
    expect(isChannelId(null)).toBe(false)
    expect(isChannelId(123)).toBe(false)
  })
})
