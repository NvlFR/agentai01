// Adapted using referensi/openclaw/src/tasks/transitions.test.ts
import { describe, expect, test } from 'bun:test'
import { canTransition } from './transitions.js'

describe('canTransition', () => {
  test('allowed transitions', () => {
    expect(canTransition('pending', 'ready')).toBe(true)
    expect(canTransition('ready', 'running')).toBe(true)
    expect(canTransition('running', 'succeeded')).toBe(true)
    expect(canTransition('failed', 'ready')).toBe(true)
  })

  test('disallowed transitions', () => {
    expect(canTransition('succeeded', 'running')).toBe(false)
    expect(canTransition('cancelled', 'pending')).toBe(false)
  })
})
