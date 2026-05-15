import type { Agent_Message } from '../../domain/types.js'

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

export type RetryStrategy = 'fixed' | 'exponential'

export type RetryPolicy = {
  max_attempts: number
  base_delay_ms: number
  max_delay_ms: number
  strategy: RetryStrategy
}

export type RuntimeJobPayloadMap = {
  message_dispatch: {
    message: Agent_Message<unknown>
    correlation_id?: string
  }
  handoff_retry: {
    handoff_id: string
    project_id: string
    attempt_reason: 'timeout' | 'manual_retry' | 'recovery'
  }
  approval_followup: {
    request_id: string
    project_id?: string
    gate: string
    overdue_by_minutes?: number
  }
  sla_scan: {
    scope: 'global' | 'project'
    project_id?: string
  }
  heartbeat_scan: {
    stale_after_seconds: number
  }
  report_generate: {
    report_type: 'daily' | 'weekly' | 'project' | 'agent' | 'kpi'
    project_id?: string
    requested_by?: string
    period_label?: string
  }
}

export type RuntimeJobMetadata = {
  correlation_id?: string
  created_by?: string
  project_id?: string
  worker_notes?: string[]
}

export type RuntimeJob<K extends RuntimeJobKind = RuntimeJobKind> = {
  job_id: string
  kind: K
  status: RuntimeJobStatus
  payload: RuntimeJobPayloadMap[K]
  metadata: RuntimeJobMetadata
  attempts: number
  max_attempts: number
  created_at: string
  updated_at: string
  available_at: string
  started_at?: string
  completed_at?: string
  failed_at?: string
  last_error?: string
  claimed_by?: string
  heartbeat_at?: string
  retry_at?: string
}

export type JobExecutionResult = {
  outcome: 'completed'
  notes?: string[]
}

export type RuntimeQueueMetrics = {
  total_jobs: number
  queued_jobs: number
  running_jobs: number
  retrying_jobs: number
  completed_jobs: number
  failed_jobs: number
  queue_depth_by_kind: Record<RuntimeJobKind, number>
}

export type WorkerStatus = 'idle' | 'busy' | 'offline' | 'error' | 'recovering'

export type WorkerSnapshot = {
  worker_id: string
  status: WorkerStatus
  last_heartbeat_at: string
  current_job_id?: string
  processed_jobs: number
  failed_jobs: number
  last_error?: string
}

export type QueueObservabilitySnapshot = {
  generated_at: string
  metrics: RuntimeQueueMetrics
  workers: WorkerSnapshot[]
  stale_workers: string[]
  failed_job_ids: string[]
}

export type RecoveryResult = {
  recovered_to_retrying: string[]
  marked_failed: string[]
}

export type RuntimeJobInput<K extends RuntimeJobKind = RuntimeJobKind> = {
  job_id: string
  kind: K
  payload: RuntimeJobPayloadMap[K]
  metadata?: RuntimeJobMetadata
  available_at?: string
  max_attempts?: number
}

export type RuntimeJobHandler<K extends RuntimeJobKind = RuntimeJobKind> = (
  job: RuntimeJob<K>,
) => Promise<JobExecutionResult> | JobExecutionResult

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  max_attempts: 3,
  base_delay_ms: 30_000,
  max_delay_ms: 15 * 60_000,
  strategy: 'exponential',
}

export const RUNTIME_JOB_KINDS: readonly RuntimeJobKind[] = [
  'message_dispatch',
  'handoff_retry',
  'approval_followup',
  'sla_scan',
  'heartbeat_scan',
  'report_generate',
] as const

export function createRuntimeJob<K extends RuntimeJobKind>(
  input: RuntimeJobInput<K>,
  now: string,
  retryPolicy: RetryPolicy = DEFAULT_RETRY_POLICY,
): RuntimeJob<K> {
  return {
    job_id: input.job_id,
    kind: input.kind,
    status: 'queued',
    payload: input.payload,
    metadata: { ...(input.metadata ?? {}) },
    attempts: 0,
    max_attempts: input.max_attempts ?? retryPolicy.max_attempts,
    created_at: now,
    updated_at: now,
    available_at: input.available_at ?? now,
  }
}

export function createEmptyQueueMetrics(): RuntimeQueueMetrics {
  return {
    total_jobs: 0,
    queued_jobs: 0,
    running_jobs: 0,
    retrying_jobs: 0,
    completed_jobs: 0,
    failed_jobs: 0,
    queue_depth_by_kind: {
      message_dispatch: 0,
      handoff_retry: 0,
      approval_followup: 0,
      sla_scan: 0,
      heartbeat_scan: 0,
      report_generate: 0,
    },
  }
}
