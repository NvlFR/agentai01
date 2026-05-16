import { describe, expect, test } from 'bun:test'
import { DeadLetterQueue, routeOrDeadLetter } from './index.js'

describe('routing', () => {
  test('routes by agent type and dead-letters unroutable messages', () => {
    const queue = new DeadLetterQueue()
    const table = {
      routes: [
        {
          id: 'support',
          agent_type: 'support',
          target: { agent_id: 'support-agent', capability: 'answer' },
        },
      ],
    }

    const routed = routeOrDeadLetter({
      id: 'msg-1',
      channel: 'telegram',
      body: 'help',
      agent_type: 'support',
    }, table, queue)
    const missing = routeOrDeadLetter({
      id: 'msg-2',
      channel: 'telegram',
      body: 'sell',
      agent_type: 'sales',
    }, table, queue)

    expect(routed.ok).toBe(true)
    expect(missing.ok).toBe(false)
    expect(queue.list()).toHaveLength(1)
  })
})
