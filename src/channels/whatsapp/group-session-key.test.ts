import { describe, expect, it } from 'bun:test'
import {
  resolveWhatsAppGroupSessionRoute,
  resolveWhatsAppLegacyGroupSessionKey,
  __testing,
} from './group-session-key.js'

const { resolveWhatsAppGroupAccountThreadId } = __testing

describe('resolveWhatsAppGroupAccountThreadId', () => {
  it('returns account-scoped thread id', () => {
    expect(resolveWhatsAppGroupAccountThreadId('myaccount')).toBe('whatsapp-account-myaccount')
  })

  it('normalizes account id', () => {
    expect(resolveWhatsAppGroupAccountThreadId('My Account!')).toBe('whatsapp-account-my-account')
  })
})

describe('resolveWhatsAppLegacyGroupSessionKey', () => {
  it('returns null for default account', () => {
    const result = resolveWhatsAppLegacyGroupSessionKey({
      sessionKey: 'agent:whatsapp:default:group:123@g.us',
      accountId: 'default',
    })
    expect(result).toBeNull()
  })

  it('returns null when sessionKey does not contain :group:', () => {
    const result = resolveWhatsAppLegacyGroupSessionKey({
      sessionKey: 'agent:whatsapp:myaccount:main',
      accountId: 'myaccount',
    })
    expect(result).toBeNull()
  })

  it('returns null when sessionKey does not end with expected suffix', () => {
    const result = resolveWhatsAppLegacyGroupSessionKey({
      sessionKey: 'agent:whatsapp:myaccount:group:123@g.us',
      accountId: 'myaccount',
    })
    expect(result).toBeNull()
  })

  it('strips the account thread suffix from a legacy scoped key', () => {
    const base = 'agent:whatsapp:myaccount:group:123@g.us'
    const suffix = ':thread:whatsapp-account-myaccount'
    const result = resolveWhatsAppLegacyGroupSessionKey({
      sessionKey: `${base}${suffix}`,
      accountId: 'myaccount',
    })
    expect(result).toBe(base)
  })

  it('returns null for null accountId', () => {
    const result = resolveWhatsAppLegacyGroupSessionKey({
      sessionKey: 'agent:whatsapp:default:group:123@g.us:thread:whatsapp-account-default',
      accountId: null,
    })
    expect(result).toBeNull()
  })
})

describe('resolveWhatsAppGroupSessionRoute', () => {
  it('returns route unchanged for default account', () => {
    const route = {
      sessionKey: 'agent:whatsapp:default:group:123@g.us',
      accountId: 'default',
    }
    const result = resolveWhatsAppGroupSessionRoute(route)
    expect(result.sessionKey).toBe(route.sessionKey)
  })

  it('returns route unchanged when sessionKey does not contain :group:', () => {
    const route = {
      sessionKey: 'agent:whatsapp:myaccount:main',
      accountId: 'myaccount',
    }
    const result = resolveWhatsAppGroupSessionRoute(route)
    expect(result.sessionKey).toBe(route.sessionKey)
  })

  it('appends account-scoped thread suffix for non-default account group session', () => {
    const route = {
      sessionKey: 'agent:whatsapp:myaccount:group:123@g.us',
      accountId: 'myaccount',
    }
    const result = resolveWhatsAppGroupSessionRoute(route)
    expect(result.sessionKey).toBe(
      'agent:whatsapp:myaccount:group:123@g.us:thread:whatsapp-account-myaccount',
    )
  })

  it('preserves other route fields', () => {
    const route = {
      sessionKey: 'agent:whatsapp:myaccount:group:123@g.us',
      accountId: 'myaccount',
      agentId: 'ceo',
      channel: 'whatsapp',
    }
    const result = resolveWhatsAppGroupSessionRoute(route)
    expect(result.agentId).toBe('ceo')
    expect(result.channel).toBe('whatsapp')
  })
})
