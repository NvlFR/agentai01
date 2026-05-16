export type CircuitBreakerPolicy = {
  failureThreshold: number
  resetAfterMs: number
}

export type CircuitBreakerState = {
  readonly status: 'closed' | 'open' | 'half_open'
  readonly failures: number
  canAttempt(nowMs?: number): boolean
  recordSuccess(): void
  recordFailure(nowMs?: number): void
}

export class CircuitOpenError extends Error {
  readonly code = 'circuit_open' as const
  readonly retryable = false

  constructor(providerId: string) {
    super(`Provider circuit is open for ${providerId}.`)
    this.name = 'CircuitOpenError'
  }
}

export function createCircuitBreaker(
  policy: CircuitBreakerPolicy,
): CircuitBreakerState {
  let failures = 0
  let openedAtMs: number | null = null

  const readStatus = (nowMs: number): CircuitBreakerState['status'] => {
    if (openedAtMs === null) {
      return 'closed'
    }

    return nowMs - openedAtMs >= policy.resetAfterMs ? 'half_open' : 'open'
  }

  return {
    get status() {
      return readStatus(Date.now())
    },
    get failures() {
      return failures
    },
    canAttempt(nowMs = Date.now()) {
      return readStatus(nowMs) !== 'open'
    },
    recordSuccess() {
      failures = 0
      openedAtMs = null
    },
    recordFailure(nowMs = Date.now()) {
      failures += 1
      if (failures >= policy.failureThreshold) {
        openedAtMs = nowMs
      }
    },
  }
}
