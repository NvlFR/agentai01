import type { Approval_Response } from '../../domain/types.js'
import type { CeoRuntime } from '../../agents/ceo/runtime.js'
import type { OrchestratorShell } from '../../runtime/orchestrator.js'
import {
  HttpError,
  getCorrelationId,
  getUrlPath,
  jsonErrorResponse,
  jsonResponse,
  matchRoute,
  readJsonBody,
} from '../http/index.js'
import {
  readOperatorIdentity,
  requireAuthenticatedOperator,
  type OperatorAuthConfig,
  type OperatorIdentity,
} from '../auth/index.js'

export type OperatorApiListenOptions = {
  port?: number
  hostname?: string
  development?: boolean
  reusePort?: boolean
  idleTimeout?: number
}

type OwnerDirectiveRequestBody = {
  raw_input?: unknown
  mode?: unknown
}

type ApprovalResponseRequestBody = {
  gate?: unknown
  decision?: unknown
  notes?: unknown
  timestamp?: unknown
}

type RuntimeJobOperation =
  | {
      kind: 'owner_directive'
      raw_input: string
      mode: 'structured' | 'natural'
      actor: OperatorIdentity
    }
  | {
      kind: 'approval_response'
      response: Approval_Response
    }

export type RuntimeJobStatus = 'running' | 'completed' | 'failed'

export type RuntimeJobRecord = {
  job_id: string
  kind: RuntimeJobOperation['kind']
  status: RuntimeJobStatus
  attempts: number
  created_at: string
  updated_at: string
  operation: RuntimeJobOperation
  result?: unknown
  last_error?: {
    message: string
  }
}

export type OperatorApiServerOptions = {
  shell: OrchestratorShell
  ceoRuntime: CeoRuntime
  auth?: OperatorAuthConfig
  now?: () => string
  onApprovalResponse?: (response: Approval_Response) => void | Promise<void>
}

export class OperatorApiServer {
  private readonly jobs: RuntimeJobRecord[] = []
  private readonly shell: OrchestratorShell
  private readonly ceoRuntime: CeoRuntime
  private readonly authConfig: OperatorAuthConfig
  private readonly now: () => string
  private readonly onApprovalResponse?: (response: Approval_Response) => void | Promise<void>

  constructor(options: OperatorApiServerOptions) {
    this.shell = options.shell
    this.ceoRuntime = options.ceoRuntime
    this.authConfig = options.auth ?? {}
    this.now = options.now ?? (() => new Date().toISOString())
    this.onApprovalResponse = options.onApprovalResponse
  }

  async fetch(request: Request): Promise<Response> {
    const correlationId = getCorrelationId(request)

    try {
      const pathname = getUrlPath(request)
      const method = request.method.toUpperCase()

      if (method === 'GET' && pathname === '/health') {
        return jsonResponse(correlationId, this.getHealthPayload())
      }

      if (method === 'GET' && pathname === '/ready') {
        return jsonResponse(correlationId, this.getReadinessPayload())
      }

      if (method === 'GET' && pathname === '/dashboard') {
        return jsonResponse(correlationId, this.shell.readDashboard(this.now()))
      }

      if (method === 'GET' && pathname === '/agents') {
        return jsonResponse(correlationId, { items: this.shell.buildSnapshot(this.now()).agents })
      }

      if (method === 'GET' && pathname === '/projects') {
        return jsonResponse(correlationId, { items: this.shell.buildSnapshot(this.now()).projects })
      }

      if (method === 'GET' && pathname === '/approvals') {
        return jsonResponse(correlationId, {
          items: this.shell.buildSnapshot(this.now()).pending_approvals,
        })
      }

      if (method === 'GET' && pathname === '/messages') {
        return jsonResponse(correlationId, {
          items: this.shell.app.getRegistry().getCommunicationLog(),
        })
      }

      if (method === 'GET' && pathname === '/runtime/jobs') {
        return jsonResponse(correlationId, { items: this.listJobs() })
      }

      if (method === 'POST' && pathname === '/directives/owner') {
        const identity = readOperatorIdentity(request, this.authConfig)
        requireAuthenticatedOperator(identity)

        const body = this.parseOwnerDirectiveBody(await readJsonBody(request))
        const job = await this.executeJob({
          kind: 'owner_directive',
          raw_input: body.raw_input,
          mode: body.mode,
          actor: identity,
        })

        return jsonResponse(correlationId, { job }, { status: 202 })
      }

      const approvalMatch = matchRoute(pathname, '/approvals/:requestId/response')
      if (method === 'POST' && approvalMatch) {
        const identity = readOperatorIdentity(request, this.authConfig)
        requireAuthenticatedOperator(identity)
        this.assertOwnerAuthorized(identity)

        const pending = this.shell
          .buildSnapshot(this.now())
          .pending_approvals
          .find(item => item.request_id === approvalMatch.params['requestId'])
        if (!pending) {
          throw new HttpError(404, 'not_found', `Approval request not found: ${approvalMatch.params['requestId']}`)
        }

        const body = this.parseApprovalResponseBody(
          approvalMatch.params['requestId'],
          await readJsonBody(request),
        )
        if (body.gate !== pending.gate) {
          throw new HttpError(400, 'bad_request', 'Approval gate does not match pending request.', {
            expected_gate: pending.gate,
            received_gate: body.gate,
          })
        }

        const job = await this.executeJob({
          kind: 'approval_response',
          response: {
            request_id: approvalMatch.params['requestId'],
            gate: body.gate,
            decision: body.decision,
            notes: body.notes,
            timestamp: body.timestamp ?? this.now(),
          },
        })

        return jsonResponse(correlationId, { job }, { status: 202 })
      }

      const retryMatch = matchRoute(pathname, '/runtime/jobs/:jobId/retry')
      if (method === 'POST' && retryMatch) {
        const identity = readOperatorIdentity(request, this.authConfig)
        requireAuthenticatedOperator(identity)
        this.assertOwnerAuthorized(identity)

        const job = await this.retryJob(retryMatch.params['jobId'])
        return jsonResponse(correlationId, { job }, { status: 202 })
      }

      throw new HttpError(404, 'not_found', `Route not found: ${method} ${pathname}`)
    } catch (error) {
      if (error instanceof HttpError) {
        return jsonErrorResponse(correlationId, error)
      }

      return jsonErrorResponse(
        correlationId,
        new HttpError(500, 'internal_error', 'Unhandled operator server error.'),
      )
    }
  }

  start(options?: OperatorApiListenOptions): Bun.Server {
    return Bun.serve({
      ...options,
      fetch: (request: Request) => this.fetch(request),
    })
  }

  listJobs(): RuntimeJobRecord[] {
    return this.jobs.map(job => structuredClone(job))
  }

  private getHealthPayload() {
    const snapshot = this.ceoRuntime.getHealthStatus(this.now())
    return {
      ...snapshot,
      shell_status: this.shell.status,
      runtime_jobs: this.summarizeJobs(),
    }
  }

  private getReadinessPayload() {
    const snapshot = this.ceoRuntime.getReadinessStatus(this.now())
    return {
      ...snapshot,
      shell_status: this.shell.status,
      runtime_jobs: this.summarizeJobs(),
    }
  }

  private summarizeJobs() {
    return {
      total: this.jobs.length,
      failed: this.jobs.filter(job => job.status === 'failed').length,
      running: this.jobs.filter(job => job.status === 'running').length,
    }
  }

  private parseOwnerDirectiveBody(body: unknown): {
    raw_input: string
    mode: 'structured' | 'natural'
  } {
    if (typeof body !== 'object' || body === null) {
      throw new HttpError(400, 'bad_request', 'Directive request body must be an object.')
    }

    const typed = body as OwnerDirectiveRequestBody
    if (typeof typed.raw_input !== 'string' || typed.raw_input.trim().length === 0) {
      throw new HttpError(400, 'bad_request', 'raw_input is required.')
    }

    const mode = typed.mode ?? 'natural'
    if (mode !== 'natural' && mode !== 'structured') {
      throw new HttpError(400, 'bad_request', 'mode must be natural or structured.')
    }

    return {
      raw_input: typed.raw_input.trim(),
      mode,
    }
  }

  private parseApprovalResponseBody(
    requestId: string,
    body: unknown,
  ): {
    request_id: string
    gate: Approval_Response['gate']
    decision: Approval_Response['decision']
    notes?: string
    timestamp?: string
  } {
    if (typeof body !== 'object' || body === null) {
      throw new HttpError(400, 'bad_request', 'Approval response body must be an object.')
    }

    const typed = body as ApprovalResponseRequestBody
    if (
      typed.gate !== 'proposal_final' &&
      typed.gate !== 'spec_final' &&
      typed.gate !== 'delivery_final' &&
      typed.gate !== 'strategic_decision'
    ) {
      throw new HttpError(400, 'bad_request', 'gate is invalid.')
    }

    if (
      typed.decision !== 'approve' &&
      typed.decision !== 'reject' &&
      typed.decision !== 'revise'
    ) {
      throw new HttpError(400, 'bad_request', 'decision is invalid.')
    }

    if (typed.notes !== undefined && typeof typed.notes !== 'string') {
      throw new HttpError(400, 'bad_request', 'notes must be a string when provided.')
    }

    if (typed.decision === 'revise' && (!typed.notes || typed.notes.trim().length === 0)) {
      throw new HttpError(400, 'bad_request', 'notes are required when decision is revise.')
    }

    if (typed.timestamp !== undefined && typeof typed.timestamp !== 'string') {
      throw new HttpError(400, 'bad_request', 'timestamp must be a string when provided.')
    }

    return {
      request_id: requestId,
      gate: typed.gate,
      decision: typed.decision,
      notes: typed.notes?.trim() || undefined,
      timestamp: typed.timestamp,
    }
  }

  private assertOwnerAuthorized(identity: OperatorIdentity): void {
    const auth = this.ceoRuntime.validateOwnerIdentity(identity, this.now())
    if (auth.allowed) {
      return
    }

    if (auth.locked_until) {
      throw new HttpError(423, 'locked', auth.reason, {
        locked_until: auth.locked_until,
      })
    }

    throw new HttpError(403, 'forbidden', auth.reason)
  }

  private async retryJob(jobId: string): Promise<RuntimeJobRecord> {
    const job = this.jobs.find(entry => entry.job_id === jobId)
    if (!job) {
      throw new HttpError(404, 'not_found', `Runtime job not found: ${jobId}`)
    }

    if (job.status !== 'failed') {
      throw new HttpError(409, 'conflict', 'Only failed jobs can be retried.')
    }

    return this.runJob(job)
  }

  private async executeJob(operation: RuntimeJobOperation): Promise<RuntimeJobRecord> {
    const now = this.now()
    const job: RuntimeJobRecord = {
      job_id: `job-${Date.parse(now)}-${this.jobs.length + 1}`,
      kind: operation.kind,
      status: 'running',
      attempts: 0,
      created_at: now,
      updated_at: now,
      operation: structuredClone(operation),
    }

    this.jobs.unshift(job)
    return this.runJob(job)
  }

  private async runJob(job: RuntimeJobRecord): Promise<RuntimeJobRecord> {
    const now = this.now()
    job.status = 'running'
    job.attempts += 1
    job.updated_at = now
    job.last_error = undefined

    try {
      job.result = await this.performOperation(job.operation)
      job.status = 'completed'
      job.updated_at = this.now()
      return structuredClone(job)
    } catch (error) {
      job.status = 'failed'
      job.updated_at = this.now()
      job.last_error = {
        message: error instanceof Error ? error.message : 'Unknown runtime job failure.',
      }
      throw new HttpError(500, 'internal_error', 'Runtime job failed.', {
        job: structuredClone(job),
      })
    }
  }

  private async performOperation(operation: RuntimeJobOperation): Promise<unknown> {
    switch (operation.kind) {
      case 'owner_directive':
        return this.ceoRuntime.executeOwnerDirective(
          operation.raw_input,
          operation.actor,
          operation.mode,
          this.now(),
        )
      case 'approval_response':
        this.shell.applyApprovalResponse(operation.response)
        await this.onApprovalResponse?.(operation.response)
        return { response: operation.response }
    }
  }
}

export function createOperatorApiServer(
  options: OperatorApiServerOptions,
): OperatorApiServer {
  return new OperatorApiServer(options)
}
