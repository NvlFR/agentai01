import { describe, expect, it } from 'bun:test'

import { createConcurrencyLimiter } from './concurrencyLimiter.js'

describe('concurrencyLimiter', () => {
  it('runs queued work through p-queue', async () => {
    const limiter = createConcurrencyLimiter({
      concurrency: 1,
    })
    const events: string[] = []

    const first = limiter.add(async () => {
      events.push('first:start')
      await Bun.sleep(5)
      events.push('first:end')
      return 'first'
    })
    const second = limiter.add(async () => {
      events.push('second:start')
      events.push('second:end')
      return 'second'
    })

    expect(await first).toBe('first')
    expect(await second).toBe('second')
    await limiter.onIdle()
    expect(events).toEqual(['first:start', 'first:end', 'second:start', 'second:end'])
  })
})
