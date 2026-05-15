import type {
  RuntimeJob,
  RuntimeJobStatus,
  WorkerSnapshot,
} from './models.js'

export type RuntimeJobQuery = {
  statuses?: RuntimeJobStatus[]
  available_before?: string
  claimed_by?: string
  limit?: number
}

export interface RuntimeQueueRepository {
  saveJob(job: RuntimeJob): Promise<void> | void
  getJob(jobId: string): Promise<RuntimeJob | undefined> | RuntimeJob | undefined
  listJobs(query?: RuntimeJobQuery): Promise<RuntimeJob[]> | RuntimeJob[]
  saveWorker(worker: WorkerSnapshot): Promise<void> | void
  listWorkers(): Promise<WorkerSnapshot[]> | WorkerSnapshot[]
}

export class InMemoryRuntimeQueueRepository implements RuntimeQueueRepository {
  private readonly jobs = new Map<string, RuntimeJob>()
  private readonly workers = new Map<string, WorkerSnapshot>()

  saveJob(job: RuntimeJob): void {
    this.jobs.set(job.job_id, cloneJob(job))
  }

  getJob(jobId: string): RuntimeJob | undefined {
    const job = this.jobs.get(jobId)
    return job ? cloneJob(job) : undefined
  }

  listJobs(query: RuntimeJobQuery = {}): RuntimeJob[] {
    const statuses = query.statuses ? new Set(query.statuses) : undefined

    return [...this.jobs.values()]
      .filter(job => {
        if (statuses && !statuses.has(job.status)) {
          return false
        }

        if (query.available_before && job.available_at > query.available_before) {
          return false
        }

        if (query.claimed_by && job.claimed_by !== query.claimed_by) {
          return false
        }

        return true
      })
      .sort((left, right) => left.available_at.localeCompare(right.available_at))
      .slice(0, query.limit)
      .map(job => cloneJob(job))
  }

  saveWorker(worker: WorkerSnapshot): void {
    this.workers.set(worker.worker_id, { ...worker })
  }

  listWorkers(): WorkerSnapshot[] {
    return [...this.workers.values()].map(worker => ({ ...worker }))
  }
}

function cloneJob(job: RuntimeJob): RuntimeJob {
  return {
    ...job,
    metadata: {
      ...job.metadata,
      worker_notes: [...(job.metadata.worker_notes ?? [])],
    },
    payload: structuredClone(job.payload),
  }
}
