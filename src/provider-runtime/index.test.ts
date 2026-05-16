import { describe, expect, it } from 'bun:test'

import {
  CircuitOpenError,
  ProviderTimeoutError,
  calculateRetryDelayMs,
  checkProviderHealth,
  createCircuitBreaker,
  executeProviderOperation,
  withProviderTimeout,
} from './index.js'

describe('provider-runtime index exports', () => {
  it('re-exports the provider runtime public surface', () => {
    expect(typeof createCircuitBreaker).toBe('function')
    expect(typeof calculateRetryDelayMs).toBe('function')
    expect(typeof withProviderTimeout).toBe('function')
    expect(typeof executeProviderOperation).toBe('function')
    expect(typeof checkProviderHealth).toBe('function')
    expect(CircuitOpenError.name).toBe('CircuitOpenError')
    expect(ProviderTimeoutError.name).toBe('ProviderTimeoutError')
  })
})
