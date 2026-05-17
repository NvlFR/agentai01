// Adapted using referensi/openclaw/src/plugin-state/store.test.ts
import { describe, expect, test } from 'bun:test'
import { InMemoryPluginStateStore, stateKey } from './store.js'

describe('InMemoryPluginStateStore', () => {
  test('save and load with namespaces', () => {
    const store = new InMemoryPluginStateStore()
    const k1 = { plugin_id: 'p1', namespace: 'n1' }
    const k2 = { plugin_id: 'p1', namespace: 'n2' }
    
    store.save(k1, { val: 1 }, 1)
    store.save(k2, { val: 2 }, 1)
    
    const res1 = store.load(k1)
    const res2 = store.load(k2)
    
    expect(res1.ok ? res1.value.state.val : 0).toBe(1)
    expect(res2.ok ? res2.value.state.val : 0).toBe(2)
  })

  test('load returns not-found for unknown key', () => {
    const store = new InMemoryPluginStateStore()
    const res = store.load({ plugin_id: 'ghost' })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.error.code).toBe('not-found')
  })

  test('stateKey generation', () => {
    expect(stateKey({ plugin_id: 'p1' })).toBe('p1:default')
    expect(stateKey({ plugin_id: 'p1', namespace: 'n1' })).toBe('p1:n1')
  })
})
