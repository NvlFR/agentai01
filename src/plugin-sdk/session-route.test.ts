import { describe, expect, it } from 'bun:test'
import {
  buildChannelOutboundSessionRoute,
  buildThreadAwareOutboundSessionRoute,
  recoverCurrentThreadSessionId,
  stripChannelTargetPrefix,
  stripTargetKindPrefix,
  type ChannelOutboundSessionRoute,
} from './session-route.js'

function baseRoute(
  overrides: Partial<ChannelOutboundSessionRoute> = {},
): ChannelOutboundSessionRoute {
  return {
    sessionKey: 'agent:main:workspace:channel:c123',
    baseSessionKey: 'agent:main:workspace:channel:c123',
    peer: { kind: 'channel', id: 'c123' },
    chatType: 'channel',
    from: 'workspace:channel:c123',
    to: 'channel:c123',
    ...overrides,
  }
}

describe('buildChannelOutboundSessionRoute', () => {
  it('builds a route with base session key', () => {
    const route = buildChannelOutboundSessionRoute({
      agentId: 'agent:main',
      channel: 'telegram',
      peer: { kind: 'direct', id: 'user-1' },
      chatType: 'direct',
      from: 'telegram:user-1',
      to: 'user-1',
    })

    expect(route.sessionKey).toBe(route.baseSessionKey)
    expect(route.peer).toEqual({ kind: 'direct', id: 'user-1' })
    expect(route.chatType).toBe('direct')
  })

  it('includes accountId in session key when provided', () => {
    const route = buildChannelOutboundSessionRoute({
      agentId: 'agent:main',
      channel: 'telegram',
      accountId: 'acc-1',
      peer: { kind: 'direct', id: 'user-1' },
      chatType: 'direct',
      from: 'telegram:user-1',
      to: 'user-1',
    })

    expect(route.baseSessionKey).toContain('acc-1')
  })

  it('includes threadId when provided', () => {
    const route = buildChannelOutboundSessionRoute({
      agentId: 'agent:main',
      channel: 'telegram',
      peer: { kind: 'channel', id: 'c1' },
      chatType: 'channel',
      from: 'telegram:c1',
      to: 'c1',
      threadId: 'thread-42',
    })

    expect(route.threadId).toBe('thread-42')
  })
})

describe('buildThreadAwareOutboundSessionRoute', () => {
  it('uses replyToId before threadId and recovered current-session thread by default', () => {
    const route = buildThreadAwareOutboundSessionRoute({
      route: baseRoute(),
      replyToId: 'reply-1',
      threadId: 'thread-1',
      currentSessionKey: 'agent:main:workspace:channel:c123:thread:current-1',
    })

    expect(route).toEqual(
      baseRoute({
        sessionKey: 'agent:main:workspace:channel:c123:thread:reply-1',
        threadId: 'reply-1',
      }),
    )
  })

  it('supports provider-specific threadId-first precedence', () => {
    const route = buildThreadAwareOutboundSessionRoute({
      route: baseRoute(),
      replyToId: 'reply-1',
      threadId: 'thread-1',
      precedence: ['threadId', 'replyToId', 'currentSession'],
    })

    expect(route).toEqual(
      baseRoute({
        sessionKey: 'agent:main:workspace:channel:c123:thread:thread-1',
        threadId: 'thread-1',
      }),
    )
  })

  it('keeps numeric delivery thread ids on the route while stringifying the session suffix', () => {
    const route = buildThreadAwareOutboundSessionRoute({
      route: baseRoute(),
      threadId: 99,
    })

    expect(route).toEqual(
      baseRoute({
        sessionKey: 'agent:main:workspace:channel:c123:thread:99',
        threadId: 99,
      }),
    )
  })

  it('lets providers veto current-session recovery', () => {
    const route = buildThreadAwareOutboundSessionRoute({
      route: baseRoute(),
      currentSessionKey: 'agent:main:workspace:channel:c123:thread:current-1',
      canRecoverCurrentThread: () => false,
    })

    expect(route).toEqual(
      baseRoute({
        sessionKey: 'agent:main:workspace:channel:c123',
      }),
    )
  })

  it('can carry a delivery thread without adding a session suffix', () => {
    const route = buildThreadAwareOutboundSessionRoute({
      route: baseRoute(),
      threadId: 'thread-1',
      useSuffix: false,
    })

    expect(route).toEqual(
      baseRoute({
        sessionKey: 'agent:main:workspace:channel:c123',
        threadId: 'thread-1',
      }),
    )
  })

  it('preserves provider-specific thread case when normalizeThreadId is provided', () => {
    const route = buildThreadAwareOutboundSessionRoute({
      route: baseRoute(),
      threadId: '$EventID:Example.Org',
      normalizeThreadId: (id) => id,
    })

    expect(route.sessionKey).toBe(
      'agent:main:workspace:channel:c123:thread:$EventID:Example.Org',
    )
    expect(route.threadId).toBe('$EventID:Example.Org')
  })

  it('returns base route when no thread candidates exist', () => {
    const route = buildThreadAwareOutboundSessionRoute({ route: baseRoute() })
    expect(route.sessionKey).toBe(baseRoute().sessionKey)
    expect(route.threadId).toBeUndefined()
  })
})

describe('recoverCurrentThreadSessionId', () => {
  it('recovers thread id when base session matches', () => {
    const result = recoverCurrentThreadSessionId({
      route: baseRoute(),
      currentSessionKey: 'agent:main:workspace:channel:c123:thread:current-1',
    })
    expect(result).toBe('current-1')
  })

  it('returns undefined when base session does not match', () => {
    const result = recoverCurrentThreadSessionId({
      route: baseRoute(),
      currentSessionKey: 'agent:main:workspace:channel:other:thread:current-1',
    })
    expect(result).toBeUndefined()
  })

  it('returns undefined when currentSessionKey has no thread suffix', () => {
    const result = recoverCurrentThreadSessionId({
      route: baseRoute(),
      currentSessionKey: 'agent:main:workspace:channel:c123',
    })
    expect(result).toBeUndefined()
  })

  it('returns undefined when currentSessionKey is null', () => {
    const result = recoverCurrentThreadSessionId({
      route: baseRoute(),
      currentSessionKey: null,
    })
    expect(result).toBeUndefined()
  })

  it('respects canRecover veto', () => {
    const result = recoverCurrentThreadSessionId({
      route: baseRoute(),
      currentSessionKey: 'agent:main:workspace:channel:c123:thread:current-1',
      canRecover: () => false,
    })
    expect(result).toBeUndefined()
  })

  it('passes recovery context to canRecover', () => {
    let capturedContext: unknown
    recoverCurrentThreadSessionId({
      route: baseRoute(),
      currentSessionKey: 'agent:main:workspace:channel:c123:thread:t1',
      canRecover: (ctx) => {
        capturedContext = ctx
        return true
      },
    })
    expect(capturedContext).toMatchObject({
      currentBaseSessionKey: 'agent:main:workspace:channel:c123',
      currentThreadId: 't1',
    })
  })
})

describe('stripChannelTargetPrefix', () => {
  it('strips matching provider prefix', () => {
    expect(stripChannelTargetPrefix('telegram:user-123', 'telegram')).toBe('user-123')
  })

  it('strips prefix case-insensitively', () => {
    expect(stripChannelTargetPrefix('Telegram:user-123', 'telegram')).toBe('user-123')
  })

  it('returns original when no prefix matches', () => {
    expect(stripChannelTargetPrefix('user-123', 'telegram')).toBe('user-123')
  })

  it('strips first matching provider from multiple', () => {
    expect(stripChannelTargetPrefix('tg:user-1', 'telegram', 'tg')).toBe('user-1')
  })

  it('trims whitespace', () => {
    expect(stripChannelTargetPrefix('  telegram:user-1  ', 'telegram')).toBe('user-1')
  })
})

describe('stripTargetKindPrefix', () => {
  it('strips user: prefix', () => {
    expect(stripTargetKindPrefix('user:123')).toBe('123')
  })

  it('strips group: prefix', () => {
    expect(stripTargetKindPrefix('group:abc')).toBe('abc')
  })

  it('strips channel: prefix', () => {
    expect(stripTargetKindPrefix('channel:xyz')).toBe('xyz')
  })

  it('strips dm: prefix', () => {
    expect(stripTargetKindPrefix('dm:user-1')).toBe('user-1')
  })

  it('strips prefix case-insensitively', () => {
    expect(stripTargetKindPrefix('User:123')).toBe('123')
  })

  it('returns original when no kind prefix', () => {
    expect(stripTargetKindPrefix('user-123')).toBe('user-123')
  })
})
