import { describe, expect, it } from 'bun:test'

import { calculateRetryDelayMs, normalizeRetry } from './retry.js'

describe('retry helpers', () => {
  it('normalizes invalid retry configuration to safe minimums', () => {
    expect(
      normalizeRetry({
        maxAttempts: 0,
        baseDelayMs: -10,
      }),
    ).toEqual({
      maxAttempts: 1,
      baseDelayMs: 0,
    })
  })

  it('calculates exponential retry delay with cap and jitter', () => {
    expect(
      calculateRetryDelayMs(
        { maxAttempts: 5, baseDelayMs: 100, maxDelayMs: 250, jitterMs: 20 },
        1,
      ),
    ).toBe(120)

    expect(
      calculateRetryDelayMs(
        { maxAttempts: 5, baseDelayMs: 100, maxDelayMs: 250, jitterMs: 20 },
        3,
      ),
    ).toBe(270)
  })
})
