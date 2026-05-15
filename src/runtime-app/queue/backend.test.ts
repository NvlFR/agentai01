import { describe, expect, it } from 'bun:test'
import { RuntimeQueueBackend } from './backend.js'
import { InMemoryRuntimeQueueRepository } from './repository.js'

describe('RuntimeQueueBackend', () => {
  it('applies retry policy and lifecycle transitions', async () => {
    const queue = new RuntimeQueueBackend(new InMemoryRuntimeQueueRepository(), {
      max_attempts: 2,
      base_delay_ms: 1_000,
      max_delay_ms: 5_000,
      strategy: 'fixed',
    })

    await queue.enqueue(
      {
        job_id: 'message-1',
        kind: 'message_dispatch',
        payload: {
          message: {
            from: 'sales_agent',
            to: 'product_agent',
            message_type: 'lead_handoff',
            project_id: 'proj-1',
            timestamp: '2026-05-14T09:00:00.000Z',
            payload: { ok: true },
          },
        },
      },
      '2026-05-14T09:00:00.000Z',
    )

    const claimed = await queue.claimNext('worker-a', '2026-05-14T09:00:01.000Z')
    expect(claimed?.status).toBe('running')
    expect(claimed?.attempts).toBe(1)

    const retrying = await queue.fail(
      'message-1',
      'network timeout',
      '2026-05-14T09:00:02.000Z',
    )
    expect(retrying.status).toBe('retrying')
    expect(retrying.retry_at).toBe('2026-05-14T09:00:03.000Z')

    const retryClaim = await queue.claimNext('worker-a', '2026-05-14T09:00:03.000Z')
    expect(retryClaim?.attempts).toBe(2)

    const failed = await queue.fail(
      'message-1',
      'still failing',
      '2026-05-14T09:00:04.000Z',
    )
    expect(failed.status).toBe('failed')
  })

  it('recovers stale running jobs on restart', async () => {
    const queue = new RuntimeQueueBackend(new InMemoryRuntimeQueueRepository())

    await queue.enqueue(
      {
        job_id: 'report-1',
        kind: 'report_generate',
        payload: {
          report_type: 'daily',
        },
      },
      '2026-05-14T09:00:00.000Z',
    )

    await queue.claimNext('worker-a', '2026-05-14T09:00:00.000Z')
    const recovery = await queue.recoverInterruptedJobs(
      60_000,
      '2026-05-14T09:02:00.000Z',
    )

    expect(recovery.recovered_to_retrying).toEqual(['report-1'])
    const recovered = await queue.getJob('report-1')
    expect(recovered?.status).toBe('retrying')
  })
})
