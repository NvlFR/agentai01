import { describe, expect, it } from 'bun:test'
import {
  DEFAULT_HEARTBEAT_SECONDS,
  DEFAULT_RECONNECT_POLICY,
  computeBackoff,
  newConnectionId,
  resolveHeartbeatSeconds,
  resolveReconnectPolicy,
  sleepWithAbort,
} from './reconnect.js'

describe('DEFAULT_RECONNECT_POLICY', () => {
  it('has expected defaults', () => {
    expect(DEFAULT_RECONNECT_POLICY.initialMs).toBe(2_000)
    expect(DEFAULT_RECONNECT_POLICY.maxMs).toBe(30_000)
    expect(DEFAULT_RECONNECT_POLICY.factor).toBe(1.8)
    expect(DEFAULT_RECONNECT_POLICY.jitter).toBe(0.25)
    expect(DEFAULT_RECONNECT_POLICY.maxAttempts).toBe(12)
  })
})

describe('resolveHeartbeatSeconds', () => {
  it('returns default when config is empty', () => {
    expect(resolveHeartbeatSeconds({})).toBe(DEFAULT_HEARTBEAT_SECONDS)
  })

  it('uses config value when positive', () => {
    expect(resolveHeartbeatSeconds({ web: { heartbeatSeconds: 30 } })).toBe(30)
  })

  it('uses override when provided', () => {
    expect(resolveHeartbeatSeconds({ web: { heartbeatSeconds: 30 } }, 45)).toBe(45)
  })

  it('ignores non-positive config value', () => {
    expect(resolveHeartbeatSeconds({ web: { heartbeatSeconds: -1 } })).toBe(DEFAULT_HEARTBEAT_SECONDS)
  })

  it('ignores zero override', () => {
    expect(resolveHeartbeatSeconds({}, 0)).toBe(DEFAULT_HEARTBEAT_SECONDS)
  })
})

describe('resolveReconnectPolicy', () => {
  it('returns defaults when config is empty', () => {
    const result = resolveReconnectPolicy({})
    expect(result.initialMs).toBe(DEFAULT_RECONNECT_POLICY.initialMs)
    expect(result.maxMs).toBe(DEFAULT_RECONNECT_POLICY.maxMs)
    expect(result.factor).toBe(DEFAULT_RECONNECT_POLICY.factor)
    expect(result.jitter).toBe(DEFAULT_RECONNECT_POLICY.jitter)
    expect(result.maxAttempts).toBe(DEFAULT_RECONNECT_POLICY.maxAttempts)
  })

  it('clamps initialMs to minimum 250', () => {
    const result = resolveReconnectPolicy({}, { initialMs: 100 })
    expect(result.initialMs).toBe(250)
  })

  it('clamps maxMs to at least initialMs', () => {
    const result = resolveReconnectPolicy({}, { initialMs: 5_000, maxMs: 1_000 })
    expect(result.maxMs).toBe(result.initialMs)
  })

  it('clamps factor between 1.1 and 10', () => {
    const low = resolveReconnectPolicy({}, { factor: 0.5 })
    expect(low.factor).toBe(1.1)

    const high = resolveReconnectPolicy({}, { factor: 100 })
    expect(high.factor).toBe(10)
  })

  it('clamps jitter between 0 and 1', () => {
    const low = resolveReconnectPolicy({}, { jitter: -0.5 })
    expect(low.jitter).toBe(0)

    const high = resolveReconnectPolicy({}, { jitter: 2 })
    expect(high.jitter).toBe(1)
  })

  it('floors maxAttempts to non-negative integer', () => {
    const result = resolveReconnectPolicy({}, { maxAttempts: -3 })
    expect(result.maxAttempts).toBe(0)

    const fractional = resolveReconnectPolicy({}, { maxAttempts: 5.9 })
    expect(fractional.maxAttempts).toBe(5)
  })

  it('overrides take precedence over config', () => {
    const result = resolveReconnectPolicy(
      { web: { reconnect: { initialMs: 3_000 } } },
      { initialMs: 1_000 },
    )
    expect(result.initialMs).toBe(1_000)
  })

  it('config takes precedence over defaults', () => {
    const result = resolveReconnectPolicy({ web: { reconnect: { maxAttempts: 5 } } })
    expect(result.maxAttempts).toBe(5)
  })
})

describe('computeBackoff', () => {
  it('returns a value >= initialMs for attempt 0', () => {
    const policy = { initialMs: 1_000, maxMs: 30_000, factor: 2, jitter: 0 }
    const delay = computeBackoff(policy, 0)
    expect(delay).toBeGreaterThanOrEqual(1_000)
  })

  it('grows with attempt number', () => {
    const policy = { initialMs: 1_000, maxMs: 30_000, factor: 2, jitter: 0 }
    const d0 = computeBackoff(policy, 0)
    const d1 = computeBackoff(policy, 1)
    const d2 = computeBackoff(policy, 2)
    expect(d1).toBeGreaterThan(d0)
    expect(d2).toBeGreaterThan(d1)
  })

  it('does not exceed maxMs (with jitter=0)', () => {
    const policy = { initialMs: 1_000, maxMs: 5_000, factor: 10, jitter: 0 }
    for (let i = 0; i < 10; i++) {
      expect(computeBackoff(policy, i)).toBeLessThanOrEqual(5_000)
    }
  })
})

describe('sleepWithAbort', () => {
  it('resolves after the given ms', async () => {
    const start = Date.now()
    await sleepWithAbort(20)
    expect(Date.now() - start).toBeGreaterThanOrEqual(15)
  })

  it('rejects immediately when signal is already aborted', async () => {
    const controller = new AbortController()
    controller.abort()
    await expect(sleepWithAbort(1000, controller.signal)).rejects.toThrow()
  })

  it('rejects when signal is aborted during sleep', async () => {
    const controller = new AbortController()
    const promise = sleepWithAbort(5000, controller.signal)
    setTimeout(() => controller.abort(), 10)
    await expect(promise).rejects.toThrow()
  })
})

describe('newConnectionId', () => {
  it('returns a non-empty string', () => {
    expect(typeof newConnectionId()).toBe('string')
    expect(newConnectionId().length).toBeGreaterThan(0)
  })

  it('returns unique values', () => {
    const ids = new Set(Array.from({ length: 10 }, () => newConnectionId()))
    expect(ids.size).toBe(10)
  })
})
