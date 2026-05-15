import { describe, expect, it } from 'bun:test'
import { RuntimeQueueBackend } from '../queue/backend.js'
import { InMemoryRuntimeQueueRepository } from '../queue/repository.js'
import { RuntimeWorkerPool } from './pool.js'

describe('RuntimeWorkerPool', () => {
  it('processes jobs and exposes observability', async () => {
    const repository = new InMemoryRuntimeQueueRepository()
    const queue = new RuntimeQueueBackend(repository)
    const pool = new RuntimeWorkerPool(queue, repository, {
      worker_ids: ['worker-a', 'worker-b'],
      stale_after_ms: 60_000,
    })

    pool.registerHandler('sla_scan', job => ({
      outcome: 'completed',
      notes: [`scope:${job.payload.scope}`],
    }))

    await queue.enqueue(
      {
        job_id: 'sla-1',
        kind: 'sla_scan',
        payload: {
          scope: 'global',
        },
      },
      '2026-05-14T09:00:00.000Z',
    )

    await pool.runCycle('2026-05-14T09:00:10.000Z')
    const snapshot = await pool.buildObservabilitySnapshot(
      '2026-05-14T09:00:10.000Z',
    )

    expect(snapshot.metrics.completed_jobs).toBe(1)
    expect(snapshot.metrics.queue_depth_by_kind.sla_scan).toBe(0)
    expect(snapshot.workers.some(worker => worker.processed_jobs === 1)).toBe(true)
  })

  it('marks workers stale when heartbeat ages out', async () => {
    const repository = new InMemoryRuntimeQueueRepository()
    const queue = new RuntimeQueueBackend(repository)
    const pool = new RuntimeWorkerPool(queue, repository, {
      worker_ids: ['worker-a'],
      stale_after_ms: 1_000,
    })

    await pool.recordHeartbeat('worker-a', '2026-05-14T09:00:00.000Z')
    const stale = await pool.monitorHeartbeats('2026-05-14T09:00:02.000Z')

    expect(stale).toEqual(['worker-a'])
    const snapshot = await pool.buildObservabilitySnapshot(
      '2026-05-14T09:00:02.000Z',
    )
    expect(snapshot.stale_workers).toEqual(['worker-a'])
  })
})
