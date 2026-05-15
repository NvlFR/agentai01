import {
  createEmptyQueueMetrics,
  createRuntimeJob,
  DEFAULT_RETRY_POLICY,
  RUNTIME_JOB_KINDS,
  type RecoveryResult,
  type RetryPolicy,
  type RuntimeJob,
  type RuntimeJobInput,
  type RuntimeJobKind,
  type RuntimeJobStatus,
  type RuntimeQueueMetrics,
} from './models.js'
import type { RuntimeQueueRepository } from './repository.js'

export class RuntimeQueueBackend {
  constructor(
    private readonly repository: RuntimeQueueRepository,
    private readonly retryPolicy: RetryPolicy = DEFAULT_RETRY_POLICY,
  ) {}

  async enqueue<K extends RuntimeJobKind>(
    input: RuntimeJobInput<K>,
    now = new Date().toISOString(),
  ): Promise<RuntimeJob<K>> {
    const existing = await this.repository.getJob(input.job_id)
    if (existing) {
      throw new Error(`Job ${input.job_id} already exists`)
    }

    const job = createRuntimeJob(input, now, this.retryPolicy)
    await this.repository.saveJob(job)
    return job
  }

  async getJob(jobId: string): Promise<RuntimeJob | undefined> {
    return this.repository.getJob(jobId)
  }

  async listJobs(statuses?: RuntimeJobStatus[]): Promise<RuntimeJob[]> {
    return this.repository.listJobs({ statuses })
  }

  async claimNext(workerId: string, now = new Date().toISOString()): Promise<RuntimeJob | undefined> {
    const candidates = await this.repository.listJobs({
      statuses: ['queued', 'retrying'],
      available_before: now,
    })

    const nextJob = candidates[0]
    if (!nextJob) {
      return undefined
    }

    const claimed: RuntimeJob = {
      ...nextJob,
      status: 'running',
      attempts: nextJob.attempts + 1,
      claimed_by: workerId,
      started_at: now,
      heartbeat_at: now,
      updated_at: now,
    }

    await this.repository.saveJob(claimed)
    return claimed
  }

  async heartbeat(jobId: string, timestamp = new Date().toISOString()): Promise<void> {
    const job = await this.mustGetJob(jobId)
    await this.repository.saveJob({
      ...job,
      heartbeat_at: timestamp,
      updated_at: timestamp,
    })
  }

  async complete(jobId: string, now = new Date().toISOString(), notes?: string[]): Promise<RuntimeJob> {
    const job = await this.mustGetJob(jobId)
    const completed: RuntimeJob = {
      ...job,
      status: 'completed',
      completed_at: now,
      updated_at: now,
      metadata: mergeWorkerNotes(job, notes),
    }

    await this.repository.saveJob(completed)
    return completed
  }

  async fail(jobId: string, error: string, now = new Date().toISOString()): Promise<RuntimeJob> {
    const job = await this.mustGetJob(jobId)
    const shouldRetry = job.attempts < job.max_attempts
    const nextStatus: RuntimeJobStatus = shouldRetry ? 'retrying' : 'failed'
    const retryAt = shouldRetry ? computeRetryAt(job, this.retryPolicy, now) : undefined

    const failed: RuntimeJob = {
      ...job,
      status: nextStatus,
      failed_at: shouldRetry ? job.failed_at : now,
      retry_at: retryAt,
      available_at: retryAt ?? job.available_at,
      updated_at: now,
      last_error: error,
      metadata: mergeWorkerNotes(job, [`error:${error}`]),
    }

    await this.repository.saveJob(failed)
    return failed
  }

  async retryFailedJob(jobId: string, now = new Date().toISOString()): Promise<RuntimeJob> {
    const job = await this.mustGetJob(jobId)
    const retried: RuntimeJob = {
      ...job,
      status: 'retrying',
      claimed_by: undefined,
      started_at: undefined,
      heartbeat_at: undefined,
      completed_at: undefined,
      failed_at: undefined,
      retry_at: now,
      available_at: now,
      updated_at: now,
      last_error: undefined,
    }

    await this.repository.saveJob(retried)
    return retried
  }

  async recoverInterruptedJobs(
    staleAfterMs: number,
    now = new Date().toISOString(),
  ): Promise<RecoveryResult> {
    const runningJobs = await this.repository.listJobs({ statuses: ['running'] })
    const recoveredToRetrying: string[] = []
    const markedFailed: string[] = []

    for (const job of runningJobs) {
      const heartbeatAt = job.heartbeat_at ?? job.started_at ?? job.updated_at
      if (Date.parse(now) - Date.parse(heartbeatAt) < staleAfterMs) {
        continue
      }

      const shouldRetry = job.attempts < job.max_attempts
      const recovered: RuntimeJob = {
        ...job,
        status: shouldRetry ? 'retrying' : 'failed',
        claimed_by: undefined,
        updated_at: now,
        retry_at: shouldRetry ? now : undefined,
        available_at: shouldRetry ? now : job.available_at,
        last_error: 'Recovered interrupted job after stale heartbeat',
      }

      await this.repository.saveJob(recovered)

      if (shouldRetry) {
        recoveredToRetrying.push(job.job_id)
      } else {
        markedFailed.push(job.job_id)
      }
    }

    return { recovered_to_retrying: recoveredToRetrying, marked_failed: markedFailed }
  }

  async getMetrics(): Promise<RuntimeQueueMetrics> {
    const jobs = await this.repository.listJobs()
    const metrics = createEmptyQueueMetrics()

    metrics.total_jobs = jobs.length
    for (const job of jobs) {
      metrics.queue_depth_by_kind[job.kind] += job.status === 'queued' || job.status === 'retrying' ? 1 : 0

      if (job.status === 'queued') metrics.queued_jobs += 1
      if (job.status === 'running') metrics.running_jobs += 1
      if (job.status === 'retrying') metrics.retrying_jobs += 1
      if (job.status === 'completed') metrics.completed_jobs += 1
      if (job.status === 'failed') metrics.failed_jobs += 1
    }

    return metrics
  }

  async summarizeFailedJobIds(): Promise<string[]> {
    const jobs = await this.repository.listJobs({ statuses: ['failed'] })
    return jobs.map(job => job.job_id)
  }

  private async mustGetJob(jobId: string): Promise<RuntimeJob> {
    const job = await this.repository.getJob(jobId)
    if (!job) {
      throw new Error(`Job ${jobId} not found`)
    }

    return job
  }
}

function mergeWorkerNotes(job: RuntimeJob, notes?: string[]): RuntimeJob['metadata'] {
  if (!notes?.length) {
    return { ...job.metadata, worker_notes: [...(job.metadata.worker_notes ?? [])] }
  }

  return {
    ...job.metadata,
    worker_notes: [...(job.metadata.worker_notes ?? []), ...notes],
  }
}

function computeRetryAt(job: RuntimeJob, policy: RetryPolicy, now: string): string {
  const exponent = Math.max(job.attempts - 1, 0)
  const rawDelay =
    policy.strategy === 'fixed'
      ? policy.base_delay_ms
      : policy.base_delay_ms * 2 ** exponent
  const delay = Math.min(rawDelay, policy.max_delay_ms)
  return new Date(Date.parse(now) + delay).toISOString()
}

export function createDefaultJobId(kind: RuntimeJobKind, suffix: string): string {
  return `${kind}:${suffix}`
}

export function createQueueDepthTemplate(): Record<RuntimeJobKind, number> {
  return Object.fromEntries(RUNTIME_JOB_KINDS.map(kind => [kind, 0])) as Record<
    RuntimeJobKind,
    number
  >
}
