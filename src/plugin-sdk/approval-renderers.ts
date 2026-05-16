// Adapted from referensi/openclaw/src/plugin-sdk/approval-renderers.ts

export type ApprovalDecision = 'allow-once' | 'allow-always' | 'deny'

export type InteractiveReplyButton = {
  label: string
  value: string
  style?: 'success' | 'primary' | 'danger' | 'default'
}

export type InteractiveReply = {
  blocks: Array<{
    type: 'buttons'
    buttons: InteractiveReplyButton[]
  }>
}

/** Minimal reply payload for approval messages. */
export type ReplyPayload = {
  text?: string
  interactive?: InteractiveReply
  channelData?: Record<string, unknown>
}

export type PluginApprovalRequestPayload = {
  pluginId?: string | null
  title: string
  description: string
  severity?: 'info' | 'warning' | 'critical' | null
  toolName?: string | null
  toolCallId?: string | null
  allowedDecisions?: readonly ApprovalDecision[] | null
  agentId?: string | null
  sessionKey?: string | null
}

export type PluginApprovalRequest = {
  id: string
  request: PluginApprovalRequestPayload
  createdAtMs: number
  expiresAtMs: number
}

export type PluginApprovalResolved = {
  id: string
  decision: ApprovalDecision
  resolvedBy?: string | null
  ts: number
  request?: PluginApprovalRequestPayload
}

const DEFAULT_ALLOWED_DECISIONS: readonly ApprovalDecision[] = [
  'allow-once',
  'allow-always',
  'deny',
]

const DECISION_LABELS: Record<ApprovalDecision, { label: string; style: InteractiveReplyButton['style'] }> = {
  'allow-once': { label: 'Allow Once', style: 'success' },
  'allow-always': { label: 'Allow Always', style: 'primary' },
  deny: { label: 'Deny', style: 'danger' },
}

function buildApprovalInteractiveReply(params: {
  approvalId: string
  allowedDecisions: readonly ApprovalDecision[]
}): InteractiveReply | undefined {
  const buttons: InteractiveReplyButton[] = params.allowedDecisions.map((decision) => ({
    label: DECISION_LABELS[decision].label,
    value: `/approve ${params.approvalId} ${decision}`,
    style: DECISION_LABELS[decision].style,
  }))
  if (buttons.length === 0) return undefined
  return { blocks: [{ type: 'buttons', buttons }] }
}

function normalizeOptionalString(value: string | null | undefined): string | undefined {
  if (value == null || value === '') return undefined
  return value
}

function resolvePluginApprovalRequestAllowedDecisions(
  request?: PluginApprovalRequestPayload,
): readonly ApprovalDecision[] {
  const explicit: ApprovalDecision[] = []
  if (Array.isArray(request?.allowedDecisions)) {
    for (const decision of request.allowedDecisions) {
      if (
        (decision === 'allow-once' || decision === 'allow-always' || decision === 'deny') &&
        !explicit.includes(decision)
      ) {
        explicit.push(decision)
      }
    }
  }
  return explicit.length > 0 ? explicit : DEFAULT_ALLOWED_DECISIONS
}

function buildPluginApprovalRequestMessage(
  request: PluginApprovalRequest,
  nowMs: number,
): string {
  const lines: string[] = []
  const severity = request.request.severity ?? 'warning'
  const icon = severity === 'critical' ? '🚨' : severity === 'info' ? 'ℹ️' : '🛡️'
  lines.push(`${icon} Plugin approval required`)
  lines.push(`Title: ${request.request.title}`)
  lines.push(`Description: ${request.request.description}`)
  if (request.request.toolName) lines.push(`Tool: ${request.request.toolName}`)
  if (request.request.pluginId) lines.push(`Plugin: ${request.request.pluginId}`)
  if (request.request.agentId) lines.push(`Agent: ${request.request.agentId}`)
  lines.push(`ID: ${request.id}`)
  const expiresIn = Math.max(0, Math.round((request.expiresAtMs - nowMs) / 1000))
  lines.push(`Expires in: ${expiresIn}s`)
  lines.push(
    `Reply with: /approve <id> ${resolvePluginApprovalRequestAllowedDecisions(request.request).join('|')}`,
  )
  return lines.join('\n')
}

function buildPluginApprovalResolvedMessage(resolved: PluginApprovalResolved): string {
  const decisionLabel =
    resolved.decision === 'allow-once'
      ? 'allowed once'
      : resolved.decision === 'allow-always'
        ? 'allowed always'
        : 'denied'
  const base = `✅ Plugin approval ${decisionLabel}.`
  const by = resolved.resolvedBy ? ` Resolved by ${resolved.resolvedBy}.` : ''
  return `${base}${by} ID: ${resolved.id}`
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function buildApprovalPendingReplyPayload(params: {
  approvalKind?: 'exec' | 'plugin'
  approvalId: string
  approvalSlug: string
  text: string
  agentId?: string | null
  allowedDecisions?: readonly ApprovalDecision[]
  sessionKey?: string | null
  channelData?: Record<string, unknown>
}): ReplyPayload {
  const allowedDecisions = params.allowedDecisions ?? DEFAULT_ALLOWED_DECISIONS
  return {
    text: params.text,
    interactive: buildApprovalInteractiveReply({
      approvalId: params.approvalId,
      allowedDecisions,
    }),
    channelData: {
      execApproval: {
        approvalId: params.approvalId,
        approvalSlug: params.approvalSlug,
        approvalKind: params.approvalKind ?? 'exec',
        agentId: normalizeOptionalString(params.agentId),
        allowedDecisions,
        sessionKey: normalizeOptionalString(params.sessionKey),
        state: 'pending',
      },
      ...params.channelData,
    },
  }
}

export function buildApprovalResolvedReplyPayload(params: {
  approvalId: string
  approvalSlug: string
  text: string
  channelData?: Record<string, unknown>
}): ReplyPayload {
  return {
    text: params.text,
    channelData: {
      execApproval: {
        approvalId: params.approvalId,
        approvalSlug: params.approvalSlug,
        state: 'resolved',
      },
      ...params.channelData,
    },
  }
}

export function buildPluginApprovalPendingReplyPayload(params: {
  request: PluginApprovalRequest
  nowMs: number
  text?: string
  approvalSlug?: string
  allowedDecisions?: readonly ApprovalDecision[]
  channelData?: Record<string, unknown>
}): ReplyPayload {
  return buildApprovalPendingReplyPayload({
    approvalKind: 'plugin',
    approvalId: params.request.id,
    approvalSlug: params.approvalSlug ?? params.request.id.slice(0, 8),
    text: params.text ?? buildPluginApprovalRequestMessage(params.request, params.nowMs),
    allowedDecisions:
      params.allowedDecisions ??
      resolvePluginApprovalRequestAllowedDecisions(params.request.request),
    channelData: params.channelData,
  })
}

export function buildPluginApprovalResolvedReplyPayload(params: {
  resolved: PluginApprovalResolved
  text?: string
  approvalSlug?: string
  channelData?: Record<string, unknown>
}): ReplyPayload {
  return buildApprovalResolvedReplyPayload({
    approvalId: params.resolved.id,
    approvalSlug: params.approvalSlug ?? params.resolved.id.slice(0, 8),
    text: params.text ?? buildPluginApprovalResolvedMessage(params.resolved),
    channelData: params.channelData,
  })
}
