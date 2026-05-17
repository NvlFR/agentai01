// src/runtime-app/diagnostics/health.test.ts

import { describe, it, expect } from 'bun:test'
import { createHealthState } from './health.js'

describe('createHealthState', () => {
  it('starts not ready with default reason', () => {
    const h = createHealthState()
    expect(h.isReady()).toBe(false)
    expect(h.getStatus().ready).toBe(false)
    expect(h.getStatus().reason).toBeDefined()
  })

  it('setReady(true) marks ready and clears reason', () => {
    const h = createHealthState()
    h.setReady(true)
    expect(h.isReady()).toBe(true)
    expect(h.getStatus().ready).toBe(true)
    expect(h.getStatus().reason).toBeUndefined()
  })

  it('setReady(false, reason) marks not ready with reason', () => {
    const h = createHealthState()
    h.setReady(true)
    h.setReady(false, 'AI_API_KEY missing')
    expect(h.isReady()).toBe(false)
    expect(h.getStatus().reason).toBe('AI_API_KEY missing')
  })

  it('setReady(false) without reason uses default', () => {
    const h = createHealthState()
    h.setReady(false)
    expect(h.getStatus().reason).toBe('not ready')
  })

  it('getStatus returns a copy, not reference', () => {
    const h = createHealthState()
    const s1 = h.getStatus()
    h.setReady(true)
    const s2 = h.getStatus()
    expect(s1.ready).toBe(false)
    expect(s2.ready).toBe(true)
  })

  it('can toggle ready state multiple times', () => {
    const h = createHealthState()
    h.setReady(true)
    expect(h.isReady()).toBe(true)
    h.setReady(false, 'degraded')
    expect(h.isReady()).toBe(false)
    h.setReady(true)
    expect(h.isReady()).toBe(true)
  })
})
