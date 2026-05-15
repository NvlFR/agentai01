import { describe, expect, it } from 'bun:test'
import { CeoRuntime } from '../../agents/ceo/runtime.js'
import type { Approval_Response } from '../../domain/types.js'
import { bootOrchestratorShell } from '../../runtime/orchestrator.js'
import { createOperatorApiServer } from './operatorApiServer.js'

function createServer(options?: {
  now?: () => string
  onApprovalResponse?: (response: Approval_Response) => void | Promise<void>
}) {
  const shell = bootOrchestratorShell({
    shell_id: 'shell-1',
    runtime: {
      runtime_id: 'runtime-1',
      mode: 'worker',
      started_at: '2026-05-14T09:00:00Z',
      workers: [
        {
          worker_id: 'worker-sales',
          agent_id: 'sales-1',
          agent_type: 'sales_agent',
          status: 'ready',
          project_id: 'proj-1',
        },
        {
          worker_id: 'worker-product',
          agent_id: 'prod-1',
          agent_type: 'product_agent',
          status: 'ready',
          project_id: 'proj-1',
        },
      ],
    },
    seed: {
      agents: [
        {
          agent_id: 'sales-1',
          agent_type: 'sales_agent',
          status: 'busy',
          current_project_id: 'proj-1',
          last_activity_timestamp: '2026-05-14T09:01:00Z',
        },
        {
          agent_id: 'prod-1',
          agent_type: 'product_agent',
          status: 'busy',
          current_project_id: 'proj-1',
          last_activity_timestamp: '2026-05-14T09:01:05Z',
        },
      ],
      projects: [
        {
          project_id: 'proj-1',
          client_id: 'acme',
          lifecycle_state: 'discovery',
          active_agent_ids: ['sales-1', 'prod-1'],
          current_milestone: 'spec_approval_pending',
          updated_at: '2026-05-14T09:01:30Z',
        },
      ],
      pending_approvals: [
        {
          request_id: 'apr-1',
          gate: 'spec_final',
          from_agent: 'product_agent',
          timestamp: '2026-05-14T09:02:00Z',
          project_id: 'proj-1',
          summary: 'Spec ready for owner review',
          recommendation: 'Approve spec',
          risks: ['Timeline may slip one day'],
          options: ['approve', 'reject', 'revise'],
          artifact_ref: 'projects/acme/proj-1/spec-v1.md',
        },
      ],
    },
  })

  const ceoRuntime = new CeoRuntime(shell.app.getRegistry(), 'ceo-agent', {
    now: '2026-05-14T09:00:00Z',
    config: {
      owner_auth: {
        owner_id: 'owner',
        allowed_token_ids: ['token-1'],
        failed_attempt_threshold: 3,
        failed_attempt_window_seconds: 60,
        temporary_lock_minutes: 15,
      },
    },
  })

  return createOperatorApiServer({
    shell,
    ceoRuntime,
    now: options?.now ?? (() => '2026-05-14T09:05:00Z'),
    onApprovalResponse: options?.onApprovalResponse,
  })
}

async function readJson(response: Response) {
  return response.json() as Promise<Record<string, any>>
}

describe('OperatorApiServer', () => {
  it('serves health with correlation ID headers and runtime summary', async () => {
    const server = createServer()

    const response = await server.fetch(
      new Request('http://runtime.local/health', {
        headers: {
          'x-correlation-id': 'corr-health-1',
        },
      }),
    )
    const payload = await readJson(response)

    expect(response.status).toBe(200)
    expect(response.headers.get('x-correlation-id')).toBe('corr-health-1')
    expect(payload.correlation_id).toBe('corr-health-1')
    expect(payload.data.status).toBe('ready')
    expect(payload.data.shell_status).toBe('running')
    expect(payload.data.runtime_jobs.total).toBe(0)
  })

  it('rejects mutating requests without bearer auth using structured error responses', async () => {
    const server = createServer()

    const response = await server.fetch(
      new Request('http://runtime.local/directives/owner', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          raw_input: 'status',
          mode: 'structured',
        }),
      }),
    )
    const payload = await readJson(response)

    expect(response.status).toBe(401)
    expect(payload.ok).toBe(false)
    expect(payload.error.code).toBe('unauthorized')
    expect(payload.error.message).toContain('authentication is required')
  })

  it('executes owner directives and records a completed runtime job', async () => {
    const server = createServer()

    const response = await server.fetch(
      new Request('http://runtime.local/directives/owner', {
        method: 'POST',
        headers: {
          authorization: 'Bearer token-1',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          raw_input: 'status',
          mode: 'structured',
        }),
      }),
    )
    const payload = await readJson(response)

    expect(response.status).toBe(202)
    expect(payload.data.job.kind).toBe('owner_directive')
    expect(payload.data.job.status).toBe('completed')
    expect(payload.data.job.result.ok).toBe(true)
  })

  it('lists approvals and applies an approval response for a pending request', async () => {
    const server = createServer()

    const beforeResponse = await server.fetch(
      new Request('http://runtime.local/approvals'),
    )
    const beforePayload = await readJson(beforeResponse)
    expect(beforePayload.data.items).toHaveLength(1)

    const response = await server.fetch(
      new Request('http://runtime.local/approvals/apr-1/response', {
        method: 'POST',
        headers: {
          authorization: 'Bearer token-1',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          gate: 'spec_final',
          decision: 'approve',
          timestamp: '2026-05-14T09:06:00Z',
        }),
      }),
    )
    const payload = await readJson(response)

    expect(response.status).toBe(202)
    expect(payload.data.job.kind).toBe('approval_response')
    expect(payload.data.job.status).toBe('completed')

    const afterResponse = await server.fetch(
      new Request('http://runtime.local/approvals'),
    )
    const afterPayload = await readJson(afterResponse)
    expect(afterPayload.data.items).toHaveLength(0)
  })

  it('returns failed runtime jobs and allows manual retry for them', async () => {
    let failOnce = true
    const server = createServer({
      onApprovalResponse: async () => {
        if (failOnce) {
          failOnce = false
          throw new Error('temporary downstream failure')
        }
      },
    })

    const failedResponse = await server.fetch(
      new Request('http://runtime.local/approvals/apr-1/response', {
        method: 'POST',
        headers: {
          authorization: 'Bearer token-1',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          gate: 'spec_final',
          decision: 'approve',
        }),
      }),
    )
    const failedPayload = await readJson(failedResponse)

    expect(failedResponse.status).toBe(500)
    expect(failedPayload.error.code).toBe('internal_error')
    expect(failedPayload.error.details.job.status).toBe('failed')
    const jobId = failedPayload.error.details.job.job_id

    const retryResponse = await server.fetch(
      new Request(`http://runtime.local/runtime/jobs/${jobId}/retry`, {
        method: 'POST',
        headers: {
          authorization: 'Bearer token-1',
        },
      }),
    )
    const retryPayload = await readJson(retryResponse)

    expect(retryResponse.status).toBe(202)
    expect(retryPayload.data.job.job_id).toBe(jobId)
    expect(retryPayload.data.job.status).toBe('completed')
    expect(retryPayload.data.job.attempts).toBe(2)
  })
})
