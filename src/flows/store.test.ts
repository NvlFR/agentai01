// Adapted from referensi/openclaw/src/flows/store.test.ts
import { describe, expect, test } from 'bun:test'
import { InMemoryFlowStateStore } from './store.js'

describe('InMemoryFlowStateStore', () => {
  test('persists and loads state', () => {
    const store = new InMemoryFlowStateStore()
    const state = { flow_id: 'f1', status: 'running' as const, state: { x: 1 }, steps: [] }
    store.save(state)
    expect(store.load('f1')).toEqual(state)
    expect(store.load('unknown')).toBeUndefined()
  })
})
