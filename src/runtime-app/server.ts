import { stat } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import { getCorrelationId, jsonResponse, textResponse } from '../web/index.js'
import { RuntimeAppState } from './state.js'
import { loadRuntimeAppConfig } from './config.js'
import { SkillRegistry } from './skills/SkillRegistry.js'
import {
  createOpenAICompatibleProvider,
  ProviderRequestError,
  type ProviderMessage,
} from './providers/openaiCompatibleProvider.js'
import { buildOperatorRuntimePrompt } from './prompt/promptPlumbing.js'

export type RuntimeAppServer = ReturnType<typeof Bun.serve>

export type RuntimeAppServerOptions = {
  staticDir?: string
}

type ChatRequestBody = {
  message?: unknown
  messages?: unknown
}

const DEFAULT_STATIC_DIR = fileURLToPath(new URL('./ui/dist/', import.meta.url))

const STATIC_CONTENT_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
}

export function createRuntimeAppState() {
  const config = loadRuntimeAppConfig()
  return new RuntimeAppState(config)
}

export function startRuntimeAppServer(
  state = createRuntimeAppState(),
  options: RuntimeAppServerOptions = {},
): RuntimeAppServer {
  const config = state.config
  const staticDir = options.staticDir ?? DEFAULT_STATIC_DIR

  return Bun.serve({
    hostname: config.host,
    port: config.port,
    routes: {
      '/': req => serveOperatorUi(req, staticDir),
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
      '/api/extensions': req => json(withMeta(req, state.getSnapshot(), state.getSnapshot().extensions)),
      '/api/skills': async req => {
        const registry = await SkillRegistry.create()
        return json(withMeta(req, state.getSnapshot(), registry.list()))
      },
    },
    fetch: async req => {
      const url = new URL(req.url)
      const correlationId = getCorrelationId(req)

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

      if (req.method === 'POST' && url.pathname === '/api/chat') {
        const body = parseChatBody(await readJson(req))
        if (body.message.length === 0) {
          return json(withCorrelation(correlationId, {
            ok: false,
            message: 'Chat message is required.',
          }), 400)
        }
        if (!state.config.ai.apiKey) {
          return json(withCorrelation(correlationId, {
            ok: false,
            message: 'AI provider is not configured. Set AI_API_KEY before using operator chat.',
          }), 503)
        }

        const startedAt = Date.now()
        try {
          const provider = createOpenAICompatibleProvider({
            baseURL: state.config.ai.baseUrl,
            apiKey: state.config.ai.apiKey,
            model: state.config.ai.model,
            timeoutMs: state.config.ai.timeoutMs,
            retryLimit: state.config.ai.retryLimit,
          })
          const response = await provider.generateText({
            messages: [
              {
                role: 'system',
                content: buildOperatorChatSystemPrompt(state.getSnapshot()),
              },
              ...body.messages,
              {
                role: 'user',
                content: body.message,
              },
            ],
            temperature: 0.2,
            maxTokens: 3200,
            metadata: {
              source: 'operator-control-ui',
            },
          })

          return json(withCorrelation(correlationId, {
            ok: true,
            message: response.content,
            model: response.model,
            latencyMs: response.latencyMs,
            attempts: response.attempts,
          }))
        } catch (error) {
          const status = error instanceof ProviderRequestError && error.status !== null
            ? error.status
            : 502
          return json(withCorrelation(correlationId, {
            ok: false,
            message: 'AI provider chat request failed.',
            error: error instanceof Error ? error.message : String(error),
            latencyMs: Date.now() - startedAt,
          }), status >= 400 && status < 600 ? status : 502)
        }
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

      if (isApiRoute(url.pathname)) {
        return json(withCorrelation(correlationId, { ok: false, message: `Route not found: ${url.pathname}` }), 404)
      }

      if (req.method === 'GET') {
        return serveOperatorUi(req, staticDir)
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
    correlation_id: getCorrelationId(req),
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

async function readJson(req: Request): Promise<Record<string, unknown>> {
  if (!req.headers.get('content-type')?.includes('application/json')) {
    return {}
  }

  const body = await req.json()
  return typeof body === 'object' && body !== null && !Array.isArray(body)
    ? body as Record<string, unknown>
    : {}
}

function parseChatBody(body: Record<string, unknown>): {
  message: string
  messages: ProviderMessage[]
} {
  const typed = body as ChatRequestBody
  const message = typeof typed.message === 'string' ? typed.message.trim() : ''
  const messages = Array.isArray(typed.messages)
    ? typed.messages.flatMap(parseProviderMessage)
    : []

  return {
    message,
    messages: messages.slice(-12),
  }
}

function parseProviderMessage(value: unknown): ProviderMessage[] {
  if (typeof value !== 'object' || value === null) return []
  const record = value as Record<string, unknown>
  const role = record['role']
  const content = record['content']
  if (
    (role === 'user' || role === 'assistant') &&
    typeof content === 'string' &&
    content.trim().length > 0
  ) {
    return [{ role, content: content.trim() }]
  }
  return []
}

function buildOperatorChatSystemPrompt(snapshot: ReturnType<RuntimeAppState['getSnapshot']>): string {
  return buildOperatorRuntimePrompt({
    snapshot,
    channel: 'web',
    additions: [
      {
        id: 'Operator Chat Rules',
        content: [
          'You are AgentAI 01 operator chat for a local AI Company Runtime Platform.',
          'Answer conversationally and help the trusted operator understand current runtime state.',
          'Do not claim you executed deployment, provisioning, destructive mutation, or runtime activation unless the operator used a directive endpoint and it actually ran.',
          'If the operator wants to mutate runtime state, tell them to use the Directive tab.',
          'Never reveal raw secrets. AI_API_KEY is masked in runtime state and must stay masked.',
        ].join('\n'),
      },
      {
        id: 'Operator UI Snapshot',
        content: [
          `Runtime: ${snapshot.runtime.runtime_id} (${snapshot.runtime.shell_status})`,
          `Environment: ${snapshot.environment.env}, model ${snapshot.environment.ai_model}, port ${snapshot.environment.port}`,
          `Readiness: ${snapshot.readiness.ready ? 'ready' : 'not ready'}`,
          `Projects: ${snapshot.dashboard.kpis.active_project_count} active`,
          `Pending approvals: ${snapshot.approvals.length}`,
          `Active jobs: ${snapshot.jobs.filter(job => job.status === 'queued' || job.status === 'running' || job.status === 'retrying').length}`,
          `Operational issues: ${snapshot.dashboard.operational_issues.map(issue => issue.summary).join('; ') || 'none'}`,
        ].join('\n'),
      },
    ],
  })
}

function html(body: string, status = 200): Response {
  return textResponse(body, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
    },
  })
}

function json(data: unknown, status = 200): Response {
  return jsonResponse(data, { status })
}

async function serveOperatorUi(req: Request, staticDir: string): Promise<Response> {
  const indexPath = resolve(staticDir, 'index.html')
  if (!(await fileExists(indexPath))) {
    return html(missingOperatorUiHtml(), 503)
  }

  const url = new URL(req.url)
  const requestedPath = url.pathname === '/'
    ? 'index.html'
    : decodeURIComponent(url.pathname.replace(/^\/+/, ''))
  const staticPath = resolveInside(staticDir, requestedPath)

  if (staticPath !== undefined && await isRegularFile(staticPath)) {
    return fileResponse(staticPath)
  }

  return fileResponse(indexPath)
}

async function fileExists(filePath: string): Promise<boolean> {
  return isRegularFile(filePath)
}

async function isRegularFile(filePath: string): Promise<boolean> {
  try {
    return (await stat(filePath)).isFile()
  } catch {
    return false
  }
}

function fileResponse(filePath: string): Response {
  return new Response(Bun.file(filePath), {
    headers: {
      'content-type': STATIC_CONTENT_TYPES[extname(filePath)] ?? 'application/octet-stream',
    },
  })
}

function resolveInside(root: string, unsafePath: string): string | undefined {
  const resolvedRoot = resolve(root)
  const resolvedPath = resolve(resolvedRoot, unsafePath)
  const rootWithSeparator = resolvedRoot.endsWith(sep) ? resolvedRoot : `${resolvedRoot}${sep}`
  return resolvedPath === resolvedRoot || resolvedPath.startsWith(rootWithSeparator)
    ? resolvedPath
    : undefined
}

function isApiRoute(pathname: string): boolean {
  return pathname === '/api' || pathname.startsWith('/api/')
}

function missingOperatorUiHtml(): string {
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head><meta charset="utf-8"><title>Operator UI not built</title></head>',
    '<body>',
    '<main>',
    '<h1>Operator UI not built</h1>',
    '<p>Build the Operator Control UI before opening this page.</p>',
    '<p>Run <code>npm run ui:build</code> from the project root, then reload.</p>',
    '</main>',
    '</body>',
    '</html>',
  ].join('')
}
