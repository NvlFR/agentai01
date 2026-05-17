// Adapted using referensi/openclaw/src/flows/engine.test.ts
import { describe, expect, test } from 'bun:test'
import { executeFlow } from './engine.js'

describe('executeFlow', () => {
  test('runs sequential steps', async () => {
    const res = await executeFlow({
      id: 'f1',
      initial_state: { val: '' },
      steps: [
        { id: 's1', title: 't1', run: ({ state }) => ({ val: state.val + 'a' }) },
        { id: 's2', title: 't2', run: ({ state }) => ({ val: state.val + 'b' }) },
      ]
    })
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.value.state.val).toBe('ab')
      expect(res.value.status).toBe('succeeded')
    }
  })

  test('handles failures and recovery', async () => {
    const res = await executeFlow({
      id: 'f1',
      initial_state: { errorHandled: false },
      steps: [
        { 
          id: 's1', 
          title: 't1', 
          run: () => { throw new Error('boom') },
          recover: () => ({ errorHandled: true })
        }
      ]
    })
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.value.state.errorHandled).toBe(true)
  })

  test('fails if step fails without recovery', async () => {
    const res = await executeFlow({
      id: 'f1',
      initial_state: {},
      steps: [{ id: 's1', title: 't1', run: () => { throw new Error('boom') } }]
    })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.error.code).toBe('step_failed')
  })
})
