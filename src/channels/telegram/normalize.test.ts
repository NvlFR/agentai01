import { describe, expect, it } from 'bun:test'

import { looksLikeTelegramTarget, normalizeTelegramTarget } from './normalize.js'

describe('src/channels/telegram/normalize.ts', () => {
  it('normalizes telegram and tg prefixes to lowercase telegram targets', () => {
    expect(normalizeTelegramTarget(' tg:Group:-100123:TOPIC:42 ')).toBe(
      'telegram:group:-100123:topic:42',
    )
  })

  it('preserves shorthand numeric thread suffixes', () => {
    expect(normalizeTelegramTarget('telegram:@MyChannel:99')).toBe(
      'telegram:@mychannel:99',
    )
  })

  it('rejects empty or invalid targets', () => {
    expect(normalizeTelegramTarget('telegram:   ')).toBeUndefined()
    expect(normalizeTelegramTarget('')).toBeUndefined()
  })

  it('detects valid telegram targets', () => {
    expect(looksLikeTelegramTarget('tg:group:-100123:topic:42')).toBe(true)
    expect(looksLikeTelegramTarget('not a target')).toBe(false)
  })
})
