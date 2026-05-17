import { afterEach, describe, expect, it } from 'bun:test'

import {
  DEFAULT_TELEGRAM_ERROR_COOLDOWN_MS,
  buildTelegramErrorScopeKey,
  isSilentErrorPolicy,
  resetTelegramErrorPolicyStoreForTest,
  resolveTelegramErrorPolicy,
  shouldSuppressTelegramError,
} from './error-policy.js'

describe('src/channels/telegram/error-policy.ts', () => {
  afterEach(() => {
    resetTelegramErrorPolicyStoreForTest()
  })

  it('resolves policy and cooldown from the most specific scope', () => {
    expect(
      resolveTelegramErrorPolicy({
        accountConfig: { errorPolicy: 'once', errorCooldownMs: 1_000 },
        chatConfig: { errorCooldownMs: 2_000 },
        threadConfig: { errorPolicy: 'silent' },
      }),
    ).toEqual({
      policy: 'silent',
      cooldownMs: 2_000,
    })
  })

  it('uses the default cooldown when no override is configured', () => {
    expect(resolveTelegramErrorPolicy({})).toEqual({
      policy: 'always',
      cooldownMs: DEFAULT_TELEGRAM_ERROR_COOLDOWN_MS,
    })
  })

  it('builds scope keys per account chat and thread', () => {
    expect(
      buildTelegramErrorScopeKey({
        accountId: 'main',
        chatId: '-100',
        threadId: 42,
      }),
    ).toBe('main:-100:42')
  })

  it('suppresses duplicate errors within the same scope and message cooldown window', () => {
    const scopeKey = buildTelegramErrorScopeKey({
      accountId: 'main',
      chatId: '-100',
      threadId: 42,
    })

    expect(
      shouldSuppressTelegramError({
        scopeKey,
        cooldownMs: 1_000,
        errorMessage: 'timeout',
        now: 1_000,
      }),
    ).toBe(false)
    expect(
      shouldSuppressTelegramError({
        scopeKey,
        cooldownMs: 1_000,
        errorMessage: 'timeout',
        now: 1_500,
      }),
    ).toBe(true)
  })

  it('tracks cooldown separately for different messages and threads', () => {
    const mainThread = buildTelegramErrorScopeKey({
      accountId: 'main',
      chatId: '-100',
    })
    const topicThread = buildTelegramErrorScopeKey({
      accountId: 'main',
      chatId: '-100',
      threadId: 42,
    })

    expect(
      shouldSuppressTelegramError({
        scopeKey: mainThread,
        cooldownMs: 1_000,
        errorMessage: 'timeout',
        now: 1_000,
      }),
    ).toBe(false)
    expect(
      shouldSuppressTelegramError({
        scopeKey: mainThread,
        cooldownMs: 1_000,
        errorMessage: 'forbidden',
        now: 1_100,
      }),
    ).toBe(false)
    expect(
      shouldSuppressTelegramError({
        scopeKey: topicThread,
        cooldownMs: 1_000,
        errorMessage: 'timeout',
        now: 1_100,
      }),
    ).toBe(false)
  })

  it('prunes expired cooldown entries', () => {
    const scopeKey = buildTelegramErrorScopeKey({
      accountId: 'main',
      chatId: '-100',
    })

    expect(
      shouldSuppressTelegramError({
        scopeKey,
        cooldownMs: 1_000,
        errorMessage: 'timeout',
        now: 1_000,
      }),
    ).toBe(false)
    expect(
      shouldSuppressTelegramError({
        scopeKey,
        cooldownMs: 1_000,
        errorMessage: 'timeout',
        now: 2_001,
      }),
    ).toBe(false)
  })

  it('detects silent policy', () => {
    expect(isSilentErrorPolicy('silent')).toBe(true)
    expect(isSilentErrorPolicy('always')).toBe(false)
  })
})
