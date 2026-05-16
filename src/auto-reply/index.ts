import { createAuditTrail, type AuditEvent, type RecordedAuditEvent } from '../security/index.js'

export type AutoReplyDecision = {
  shouldReply: boolean
  reason: 'matched_policy' | 'disabled' | 'rate_limited' | 'empty_message' | 'manual_only'
  templateId?: string
  renderedText?: string
}

export type AutoReplyPolicy = {
  enabled: boolean
  manualOnly?: boolean
  templateId: string
  trigger: (message: AutoReplyMessage) => boolean
}

export type AutoReplyMessage = {
  id: string
  conversationId: string
  senderId: string
  text: string
  receivedAt: string
}

export type AutoReplyTemplate = {
  id: string
  body: string
}

export type AutoReplyRateLimit = {
  windowMs: number
  maxReplies: number
}

export type AutoReplyAudit = {
  record(event: AuditEvent): void
  list(): RecordedAuditEvent[]
}

export function createAutoReplyAudit(): AutoReplyAudit {
  const trail = createAuditTrail()
  return {
    record: trail.auditLog,
    list: trail.list,
  }
}

export function createInMemoryReplyRateLimiter(config: AutoReplyRateLimit): {
  allow: (conversationId: string, nowMs?: number) => boolean
  reset: (conversationId?: string) => void
} {
  const hits = new Map<string, number[]>()

  return {
    allow(conversationId, nowMs = Date.now()) {
      const windowStart = nowMs - config.windowMs
      const current = (hits.get(conversationId) ?? []).filter(timestamp => timestamp > windowStart)
      if (current.length >= config.maxReplies) {
        hits.set(conversationId, current)
        return false
      }

      current.push(nowMs)
      hits.set(conversationId, current)
      return true
    },
    reset(conversationId) {
      if (conversationId) {
        hits.delete(conversationId)
        return
      }

      hits.clear()
    },
  }
}

export function renderAutoReplyTemplate(
  template: AutoReplyTemplate,
  variables: Record<string, string>,
): string {
  return template.body.replace(/\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g, (_, key: string) => variables[key] ?? '')
}

export function evaluateAutoReplyPolicy(input: {
  message: AutoReplyMessage
  policy: AutoReplyPolicy
  templates: ReadonlyMap<string, AutoReplyTemplate>
  rateLimiter: { allow: (conversationId: string, nowMs?: number) => boolean }
  audit?: AutoReplyAudit
  nowMs?: number
}): AutoReplyDecision {
  const baseAudit = {
    event_type: 'auto_reply_evaluated',
    actor: input.message.senderId,
    project_id: input.message.conversationId,
  }

  if (!input.policy.enabled) {
    input.audit?.record({ ...baseAudit, outcome: 'disabled' })
    return { shouldReply: false, reason: 'disabled' }
  }

  if (input.policy.manualOnly) {
    input.audit?.record({ ...baseAudit, outcome: 'manual_only' })
    return { shouldReply: false, reason: 'manual_only' }
  }

  if (input.message.text.trim().length === 0) {
    input.audit?.record({ ...baseAudit, outcome: 'empty_message' })
    return { shouldReply: false, reason: 'empty_message' }
  }

  if (!input.policy.trigger(input.message)) {
    input.audit?.record({ ...baseAudit, outcome: 'no_match' })
    return { shouldReply: false, reason: 'matched_policy' }
  }

  if (!input.rateLimiter.allow(input.message.conversationId, input.nowMs)) {
    input.audit?.record({ ...baseAudit, outcome: 'rate_limited' })
    return { shouldReply: false, reason: 'rate_limited' }
  }

  const template = input.templates.get(input.policy.templateId)
  const renderedText = template
    ? renderAutoReplyTemplate(template, {
      conversationId: input.message.conversationId,
      senderId: input.message.senderId,
      text: input.message.text,
    })
    : undefined

  input.audit?.record({
    ...baseAudit,
    outcome: 'reply_ready',
    metadata: { templateId: input.policy.templateId },
  })

  return {
    shouldReply: true,
    reason: 'matched_policy',
    templateId: input.policy.templateId,
    renderedText,
  }
}
