// Adapted from referensi/openclaw/src/hooks/handler.test.ts
import { describe, expect, test } from 'bun:test'
import { executeHook } from './handler.js'

describe('executeHook', () => {
  test('returns handled status when handler returns handled: true', async () => {
    const hook = {
      id: 'h1',
      events: ['e1'],
      handler: () => ({ handled: true }),
    }
    const result = await executeHook(hook, { type: 'e1', payload: {} })
    expect(result.status).toBe('handled')
    expect(result.hook_id).toBe('h1')
  })

  test('returns ignored status when handler returns handled: false', async () => {
    const hook = {
      id: 'h1',
      events: ['e1'],
      handler: () => ({ handled: false }),
    }
    const result = await executeHook(hook, { type: 'e1', payload: {} })
    expect(result.status).toBe('ignored')
  })

  test('returns failed status when handler throws', async () => {
    const hook = {
      id: 'h1',
      events: ['e1'],
      handler: () => { throw new Error('boom') },
    }
    const result = await executeHook(hook, { type: 'e1', payload: {} })
    expect(result.status).toBe('failed')
    expect(result.error).toBe('boom')
  })
})
