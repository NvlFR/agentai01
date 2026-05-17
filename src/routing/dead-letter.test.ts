// Adapted using referensi/openclaw/src/routing/dead-letter.test.ts
import { describe, expect, test } from 'bun:test'
import { DeadLetterQueue } from './dead-letter.js'

describe('DeadLetterQueue', () => {
  test('pushes and lists messages', () => {
    const queue = new DeadLetterQueue()
    const msg: any = { message: { id: 'm1' }, reason: 'no-route', detail: 'err' }
    queue.push(msg)
    expect(queue.list()).toEqual([msg])
  })
})
