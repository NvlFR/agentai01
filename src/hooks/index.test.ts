import { describe, expect, test } from 'bun:test'
import { createHookRegistry } from './index.js'

describe('hooks', () => {
  test('isolates hook failures and keeps audit records', async () => {
    const registry = createHookRegistry()
    registry.register({
      id: 'ok',
      events: ['message.inbound'],
      handler: () => ({ handled: true }),
    })
    registry.register({
      id: 'bad',
      events: ['message.inbound'],
      handler: () => {
        throw new Error('bad hook')
      },
    })

    const records = await registry.handleInbound({ type: 'message.inbound', payload: { text: 'hi' } })

    expect(records.map(record => record.status).sort()).toEqual(['failed', 'handled'])
    expect(registry.auditEvents().some(event => event.event_type === 'hook.executed')).toBe(true)
  })
})
