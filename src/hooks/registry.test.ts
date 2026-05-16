// Adapted from referensi/openclaw/src/hooks/registry.test.ts
import { describe, expect, test } from 'bun:test'
import { createHookRegistry } from './registry.js'

describe('createHookRegistry', () => {
  test('register and deregister hooks', () => {
    const registry = createHookRegistry()
    registry.register({ id: 'h1', events: ['e1'], handler: () => ({ handled: true }) })
    
    expect(registry.auditEvents().some(e => e.event_type === 'hook.registered' && e.actor === 'h1')).toBe(true)
    
    expect(registry.deregister('h1')).toBe(true)
    expect(registry.deregister('h1')).toBe(false)
    expect(registry.auditEvents().some(e => e.event_type === 'hook.deregistered' && e.actor === 'h1')).toBe(true)
  })

  test('handleInbound executes matching hooks and logs audit', async () => {
    const registry = createHookRegistry()
    let called = false
    registry.register({
      id: 'h1',
      events: ['e1'],
      handler: () => { called = true; return { handled: true } }
    })
    registry.register({
      id: 'h2',
      events: ['e2'],
      handler: () => ({ handled: true })
    })

    const results = await registry.handleInbound({ type: 'e1', payload: {} })
    expect(results).toHaveLength(1)
    expect(results[0].hook_id).toBe('h1')
    expect(called).toBe(true)
    
    expect(registry.auditEvents().some(e => e.event_type === 'hook.executed' && e.actor === 'h1')).toBe(true)
  })
})
