import { afterEach, describe, expect, it } from 'bun:test'
import {
  __testing,
  buildWhatsAppMessageKey,
  claimInboundWhatsAppMessage,
  commitInboundWhatsAppMessage,
  isRecentOutboundWhatsAppMessage,
  recordOutboundWhatsAppMessage,
  releaseInboundWhatsAppMessage,
  resetWebInboundDedupe,
} from './dedupe.js'

afterEach(() => {
  resetWebInboundDedupe()
})

describe('buildWhatsAppMessageKey', () => {
  it('builds a canonical key for valid params', () => {
    expect(
      buildWhatsAppMessageKey({
        accountId: 'acct',
        remoteJid: '123@g.us',
        messageId: 'abc',
      }),
    ).toBe('acct:123@g.us:abc')
  })

  it('returns null for blank or unknown message ids', () => {
    expect(
      buildWhatsAppMessageKey({
        accountId: 'acct',
        remoteJid: '123@g.us',
        messageId: 'unknown',
      }),
    ).toBeNull()

    expect(
      buildWhatsAppMessageKey({
        accountId: 'acct',
        remoteJid: '123@g.us',
        messageId: '   ',
      }),
    ).toBeNull()
  })
})

describe('claimInboundWhatsAppMessage', () => {
  it('returns true on first claim and false on duplicate claim', () => {
    const key = 'acct:chat:msg-1'

    expect(claimInboundWhatsAppMessage(key)).toBe(true)
    expect(claimInboundWhatsAppMessage(key)).toBe(false)
  })

  it('allows a new claim after release', () => {
    const key = 'acct:chat:msg-2'

    expect(claimInboundWhatsAppMessage(key)).toBe(true)
    releaseInboundWhatsAppMessage(key)
    expect(claimInboundWhatsAppMessage(key)).toBe(true)
  })

  it('keeps committed keys deduped until reset', () => {
    const key = 'acct:chat:msg-3'

    expect(claimInboundWhatsAppMessage(key)).toBe(true)
    commitInboundWhatsAppMessage(key)
    expect(claimInboundWhatsAppMessage(key)).toBe(false)
  })
})

describe('recordOutboundWhatsAppMessage', () => {
  it('marks outbound messages as recent echoes', () => {
    const params = {
      accountId: 'acct',
      remoteJid: '123@g.us',
      messageId: 'msg-4',
    }

    expect(isRecentOutboundWhatsAppMessage(params)).toBe(false)
    recordOutboundWhatsAppMessage(params)
    expect(isRecentOutboundWhatsAppMessage(params)).toBe(true)
  })

  it('ignores incomplete outbound keys', () => {
    recordOutboundWhatsAppMessage({
      accountId: 'acct',
      remoteJid: '123@g.us',
      messageId: 'unknown',
    })

    expect(
      isRecentOutboundWhatsAppMessage({
        accountId: 'acct',
        remoteJid: '123@g.us',
        messageId: 'unknown',
      }),
    ).toBe(false)
  })
})

describe('__testing caches', () => {
  it('expires recent outbound entries after ttl when using injected now', () => {
    const cache = __testing.createRecentMessageCache({ ttlMs: 100, maxSize: 5 })
    const now = 1_000

    expect(cache.check('msg-ttl', now)).toBe(false)
    expect(cache.peek('msg-ttl', now + 99)).toBe(true)
    expect(cache.peek('msg-ttl', now + 100)).toBe(false)
  })

  it('evicts the oldest outbound entry when max size is exceeded', () => {
    const cache = __testing.createRecentMessageCache({ ttlMs: 1_000, maxSize: 2 })

    cache.check('first', 100)
    cache.check('second', 200)
    cache.check('third', 300)

    expect(cache.peek('first', 300)).toBe(false)
    expect(cache.peek('second', 300)).toBe(true)
    expect(cache.peek('third', 300)).toBe(true)
  })

  it('expires claimed inbound entries after ttl when using injected now', () => {
    const cache = __testing.createClaimableCache({ ttlMs: 100, maxSize: 5 })
    const now = 2_000

    expect(cache.claim('inbound-ttl', now).kind).toBe('claimed')
    expect(cache.claim('inbound-ttl', now + 50).kind).toBe('duplicate')
    expect(cache.claim('inbound-ttl', now + 101).kind).toBe('claimed')
  })

  it('evicts the oldest inbound claim when max size is exceeded', () => {
    const cache = __testing.createClaimableCache({ ttlMs: 1_000, maxSize: 2 })

    expect(cache.claim('first', 100).kind).toBe('claimed')
    expect(cache.claim('second', 200).kind).toBe('claimed')
    expect(cache.claim('third', 300).kind).toBe('claimed')

    expect(cache.claim('first', 300).kind).toBe('claimed')
    expect(cache.size()).toBe(2)
  })
})
