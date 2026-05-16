import { describe, expect, it } from 'bun:test'

import {
  collectProviderDangerousNameMatchingScopes,
  formatZonedTimestamp,
  isTrustedProxyAddress,
  resolveClientIp,
} from './network-utils.js'

describe('network-utils', () => {
  it('trusts forwarded headers only for trusted proxies', () => {
    expect(
      resolveClientIp({
        remoteAddress: '127.0.0.1',
        trustedProxyAddresses: ['127.0.0.1'],
        headers: {
          'x-forwarded-for': '203.0.113.5, 127.0.0.1',
        },
      }),
    ).toBe('203.0.113.5')

    expect(
      resolveClientIp({
        remoteAddress: '198.51.100.1',
        trustedProxyAddresses: ['127.0.0.1'],
        headers: {
          'x-forwarded-for': '203.0.113.5',
        },
      }),
    ).toBe('198.51.100.1')
  })

  it('matches trusted proxy addresses and cidr ranges', () => {
    expect(isTrustedProxyAddress('127.0.0.1', ['127.0.0.1'])).toBe(true)
    expect(isTrustedProxyAddress('10.0.0.8', ['10.0.0.0/24'])).toBe(true)
    expect(isTrustedProxyAddress('10.0.1.8', ['10.0.0.0/24'])).toBe(false)
  })

  it('formats zoned timestamps with explicit time zone suffix', () => {
    expect(formatZonedTimestamp(new Date('2026-05-17T00:00:00Z'), 'Asia/Jakarta')).toBe(
      '2026-05-17 07:00:00 Asia/Jakarta',
    )
  })

  it('collects provider dangerous name matching scopes', () => {
    expect(
      collectProviderDangerousNameMatchingScopes(
        {
          channels: {
            telegram: {
              dangerouslyAllowNameMatching: true,
              accounts: {
                main: {},
                ops: {
                  dangerouslyAllowNameMatching: false,
                },
              },
            },
          },
        },
        'telegram',
      ),
    ).toEqual([
      {
        prefix: 'channels.telegram',
        account: {
          dangerouslyAllowNameMatching: true,
          accounts: {
            main: {},
            ops: {
              dangerouslyAllowNameMatching: false,
            },
          },
        },
        dangerousNameMatchingEnabled: true,
        dangerousFlagPath: 'channels.telegram.dangerouslyAllowNameMatching',
      },
      {
        prefix: 'channels.telegram.accounts.main',
        account: {},
        dangerousNameMatchingEnabled: true,
        dangerousFlagPath: 'channels.telegram.dangerouslyAllowNameMatching',
      },
      {
        prefix: 'channels.telegram.accounts.ops',
        account: {
          dangerouslyAllowNameMatching: false,
        },
        dangerousNameMatchingEnabled: false,
        dangerousFlagPath: 'channels.telegram.accounts.ops.dangerouslyAllowNameMatching',
      },
    ])
  })
})
