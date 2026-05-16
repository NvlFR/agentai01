import { describe, expect, it } from 'bun:test'

import { createCircuitBreaker } from './circuit-breaker.js'

describe('createCircuitBreaker', () => {
  it('opens after reaching the failure threshold and resets after a half-open success', () => {
    const breaker = createCircuitBreaker({ failureThreshold: 2, resetAfterMs: 100 })
    const openedAt = Date.now()

    breaker.recordFailure(openedAt)
    expect(breaker.status).toBe('closed')
    expect(breaker.canAttempt(openedAt + 10)).toBe(true)

    breaker.recordFailure(openedAt)
    expect(breaker.status).toBe('open')
    expect(breaker.canAttempt(openedAt + 50)).toBe(false)
    expect(breaker.canAttempt(openedAt + 120)).toBe(true)

    breaker.recordSuccess()
    expect(breaker.status).toBe('closed')
    expect(breaker.failures).toBe(0)
  })

  it('reports half-open after the reset window elapses', () => {
    const breaker = createCircuitBreaker({ failureThreshold: 1, resetAfterMs: 25 })
    const openedAt = Date.now() - 50

    breaker.recordFailure(openedAt)

    expect(breaker.status).toBe('half_open')
    expect(breaker.canAttempt(Date.now())).toBe(true)
  })
})
