import { describe, expect, it } from 'bun:test'

import { SchedulerRegistry } from './registry.js'

describe('SchedulerRegistry', () => {
  it('registers Croner-backed jobs by default and runs them manually for tests', async () => {
    const registry = new SchedulerRegistry()
    let runs = 0

    registry.register({
      id: 'heartbeat',
      schedule: '*/5 * * * * *',
      run: () => {
        runs += 1
      },
    })

    expect(registry.list()).toEqual([
      {
        id: 'heartbeat',
        engine: 'croner',
        schedule: '*/5 * * * * *',
        running: false,
      },
    ])

    await registry.runNow('heartbeat')
    expect(runs).toBe(1)
  })

  it('tracks compatibility cron jobs explicitly', () => {
    const registry = new SchedulerRegistry()

    registry.register({
      id: 'legacy-nightly',
      schedule: '0 0 * * *',
      engine: 'cron',
      run: () => undefined,
    })

    expect(registry.list()[0]).toMatchObject({
      id: 'legacy-nightly',
      engine: 'cron',
    })
  })
})
