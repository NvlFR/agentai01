import { describe, expect, it } from 'bun:test'

import { parseCronSchedule, runCronJobIsolated, type CronAuditEvent } from './index.js'

describe('cron contracts', () => {
  it('parses supported schedules explicitly', () => {
    expect(parseCronSchedule('every 500ms')).toEqual({
      ok: true,
      value: { kind: 'interval', every_ms: 500 },
    })
    expect(parseCronSchedule('daily 25:00')).toEqual({
      ok: false,
      error: 'Unsupported schedule format',
    })
  })

  it('runs jobs with isolated failure and audit events', async () => {
    const events: CronAuditEvent[] = []
    const result = await runCronJobIsolated(
      {
        id: 'nightly',
        schedule: { kind: 'interval', every_ms: 1 },
        task: () => {
          throw new Error('boom')
        },
      },
      event => events.push(event),
    )

    expect(result.ok).toBe(false)
    expect(events.map(event => event.outcome)).toEqual(['started', 'failed'])
  })
})
