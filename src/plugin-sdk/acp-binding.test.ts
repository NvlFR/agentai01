import { describe, expect, it } from 'bun:test'

import {
  ensureConfiguredAcpBindingReady,
  resolveConfiguredAcpBindingRecord,
} from './acp-binding.js'

describe('acp-binding', () => {
  it('resolves configured binding record from config', () => {
    expect(
      resolveConfiguredAcpBindingRecord({
        cfg: {
          acp: {
            bindings: [
              {
                sessionKey: 'agent:main:telegram:main',
                channel: 'telegram',
                accountId: 'main',
                state: 'ready',
              },
            ],
          },
        },
        sessionKey: 'agent:main:telegram:main',
      }),
    ).toEqual({
      sessionKey: 'agent:main:telegram:main',
      channel: 'telegram',
      accountId: 'main',
      state: 'ready',
      metadata: undefined,
    })
  })

  it('returns not configured when acp binding is missing', async () => {
    expect(
      await ensureConfiguredAcpBindingReady({
        cfg: {},
        configuredBinding: null,
      }),
    ).toEqual({
      ok: false,
      error: 'ACP binding not configured',
    })
  })
})
