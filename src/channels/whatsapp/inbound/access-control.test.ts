import { describe, expect, it } from 'bun:test'
import {
  checkInboundAccessControl,
  resolveWhatsAppInboundPolicy,
  type AccessControlConfig,
} from './access-control.js'

const emptyCfg: AccessControlConfig = {}

describe('resolveWhatsAppInboundPolicy', () => {
  it('returns pairing dmPolicy by default', () => {
    const policy = resolveWhatsAppInboundPolicy({ cfg: emptyCfg, accountId: 'default' })
    expect(policy.dmPolicy).toBe('pairing')
  })

  it('returns open groupPolicy by default', () => {
    const policy = resolveWhatsAppInboundPolicy({ cfg: emptyCfg, accountId: 'default' })
    expect(policy.groupPolicy).toBe('open')
  })

  it('reads dmPolicy from config', () => {
    const cfg: AccessControlConfig = { web: { whatsapp: { dmPolicy: 'open' } } }
    const policy = resolveWhatsAppInboundPolicy({ cfg, accountId: 'default' })
    expect(policy.dmPolicy).toBe('open')
  })

  it('reads groupPolicy from config', () => {
    const cfg: AccessControlConfig = { web: { whatsapp: { groupPolicy: 'disabled' } } }
    const policy = resolveWhatsAppInboundPolicy({ cfg, accountId: 'default' })
    expect(policy.groupPolicy).toBe('disabled')
  })

  it('account-level config overrides top-level', () => {
    const cfg: AccessControlConfig = {
      web: {
        whatsapp: {
          dmPolicy: 'open',
          accounts: { myaccount: { dmPolicy: 'allowlist' } },
        },
      },
    }
    const policy = resolveWhatsAppInboundPolicy({ cfg, accountId: 'myaccount' })
    expect(policy.dmPolicy).toBe('allowlist')
  })

  it('normalizes allowFrom entries', () => {
    const cfg: AccessControlConfig = {
      web: { whatsapp: { allowFrom: ['+1234567890'] } },
    }
    const policy = resolveWhatsAppInboundPolicy({ cfg, accountId: 'default' })
    expect(policy.allowFrom).toContain('1234567890')
  })

  it('falls back to pairing for unknown dmPolicy value', () => {
    const cfg: AccessControlConfig = {
      web: { whatsapp: { dmPolicy: 'unknown-value' as 'open' } },
    }
    const policy = resolveWhatsAppInboundPolicy({ cfg, accountId: 'default' })
    expect(policy.dmPolicy).toBe('pairing')
  })
})

describe('checkInboundAccessControl — self-chat', () => {
  it('blocks fromMe DM when not self phone', async () => {
    const result = await checkInboundAccessControl({
      cfg: emptyCfg,
      accountId: 'default',
      from: '+9999999999',
      selfE164: '+1111111111',
      senderE164: null,
      group: false,
      isFromMe: true,
    })
    expect(result.allowed).toBe(false)
  })
})

describe('checkInboundAccessControl — group policy', () => {
  it('blocks group message when groupPolicy is disabled', async () => {
    const cfg: AccessControlConfig = { web: { whatsapp: { groupPolicy: 'disabled' } } }
    const result = await checkInboundAccessControl({
      cfg,
      accountId: 'default',
      from: '1234567890@g.us',
      selfE164: null,
      senderE164: '+1234567890',
      group: true,
      isFromMe: false,
    })
    expect(result.allowed).toBe(false)
  })

  it('allows group message when groupPolicy is open', async () => {
    const cfg: AccessControlConfig = { web: { whatsapp: { groupPolicy: 'open' } } }
    const result = await checkInboundAccessControl({
      cfg,
      accountId: 'default',
      from: '1234567890@g.us',
      selfE164: null,
      senderE164: '+1234567890',
      group: true,
      isFromMe: false,
    })
    expect(result.allowed).toBe(true)
    expect(result.shouldMarkRead).toBe(true)
  })

  it('blocks group message when groupPolicy is allowlist and no groupAllowFrom', async () => {
    const cfg: AccessControlConfig = { web: { whatsapp: { groupPolicy: 'allowlist' } } }
    const result = await checkInboundAccessControl({
      cfg,
      accountId: 'default',
      from: '1234567890@g.us',
      selfE164: null,
      senderE164: '+9999999999',
      group: true,
      isFromMe: false,
    })
    expect(result.allowed).toBe(false)
  })

  it('allows group message when sender is in groupAllowFrom', async () => {
    const cfg: AccessControlConfig = {
      web: {
        whatsapp: {
          groupPolicy: 'allowlist',
          groupAllowFrom: ['+1234567890'],
        },
      },
    }
    const result = await checkInboundAccessControl({
      cfg,
      accountId: 'default',
      from: '1234567890@g.us',
      selfE164: null,
      senderE164: '+1234567890',
      group: true,
      isFromMe: false,
    })
    expect(result.allowed).toBe(true)
  })

  it('blocks group message when sender is not in groupAllowFrom', async () => {
    const cfg: AccessControlConfig = {
      web: {
        whatsapp: {
          groupPolicy: 'allowlist',
          groupAllowFrom: ['+1111111111'],
        },
      },
    }
    const result = await checkInboundAccessControl({
      cfg,
      accountId: 'default',
      from: '1234567890@g.us',
      selfE164: null,
      senderE164: '+9999999999',
      group: true,
      isFromMe: false,
    })
    expect(result.allowed).toBe(false)
  })
})

describe('checkInboundAccessControl — DM policy', () => {
  it('blocks DM when dmPolicy is disabled', async () => {
    const cfg: AccessControlConfig = { web: { whatsapp: { dmPolicy: 'disabled' } } }
    const result = await checkInboundAccessControl({
      cfg,
      accountId: 'default',
      from: '+1234567890',
      selfE164: null,
      senderE164: null,
      group: false,
      isFromMe: false,
    })
    expect(result.allowed).toBe(false)
  })

  it('allows DM when dmPolicy is open', async () => {
    const cfg: AccessControlConfig = { web: { whatsapp: { dmPolicy: 'open' } } }
    const result = await checkInboundAccessControl({
      cfg,
      accountId: 'default',
      from: '+1234567890',
      selfE164: null,
      senderE164: null,
      group: false,
      isFromMe: false,
    })
    expect(result.allowed).toBe(true)
  })

  it('allows DM when dmPolicy is allowlist and sender is in allowFrom', async () => {
    const cfg: AccessControlConfig = {
      web: { whatsapp: { dmPolicy: 'allowlist', allowFrom: ['+1234567890'] } },
    }
    const result = await checkInboundAccessControl({
      cfg,
      accountId: 'default',
      from: '+1234567890',
      selfE164: null,
      senderE164: null,
      group: false,
      isFromMe: false,
    })
    expect(result.allowed).toBe(true)
  })

  it('blocks DM when dmPolicy is allowlist and sender is not in allowFrom', async () => {
    const cfg: AccessControlConfig = {
      web: { whatsapp: { dmPolicy: 'allowlist', allowFrom: ['+1111111111'] } },
    }
    const result = await checkInboundAccessControl({
      cfg,
      accountId: 'default',
      from: '+9999999999',
      selfE164: null,
      senderE164: null,
      group: false,
      isFromMe: false,
    })
    expect(result.allowed).toBe(false)
  })

  it('blocks DM when dmPolicy is pairing and sender not in allowFrom', async () => {
    const cfg: AccessControlConfig = { web: { whatsapp: { dmPolicy: 'pairing' } } }
    const result = await checkInboundAccessControl({
      cfg,
      accountId: 'default',
      from: '+9999999999',
      selfE164: '+1111111111',
      senderE164: null,
      group: false,
      isFromMe: false,
    })
    expect(result.allowed).toBe(false)
  })

  it('allows DM when dmPolicy is pairing and sender is in allowFrom', async () => {
    const cfg: AccessControlConfig = {
      web: { whatsapp: { dmPolicy: 'pairing', allowFrom: ['+1234567890'] } },
    }
    const result = await checkInboundAccessControl({
      cfg,
      accountId: 'default',
      from: '+1234567890',
      selfE164: null,
      senderE164: null,
      group: false,
      isFromMe: false,
    })
    expect(result.allowed).toBe(true)
  })

  it('calls pairingReply when pairing challenge needed', async () => {
    const cfg: AccessControlConfig = { web: { whatsapp: { dmPolicy: 'pairing' } } }
    let replySent = ''
    const result = await checkInboundAccessControl({
      cfg,
      accountId: 'default',
      from: '+9999999999',
      selfE164: '+1111111111',
      senderE164: null,
      group: false,
      isFromMe: false,
      pairingReply: async (text) => { replySent = text },
    })
    expect(result.allowed).toBe(false)
    expect(replySent).toContain('+9999999999')
  })

  it('suppresses pairingReply for historical messages', async () => {
    const cfg: AccessControlConfig = { web: { whatsapp: { dmPolicy: 'pairing' } } }
    let replySent = false
    const now = Date.now()
    await checkInboundAccessControl({
      cfg,
      accountId: 'default',
      from: '+9999999999',
      selfE164: '+1111111111',
      senderE164: null,
      group: false,
      isFromMe: false,
      messageTimestampMs: now - 60_000,
      connectedAtMs: now,
      pairingGraceMs: 30_000,
      pairingReply: async () => { replySent = true },
    })
    expect(replySent).toBe(false)
  })

  it('allows wildcard in allowFrom', async () => {
    const cfg: AccessControlConfig = {
      web: { whatsapp: { dmPolicy: 'allowlist', allowFrom: ['*'] } },
    }
    const result = await checkInboundAccessControl({
      cfg,
      accountId: 'default',
      from: '+9999999999',
      selfE164: null,
      senderE164: null,
      group: false,
      isFromMe: false,
    })
    expect(result.allowed).toBe(true)
  })
})

describe('checkInboundAccessControl — resolvedAccountId', () => {
  it('returns the accountId in result', async () => {
    const result = await checkInboundAccessControl({
      cfg: { web: { whatsapp: { dmPolicy: 'open' } } },
      accountId: 'myaccount',
      from: '+1234567890',
      selfE164: null,
      senderE164: null,
      group: false,
      isFromMe: false,
    })
    expect(result.resolvedAccountId).toBe('myaccount')
  })
})
