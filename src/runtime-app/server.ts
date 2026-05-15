import { renderOperatorShell } from './ui/render.js'
import { RuntimeAppState } from './state.js'
import { loadRuntimeAppConfig } from './config.js'

export type RuntimeAppServer = ReturnType<typeof Bun.serve>

export function createRuntimeAppState() {
  const config = loadRuntimeAppConfig()
  return new RuntimeAppState(config)
}

export function startRuntimeAppServer(state = createRuntimeAppState()): RuntimeAppServer {
  const config = state.config

  return Bun.serve({
    hostname: config.host,
    port: config.port,
    routes: {
      '/': () => html(renderOperatorShell(state.getSnapshot())),
      '/health': req => json(withMeta(req, state.getSnapshot(), { ok: true, health: state.getSnapshot().health })),
      '/ready': req => {
        const snapshot = state.getSnapshot()
        const status = snapshot.readiness.ready ? 200 : 503
        return json(withMeta(req, snapshot, { ok: snapshot.readiness.ready, readiness: snapshot.readiness }), status)
      },
      '/api/snapshot': req => json(withMeta(req, state.getSnapshot(), state.getSnapshot())),
      '/api/dashboard': req => json(withMeta(req, state.getSnapshot(), state.getSnapshot().dashboard)),
      '/api/projects': req => json(withMeta(req, state.getSnapshot(), state.getSnapshot().project_details)),
      '/api/approvals': req => json(withMeta(req, state.getSnapshot(), state.getSnapshot().approvals)),
      '/api/runtime/jobs': req => json(withMeta(req, state.getSnapshot(), state.getSnapshot().jobs)),
      '/api/messages': req => json(withMeta(req, state.getSnapshot(), state.getSnapshot().messages)),
      '/api/audit': req => json(withMeta(req, state.getSnapshot(), state.getSnapshot().audit)),
    },
    fetch: async req => {
      const url = new URL(req.url)
      const correlationId = buildCorrelationId()

      if (req.method === 'GET' && url.pathname.startsWith('/api/projects/')) {
        const snapshot = state.getSnapshot()
        const projectId = decodeURIComponent(url.pathname.slice('/api/projects/'.length))
        const project = snapshot.project_details.find(item => item.project.project_id === projectId)
        return project
          ? json(withCorrelation(correlationId, project))
          : json(withCorrelation(correlationId, { ok: false, message: `Project not found: ${projectId}` }), 404)
      }

      if (req.method === 'POST' && url.pathname === '/api/directives') {
        const body = await readJson(req)
        const result = state.submitDirective({
          input: typeof body.input === 'string' ? body.input : typeof body.directive === 'string' ? body.directive : '',
          mode: body.mode === 'structured' ? 'structured' : 'natural',
          confirm: Boolean(body.confirm),
        })
        return actionResponse(correlationId, result)
      }

      if (req.method === 'POST' && url.pathname.endsWith('/respond') && url.pathname.startsWith('/api/approvals/')) {
        const requestId = decodeURIComponent(url.pathname.slice('/api/approvals/'.length, -'/respond'.length))
        const body = await readJson(req)
        const result = state.respondToApproval(requestId, {
          decision: body.decision === 'approve' || body.decision === 'reject' || body.decision === 'revise'
            ? body.decision
            : 'revise',
          notes: typeof body.notes === 'string' ? body.notes : undefined,
          confirm: Boolean(body.confirm),
        })
        return actionResponse(correlationId, result)
      }

      if (req.method === 'POST' && url.pathname.endsWith('/retry') && url.pathname.startsWith('/api/jobs/')) {
        const jobId = decodeURIComponent(url.pathname.slice('/api/jobs/'.length, -'/retry'.length))
        const body = await readJson(req)
        const result = state.retryJob(jobId, Boolean(body.confirm))
        return actionResponse(correlationId, result)
      }

      if (req.method === 'POST' && url.pathname.endsWith('/retry') && url.pathname.startsWith('/api/messages/')) {
        const logId = decodeURIComponent(url.pathname.slice('/api/messages/'.length, -'/retry'.length))
        const body = await readJson(req)
        const result = state.retryMessage(logId, Boolean(body.confirm))
        return actionResponse(correlationId, result)
      }

      return json(withCorrelation(correlationId, { ok: false, message: `Route not found: ${url.pathname}` }), 404)
    },
  })
}

function withMeta(
  req: Request,
  snapshot: ReturnType<RuntimeAppState['getSnapshot']>,
  data: unknown,
) {
  return {
    correlation_id: req.headers.get('x-correlation-id') ?? buildCorrelationId(),
    generated_at: snapshot.generated_at,
    data,
  }
}

function withCorrelation(correlationId: string, data: unknown) {
  return {
    correlation_id: correlationId,
    ...((typeof data === 'object' && data !== null) ? data : { data }),
  }
}

function actionResponse(
  correlationId: string,
  result: ReturnType<RuntimeAppState['submitDirective']>,
): Response {
  if (result.requires_confirmation) {
    return json(
      {
        correlation_id: correlationId,
        ok: false,
        requires_confirmation: true,
        message: result.message,
        snapshot: result.snapshot,
      },
      409,
    )
  }

  return json(
    {
      correlation_id: correlationId,
      ok: result.ok,
      message: result.message,
      snapshot: result.snapshot,
    },
    result.ok ? 200 : 400,
  )
}

async function readJson(req: Request): Promise<Record<string, any>> {
  if (!req.headers.get('content-type')?.includes('application/json')) {
    return {}
  }

  return (await req.json()) as Record<string, any>
}

function html(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
    },
  })
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
  })
}

function buildCorrelationId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
