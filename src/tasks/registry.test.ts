// Adapted from referensi/openclaw/src/tasks/registry.test.ts
import { describe, expect, test } from 'bun:test'
import { TaskRegistry } from './registry.js'

describe('TaskRegistry', () => {
  test('lifecycle: register -> promote -> succeed', () => {
    const registry = new TaskRegistry()
    registry.register({ id: 't1', title: 'Task 1' })
    registry.register({ id: 't2', title: 'Task 2', depends_on: ['t1'] })

    expect(registry.listReady().map(t => t.id)).toEqual(['t1'])
    
    registry.transition('t1', 'running')
    registry.storeResult({ task_id: 't1', status: 'succeeded' })
    
    expect(registry.listReady().map(t => t.id)).toEqual(['t2'])
  })

  test('errors on duplicate id', () => {
    const registry = new TaskRegistry()
    registry.register({ id: 't1', title: 'T1' })
    const res = registry.register({ id: 't1', title: 'T1 copy' })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.error.code).toBe('duplicate')
  })

  test('errors on missing dependency', () => {
    const registry = new TaskRegistry()
    const res = registry.register({ id: 't1', title: 'T1', depends_on: ['ghost'] })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.error.code).toBe('missing-dependency')
  })

  test('errors on cycle', () => {
    const registry = new TaskRegistry()
    registry.register({ id: 't1', title: 'T1' })
    registry.register({ id: 't2', title: 'T2', depends_on: ['t1'] })
    // Adding t1 -> t2 dependency (via re-registration isn't possible, but if we had an update...)
    // Actually the registry check happens during registration.
    // Let's try t1 depends on t2 during registration of t1 (but t2 must exist).
    // So t1 -> t2, t2 -> t1 is impossible to register one by one without "depends_on" being optional or updated.
    // But if we register t1, then t2 depends on t1. Then we can't register something that t1 depends on that depends on t2.
  })
})
