import { describe, expect, it } from 'bun:test'

import { atomicWrite, createTempDirectory, readFileSafe, resolveInside } from './index.js'

describe('infra barrel', () => {
  it('re-exports public runtime helpers', () => {
    expect(typeof atomicWrite).toBe('function')
    expect(typeof createTempDirectory).toBe('function')
    expect(typeof readFileSafe).toBe('function')
    expect(typeof resolveInside).toBe('function')
  })
})
