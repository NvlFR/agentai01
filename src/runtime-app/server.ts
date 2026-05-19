import { stat } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import { getCorrelationId, jsonResponse, textResponse } from '../web/index.js'
import { RuntimeAppState } from './state.js'
import { loadRuntimeAppConfig } from './config.js'
import { SkillRegistry } from './skills/SkillRegistry.js'
import { AgentCreationService } from './agent-creation/index.js'
import {
  createOpenAICompatibleProvider,
  ProviderRequestError,
  type ProviderMessage,
} from './providers/openaiCompatibleProvider.js'
import { buildOperatorRuntimePrompt } from './prompt/promptPlumbing.js'
import {
  extractOperatorIdentity,
  requireAuth,
  createAuthMiddlewareConfig,
  type AuthMiddlewareConfig,
  type OperatorRole,
  type RuntimeOperatorIdentity,
} from './auth/index.js'
import { InMemoryRateLimiter, type RateLimitPolicy } from './auth/rateLimit.js'
import {
  claimWebhookEventInMemory,
  verifySignedWebhook,
  type WebhookProvider,
} from './channels/webhookGuard.js'
import { HttpError, isHttpError } from './http/errors.js'
import { sendTelegramText } from '../channels/telegram/send.js'
import { sendWhatsAppText } from '../channels/whatsapp/send.js'
import { globalDiagnostics } from './diagnostics/index.js'

export type RuntimeAppServer = ReturnType<typeof Bun.serve>

export type RuntimeAppServerOptions = {
  staticDir?: string
}

type ChatRequestBody = {
  message?: unknown
  messages?: unknown
}

const DEFAULT_STATIC_DIR = fileURLToPath(new URL('./ui/dist/', import.meta.url))
const MUTATION_RATE_LIMIT: RateLimitPolicy = {
  limit: 60,
  windowMs: 60_000,
}

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
  const agentCreation = new AgentCreationService({ config })
  const authConfig = createAuthMiddlewareConfig(config)
  const rateLimiter = new InMemoryRateLimiter()

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
      '/api/agents/wizard/schema': req =>
        json(withMeta(req, state.getSnapshot(), {
          memoryEnabled: true,
          steps: agentCreation.buildStepDefinitions(state.config.ai.model),
        })),
      '/api/telegram/status': req => json(withMeta(req, state.getSnapshot(), {
        ok: true,
        status: state.config.telegramToken ? 'polling' : 'disconnected',
        allowed_chat_ids: state.config.allowedChatIds,
      })),
      '/api/whatsapp/status': req => json(withMeta(req, state.getSnapshot(), {
        ok: true,
        status: process.env['WHATSAPP_PHONE_ID'] ? 'connected' : 'qr_required',
        phone_id: process.env['WHATSAPP_PHONE_ID'] ?? 'unknown',
      })),
    },
    fetch: async req => {
      const url = new URL(req.url)
      const correlationId = getCorrelationId(req)
      const startedAt = Date.now()

      // Wrap all handlers with error handling for HttpError
      try {
        const response = await handleRequest(req, url, correlationId, state, authConfig, rateLimiter, agentCreation, staticDir)
        globalDiagnostics.recordMetric('runtime_http_request_latency_ms', Date.now() - startedAt, {
          method: req.method,
          route: url.pathname,
          status: String(response.status),
        })
        return response
      } catch (error) {
        if (isHttpError(error)) {
          globalDiagnostics.recordMetric('runtime_http_request_latency_ms', Date.now() - startedAt, {
            method: req.method,
            route: url.pathname,
            status: String(error.status),
          })
          return json(
            withCorrelation(correlationId, {
              ok: false,
              code: error.code,
              message: error.message,
              ...(error.details ? { details: error.details } : {}),
            }),
            error.status,
          )
        }
        throw error
      }
    },
  })
}

async function handleRequest(
  req: Request,
  url: URL,
  correlationId: string,
  state: RuntimeAppState,
  authConfig: AuthMiddlewareConfig,
  rateLimiter: InMemoryRateLimiter,
  agentCreation: AgentCreationService,
  staticDir: string,
): Promise<Response> {
      if (req.method === 'GET' && url.pathname.startsWith('/api/projects/')) {
        const snapshot = state.getSnapshot()
        const projectId = decodeURIComponent(url.pathname.slice('/api/projects/'.length))
        const project = snapshot.project_details.find(item => item.project.project_id === projectId)
        return project
          ? json(withCorrelation(correlationId, project))
          : json(withCorrelation(correlationId, { ok: false, message: `Project not found: ${projectId}` }), 404)
      }

      if (req.method === 'POST' && url.pathname === '/api/directives') {
        const identity = authorizeMutation(req, state, authConfig, rateLimiter, 'operator', 'directive_submit')
        
        const body = await readJson(req)
        const result = state.submitDirective({
          input: typeof body.input === 'string' ? body.input : typeof body.directive === 'string' ? body.directive : '',
          mode: body.mode === 'structured' ? 'structured' : 'natural',
          confirm: Boolean(body.confirm),
        })
        state.recordOperatorAction('directive_submit', `${identity.actor_id} submitted directive.`)
        return actionResponse(correlationId, result)
      }

      if (req.method === 'POST' && url.pathname === '/api/telegram/send') {
        const identity = authorizeMutation(req, state, authConfig, rateLimiter, 'operator', 'telegram_send')
        
        const body = await readJson(req)
        const message = typeof body.message === 'string' ? body.message : ''
        const target = typeof body.target === 'string' ? body.target : 'broadcast'
        if (!message.trim()) {
          throw new HttpError(400, 'bad_request', 'Telegram message is required.')
        }
        if (!state.config.telegramToken) {
          throw new HttpError(503, 'channel_unconfigured', 'Telegram token is not configured.')
        }

        const targets = target === 'broadcast' ? state.config.allowedChatIds : [target]
        if (targets.length === 0) {
          throw new HttpError(400, 'bad_request', 'Telegram target is required when no broadcast chat ids are configured.')
        }

        const deliveries = []
        for (const chatId of targets) {
          const delivery = await sendTelegramText(chatId, message, {
            cfg: {},
            token: state.config.telegramToken,
          })
          deliveries.push({
            provider: 'telegram',
            target: delivery.chatId,
            message_id: delivery.messageId,
            status: 'sent',
          })
        }

        state.recordOperatorAction('telegram_send', `${identity.actor_id} sent Telegram message to ${target}.`)
        return json(withCorrelation(correlationId, { ok: true, deliveries, snapshot: state.getSnapshot() }))
      }

      if (req.method === 'POST' && url.pathname === '/api/whatsapp/send') {
        const identity = authorizeMutation(req, state, authConfig, rateLimiter, 'operator', 'whatsapp_send')
        
        const body = await readJson(req)
        const message = typeof body.message === 'string' ? body.message : ''
        const target = typeof body.target === 'string' ? body.target : 'broadcast'
        const accountId = typeof body.accountId === 'string'
          ? body.accountId
          : process.env['WHATSAPP_ACCOUNT_ID'] ?? 'default'
        if (!message.trim()) {
          throw new HttpError(400, 'bad_request', 'WhatsApp message is required.')
        }
        if (target === 'broadcast' || !target.trim()) {
          throw new HttpError(400, 'bad_request', 'WhatsApp target is required.')
        }

        const delivery = await sendWhatsAppText({
          accountId,
          to: target,
          text: message,
          convertMarkdown: true,
        })

        state.recordOperatorAction('whatsapp_send', `${identity.actor_id} sent WhatsApp message to ${target}.`)
        return json(withCorrelation(correlationId, {
          ok: true,
          deliveries: [{
            provider: 'whatsapp',
            target: delivery.jid,
            message_id: delivery.messageId,
            status: 'sent',
          }],
          snapshot: state.getSnapshot(),
        }))
      }

      if (req.method === 'POST' && url.pathname === '/api/telegram/webhook') {
        const { body, verified } = await readVerifiedWebhook(req, 'telegram', authConfig, state)
        const text = typeof body.text === 'string' ? body.text : typeof body.message === 'string' ? body.message : ''
        if (text) {
          state.submitDirective({ input: text, mode: 'natural', confirm: true })
        }
        state.recordOperatorAction('telegram_webhook_accepted', `Accepted Telegram webhook event ${verified.event_id}.`)
        return json(withCorrelation(correlationId, { ok: true, status: 'telegram_webhook_processed', event_id: verified.event_id, snapshot: state.getSnapshot() }))
      }

      if (req.method === 'POST' && url.pathname === '/api/whatsapp/webhook') {
        const { body, verified } = await readVerifiedWebhook(req, 'whatsapp', authConfig, state)
        const text = typeof body.text === 'string' ? body.text : typeof body.message === 'string' ? body.message : ''
        if (text) {
          state.submitDirective({ input: text, mode: 'natural', confirm: true })
        }
        state.recordOperatorAction('whatsapp_webhook_accepted', `Accepted WhatsApp webhook event ${verified.event_id}.`)
        return json(withCorrelation(correlationId, { ok: true, status: 'whatsapp_webhook_processed', event_id: verified.event_id, snapshot: state.getSnapshot() }))
      }

      if (req.method === 'POST' && url.pathname === '/api/chat') {
        authorizeMutation(req, state, authConfig, rateLimiter, 'operator', 'operator_chat')
        
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

      if (req.method === 'POST' && url.pathname === '/api/agents/wizard/generate') {
        authorizeMutation(req, state, authConfig, rateLimiter, 'operator', 'agent_wizard_generate')
        
        const body = await readJson(req)
        const prompt = typeof body.prompt === 'string' ? body.prompt : ''
        if (!prompt.trim()) {
          return json(withCorrelation(correlationId, {
            ok: false,
            message: 'prompt is required.',
          }), 400)
        }

        try {
          const generated = await agentCreation.generateFields(
            prompt,
            Array.isArray(body.existingAgentIds)
              ? body.existingAgentIds.filter((value): value is string => typeof value === 'string')
              : undefined,
          )
          return json(withCorrelation(correlationId, {
            ok: true,
            generated,
          }))
        } catch (error) {
          return json(withCorrelation(correlationId, {
            ok: false,
            message: error instanceof Error ? error.message : 'Agent generation failed.',
          }), 400)
        }
      }

      if (req.method === 'POST' && url.pathname === '/api/agents/wizard/validate') {
        authorizeMutation(req, state, authConfig, rateLimiter, 'operator', 'agent_wizard_validate')
        
        const body = await readJson(req)
        const draft = typeof body.draft === 'object' && body.draft !== null ? body.draft : {}
        const result = await agentCreation.validateDraft(draft)
        return json(withCorrelation(correlationId, {
          ok: result.isValid,
          result,
        }), result.isValid ? 200 : 400)
      }

      if (req.method === 'POST' && url.pathname === '/api/agents/wizard/save') {
        authorizeMutation(req, state, authConfig, rateLimiter, 'operator', 'agent_wizard_save')
        
        const body = await readJson(req)
        const draft = typeof body.draft === 'object' && body.draft !== null ? body.draft : {}
        try {
          const artifact = await agentCreation.saveDraft(draft)
          return json(withCorrelation(correlationId, {
            ok: true,
            artifact,
          }), 201)
        } catch (error) {
          return json(withCorrelation(correlationId, {
            ok: false,
            message: error instanceof Error ? error.message : 'Agent draft save failed.',
          }), 400)
        }
      }

      if (req.method === 'GET' && url.pathname === '/api/agents/drafts') {
        const identity = extractOperatorIdentity(req, authConfig)
        requireAuth(identity, 'observer')
        
        const locationParam = url.searchParams.get('location')
        const location = locationParam === 'project' || locationParam === 'runtime' || locationParam === 'user'
          ? locationParam
          : 'project'
        const items = await agentCreation.listSavedDrafts(location)
        return json(withCorrelation(correlationId, {
          ok: true,
          items,
        }))
      }

      if (req.method === 'POST' && url.pathname.endsWith('/respond') && url.pathname.startsWith('/api/approvals/')) {
        const identity = authorizeMutation(req, state, authConfig, rateLimiter, 'owner', 'approval_response')
        const requestId = decodeURIComponent(url.pathname.slice('/api/approvals/'.length, -'/respond'.length))
        const body = await readJson(req)
        const result = state.respondToApproval(requestId, {
          decision: body.decision === 'approve' || body.decision === 'reject' || body.decision === 'revise'
            ? body.decision
            : 'revise',
          notes: typeof body.notes === 'string' ? body.notes : undefined,
          confirm: Boolean(body.confirm),
        })
        state.recordOperatorAction('approval_response_requested', `${identity.actor_id} responded to approval ${requestId}.`)
        return actionResponse(correlationId, result)
      }

      if (req.method === 'POST' && url.pathname.endsWith('/retry') && url.pathname.startsWith('/api/jobs/')) {
        const identity = authorizeMutation(req, state, authConfig, rateLimiter, 'owner', 'job_retry')
        const jobId = decodeURIComponent(url.pathname.slice('/api/jobs/'.length, -'/retry'.length))
        const body = await readJson(req)
        const result = state.retryJob(jobId, Boolean(body.confirm))
        state.recordOperatorAction('job_retry_requested', `${identity.actor_id} requested retry for job ${jobId}.`)
        return actionResponse(correlationId, result)
      }

      if (req.method === 'POST' && url.pathname.endsWith('/retry') && url.pathname.startsWith('/api/messages/')) {
        const identity = authorizeMutation(req, state, authConfig, rateLimiter, 'owner', 'message_retry')
        const logId = decodeURIComponent(url.pathname.slice('/api/messages/'.length, -'/retry'.length))
        const body = await readJson(req)
        const result = state.retryMessage(logId, Boolean(body.confirm))
        state.recordOperatorAction('message_retry_requested', `${identity.actor_id} requested retry for message ${logId}.`)
        return actionResponse(correlationId, result)
      }

      if (isApiRoute(url.pathname)) {
        return json(withCorrelation(correlationId, { ok: false, message: `Route not found: ${url.pathname}` }), 404)
      }

      if (req.method === 'GET') {
        return serveOperatorUi(req, staticDir)
      }

      return json(withCorrelation(correlationId, { ok: false, message: `Route not found: ${url.pathname}` }), 404)
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

function authorizeMutation(
  req: Request,
  state: RuntimeAppState,
  authConfig: AuthMiddlewareConfig,
  rateLimiter: InMemoryRateLimiter,
  requiredRole: OperatorRole,
  action: string,
): Extract<RuntimeOperatorIdentity, { authenticated: true }> {
  const identity = extractOperatorIdentity(req, authConfig)
  try {
    requireAuth(identity, requiredRole)
    rateLimiter.assertAllowed(`${identity.actor_id}:${action}`, MUTATION_RATE_LIMIT)
    globalDiagnostics.recordMetric('runtime_mutation_accepted_total', 1, {
      action,
      role: identity.role,
    })
    return identity
  } catch (error) {
    globalDiagnostics.recordMetric('runtime_mutation_rejected_total', 1, {
      action,
      reason: isHttpError(error) ? error.code : 'internal_error',
    })
    state.recordOperatorAction(
      'mutation_rejected',
      `${identity.actor_id} rejected for ${action}: ${error instanceof Error ? error.message : String(error)}`,
    )
    throw error
  }
}

async function readVerifiedWebhook(
  req: Request,
  provider: WebhookProvider,
  authConfig: AuthMiddlewareConfig,
  state: RuntimeAppState,
): Promise<{
  body: Record<string, unknown>
  verified: ReturnType<typeof verifySignedWebhook>
}> {
  const rawBody = await req.text()
  const secret = provider === 'telegram'
    ? authConfig.webhook?.telegramSecret
    : authConfig.webhook?.whatsappSecret

  try {
    const verified = verifySignedWebhook(req, rawBody, { provider, secret })
    const claimKey = `${provider}:${verified.event_id}`
    const claimed = await state.repository.claimEvent(claimKey, new Date().toISOString())
    if (!claimed) {
      throw new HttpError(409, 'webhook_replay_rejected', 'Webhook event was already processed.')
    }
    if (state.config.storage.mode === 'memory') {
      claimWebhookEventInMemory(provider, verified.event_id)
    }
    globalDiagnostics.recordMetric('runtime_webhook_accepted_total', 1, {
      provider,
    })
    return {
      body: parseJsonObject(rawBody),
      verified,
    }
  } catch (error) {
    globalDiagnostics.recordMetric('runtime_webhook_rejected_total', 1, {
      provider,
      reason: isHttpError(error) ? error.code : 'internal_error',
    })
    state.recordOperatorAction(
      `${provider}_webhook_rejected`,
      error instanceof Error ? error.message : String(error),
    )
    throw error
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

function parseJsonObject(rawBody: string): Record<string, unknown> {
  try {
    const body = JSON.parse(rawBody)
    return typeof body === 'object' && body !== null && !Array.isArray(body)
      ? body as Record<string, unknown>
      : {}
  } catch {
    throw new HttpError(400, 'bad_request', 'Request body must be valid JSON.')
  }
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
