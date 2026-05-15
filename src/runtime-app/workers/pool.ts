import type {
  QueueObservabilitySnapshot,
  RuntimeJobHandler,
  RuntimeJobKind,
  WorkerSnapshot,
} from '../queue/models.js'
import type { RuntimeQueueBackend } from '../queue/backend.js'
import type { RuntimeQueueRepository } from '../queue/repository.js'

export type WorkerPoolOptions = {
  worker_ids: string[]
  stale_after_ms?: number
}

export class RuntimeWorkerPool {
  private readonly handlers = new Map<RuntimeJobKind, RuntimeJobHandler>()
  private readonly workerState = new Map<string, WorkerSnapshot>()
  private readonly staleAfterMs: number

  constructor(
    private readonly queue: RuntimeQueueBackend,
    private readonly repository: RuntimeQueueRepository,
    options: WorkerPoolOptions,
  ) {
    this.staleAfterMs = options.stale_after_ms ?? 90_000

    for (const workerId of options.worker_ids) {
      this.workerState.set(workerId, {
        worker_id: workerId,
        status: 'idle',
        last_heartbeat_at: new Date(0).toISOString(),
        processed_jobs: 0,
        failed_jobs: 0,
      })
    }
  }

  registerHandler<K extends RuntimeJobKind>(kind: K, handler: RuntimeJobHandler<K>): void {
    this.handlers.set(kind, handler as RuntimeJobHandler)
  }

  async runCycle(now = new Date().toISOString()): Promise<void> {
    for (const workerId of this.workerState.keys()) {
      await this.runWorkerCycle(workerId, now)
    }
  }

  async recordHeartbeat(workerId: string, now = new Date().toISOString()): Promise<void> {
    const snapshot = this.mustGetWorker(workerId)
    const next: WorkerSnapshot = {
      ...snapshot,
      last_heartbeat_at: now,
    }

    this.workerState.set(workerId, next)
    await this.repository.saveWorker(next)
  }

  async monitorHeartbeats(now = new Date().toISOString()): Promise<string[]> {
    const staleWorkers: string[] = []

    for (const [workerId, worker] of this.workerState.entries()) {
      const isStale =
        Date.parse(now) - Date.parse(worker.last_heartbeat_at) > this.staleAfterMs

      const status = isStale && worker.status !== 'busy' ? 'offline' : worker.status
      const next = status === worker.status ? worker : { ...worker, status }
      this.workerState.set(workerId, next)
      await this.repository.saveWorker(next)

      if (isStale) {
        staleWorkers.push(workerId)
      }
    }

    return staleWorkers
  }

  async buildObservabilitySnapshot(
    generatedAt = new Date().toISOString(),
  ): Promise<QueueObservabilitySnapshot> {
    const metrics = await this.queue.getMetrics()
    const workers = await this.repository.listWorkers()
    const staleWorkers = workers
      .filter(worker => Date.parse(generatedAt) - Date.parse(worker.last_heartbeat_at) > this.staleAfterMs)
      .map(worker => worker.worker_id)

    return {
      generated_at: generatedAt,
      metrics,
      workers,
      stale_workers: staleWorkers,
      failed_job_ids: await this.queue.summarizeFailedJobIds(),
    }
  }

  private async runWorkerCycle(workerId: string, now: string): Promise<void> {
    const current = this.mustGetWorker(workerId)
    const ready: WorkerSnapshot = {
      ...current,
      status: 'idle',
      current_job_id: undefined,
      last_heartbeat_at: now,
    }

    this.workerState.set(workerId, ready)
    await this.repository.saveWorker(ready)

    const job = await this.queue.claimNext(workerId, now)
    if (!job) {
      return
    }

    const handler = this.handlers.get(job.kind)
    if (!handler) {
      await this.failWorkerJob(
        workerId,
        job.job_id,
        `No handler registered for ${job.kind}`,
        now,
      )
      return
    }

    const busy: WorkerSnapshot = {
      ...ready,
      status: 'busy',
      current_job_id: job.job_id,
      last_heartbeat_at: now,
    }

    this.workerState.set(workerId, busy)
    await this.repository.saveWorker(busy)

    try {
      const result = await handler(job)
      await this.queue.complete(job.job_id, now, result.notes)
      const idle: WorkerSnapshot = {
        ...busy,
        status: 'idle',
        current_job_id: undefined,
        processed_jobs: busy.processed_jobs + 1,
        last_heartbeat_at: now,
        last_error: undefined,
      }

      this.workerState.set(workerId, idle)
      await this.repository.saveWorker(idle)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      await this.failWorkerJob(workerId, job.job_id, message, now)
    }
  }

  private async failWorkerJob(
    workerId: string,
    jobId: string,
    error: string,
    now: string,
  ): Promise<void> {
    await this.queue.fail(jobId, error, now)
    const worker = this.mustGetWorker(workerId)
    const next: WorkerSnapshot = {
      ...worker,
      status: 'error',
      current_job_id: undefined,
      failed_jobs: worker.failed_jobs + 1,
      last_error: error,
      last_heartbeat_at: now,
    }

    this.workerState.set(workerId, next)
    await this.repository.saveWorker(next)
  }

  private mustGetWorker(workerId: string): WorkerSnapshot {
    const worker = this.workerState.get(workerId)
    if (!worker) {
      throw new Error(`Unknown worker ${workerId}`)
    }

    return worker
  }
}
