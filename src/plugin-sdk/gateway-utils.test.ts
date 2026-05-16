import { describe, expect, it } from 'bun:test'

import {
  buildAgentSessionKey,
  DEFAULT_ACCOUNT_ID,
  normalizeAccountId,
  resolveGatewayBindUrl,
  resolveGatewayPort,
  resolveThreadSessionKeys,
} from './gateway-utils.js'

describe('gateway-utils', () => {
  it('normalizes account ids and falls back to default', () => {
    expect(normalizeAccountId(' Ops Main ')).toBe('ops-main')
    expect(normalizeAccountId('')).toBe(DEFAULT_ACCOUNT_ID)
  })

  it('parses valid ports and falls back for invalid input', () => {
    expect(resolveGatewayPort('3010')).toBe(3010)
    expect(resolveGatewayPort('0', 4000)).toBe(4000)
  })

  it('builds gateway bind urls for custom and tailnet modes', () => {
    expect(
      resolveGatewayBindUrl({
        bind: 'custom',
        customBindHost: 'gateway.example.test',
        scheme: 'https',
        port: 9443,
        pickLanHost: () => null,
        pickTailnetHost: () => null,
      }),
    ).toEqual({
      url: 'https://gateway.example.test:9443',
      source: 'gateway.bind=custom',
    })

    expect(
      resolveGatewayBindUrl({
        bind: 'tailnet',
        port: 9443,
        pickLanHost: () => null,
        pickTailnetHost: () => 'agent.tailnet.ts.net',
      }),
    ).toEqual({
      url: 'ws://agent.tailnet.ts.net:9443',
      source: 'gateway.bind=tailnet',
    })
  })

  it('builds agent session key and thread suffixes', () => {
    expect(
      buildAgentSessionKey({
        agentId: 'Main',
        channel: 'telegram',
        accountId: 'ops',
        peer: { kind: 'group', id: '123' },
      }),
    ).toBe('main:telegram:ops:group:123')

    expect(
      resolveThreadSessionKeys({
        baseSessionKey: 'main:telegram:ops:group:123',
        threadId: 'Topic-9',
      }),
    ).toEqual({
      baseSessionKey: 'main:telegram:ops:group:123',
      sessionKey: 'main:telegram:ops:group:123:thread:topic-9',
      threadId: 'topic-9',
    })
  })
})
