import type { PersistedJobRecord } from '../storage/fileStore.js'

export type RuntimeJobKind =
  | 'message_dispatch'
  | 'handoff_retry'
  | 'approval_followup'
  | 'sla_scan'
  | 'heartbeat_scan'
  | 'report_generate'

export type RuntimeJobStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'retrying'

export type RuntimeJob = PersistedJobRecord & {
  kind: RuntimeJobKind
  status: RuntimeJobStatus
}

export class RuntimeJobQueue {
  private readonly jobs = new Map<string, RuntimeJob>()

  constructor(seed: RuntimeJob[] = []) {
    for (const job of seed) {
      this.jobs.set(job.jobId, { ...job, payload: structuredClone(job.payload) })
    }
  }

  enqueue(input: {
    kind: RuntimeJobKind
    correlationId: string
    payload: Record<string, unknown>
    runAt?: string
    maxAttempts?: number
  }): RuntimeJob {
    const now = new Date().toISOString()
    const job: RuntimeJob = {
      jobId: `job-${this.jobs.size + 1}-${Date.now()}`,
      kind: input.kind,
      status: 'queued',
      attempts: 0,
      maxAttempts: input.maxAttempts ?? 2,
      queuedAt: now,
      updatedAt: now,
      runAt: input.runAt ?? now,
      correlationId: input.correlationId,
      payload: structuredClone(input.payload),
    }
    this.jobs.set(job.jobId, job)
    return cloneJob(job)
  }

  claimRunnable(now = new Date().toISOString()): RuntimeJob | undefined {
    const target = [...this.jobs.values()]
      .filter(job => (job.status === 'queued' || job.status === 'retrying') && job.runAt <= now)
      .sort((left, right) => left.runAt.localeCompare(right.runAt))[0]

    if (!target) {
      return undefined
    }

    target.status = 'running'
    target.updatedAt = now
    target.attempts += 1
    return cloneJob(target)
  }

  markCompleted(jobId: string, now = new Date().toISOString()): RuntimeJob {
    const job = this.requireJob(jobId)
    job.status = 'completed'
    job.updatedAt = now
    return cloneJob(job)
  }

  markFailed(jobId: string, error: string, retryDelayMs = 0, now = new Date().toISOString()): RuntimeJob {
    const job = this.requireJob(jobId)
    job.lastError = error
    job.updatedAt = now
    if (job.attempts < job.maxAttempts) {
      job.status = 'retrying'
      job.runAt = new Date(Date.parse(now) + retryDelayMs).toISOString()
    } else {
      job.status = 'failed'
    }
    return cloneJob(job)
  }

  retry(jobId: string, now = new Date().toISOString()): RuntimeJob {
    const job = this.requireJob(jobId)
    job.status = 'queued'
    job.runAt = now
    job.updatedAt = now
    job.lastError = undefined
    return cloneJob(job)
  }

  requeueInterrupted(now = new Date().toISOString()): RuntimeJob[] {
    const recovered: RuntimeJob[] = []
    for (const job of this.jobs.values()) {
      if (job.status === 'running') {
        job.status = 'retrying'
        job.updatedAt = now
        job.runAt = now
        recovered.push(cloneJob(job))
      }
    }
    return recovered
  }

  list(): RuntimeJob[] {
    return [...this.jobs.values()].map(cloneJob)
  }

  get(jobId: string): RuntimeJob | undefined {
    const job = this.jobs.get(jobId)
    return job ? cloneJob(job) : undefined
  }

  private requireJob(jobId: string): RuntimeJob {
    const job = this.jobs.get(jobId)
    if (!job) {
      throw new Error(`Job not found: ${jobId}`)
    }
    return job
  }
}

function cloneJob(job: RuntimeJob): RuntimeJob {
  return {
    ...job,
    payload: structuredClone(job.payload),
  }
}
