// Adapted using referensi/openclaw/src/routing/resolve.test.ts
import { describe, expect, test } from 'bun:test'
import { DeadLetterQueue } from './dead-letter.js'
import { resolveRoute, routeOrDeadLetter, validateRoutedMessage } from './resolve.js'

describe('routing logic', () => {
  test('validateRoutedMessage', () => {
    expect(validateRoutedMessage({ id: 'm1', channel: 'c1', body: 'b1' }).ok).toBe(true)
    expect(validateRoutedMessage({ id: '', channel: 'c1', body: 'b1' }).ok).toBe(false)
    expect(validateRoutedMessage({ id: 'm1', channel: ' ', body: 'b1' }).ok).toBe(false)
    expect(validateRoutedMessage({ id: 'm1', channel: 'c1', body: '' }).ok).toBe(false)
  })

  test('resolveRoute matching', () => {
    const table = {
      routes: [{ id: 'r1', agent_type: 'type1', target: { agent_id: 'a1' } }]
    }
    const res = resolveRoute({ id: 'm1', channel: 'c1', body: 'b1', agent_type: 'type1' }, table)
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.value.route.id).toBe('r1')
  })

  test('resolveRoute missing', () => {
    const res = resolveRoute({ id: 'm1', channel: 'c1', body: 'b1', agent_type: 'ghost' }, { routes: [] })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.error.reason).toBe('no-route')
  })

  test('routeOrDeadLetter pushes to queue', () => {
    const queue = new DeadLetterQueue()
    const res = routeOrDeadLetter({ id: 'm1', channel: 'c1', body: 'b1', agent_type: 'ghost' }, { routes: [] }, queue)
    expect(res.ok).toBe(false)
    expect(queue.list()).toHaveLength(1)
  })
})
