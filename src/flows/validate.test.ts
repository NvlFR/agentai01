// Adapted from referensi/openclaw/src/flows/validate.test.ts
import { describe, expect, test } from 'bun:test'
import { validateFlowDefinition } from './validate.js'

describe('validateFlowDefinition', () => {
  test('validates basic flow', () => {
    const res = validateFlowDefinition({ id: 'f1', initial_state: {}, steps: [] })
    expect(res.ok).toBe(true)
  })

  test('requires flow id', () => {
    const res = validateFlowDefinition({ id: '', initial_state: {}, steps: [] })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.error.code).toBe('definition_invalid')
  })

  test('requires step ids', () => {
    const res = validateFlowDefinition({ 
      id: 'f1', 
      initial_state: {}, 
      steps: [{ id: '', title: 't', run: () => ({}) }] 
    })
    expect(res.ok).toBe(false)
  })

  test('detects duplicate step ids', () => {
    const res = validateFlowDefinition({ 
      id: 'f1', 
      initial_state: {}, 
      steps: [
        { id: 's1', title: 't1', run: () => ({}) },
        { id: 's1', title: 't2', run: () => ({}) }
      ] 
    })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.error.message).toContain('Duplicate')
  })
})
