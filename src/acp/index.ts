import { createAuditTrail, type AuditEvent, type RecordedAuditEvent } from '../security/index.js'
import { err, isRecord, ok, type Result } from '../shared/index.js'

export type AcpMessageKind = 'agent_message' | 'tool_request' | 'approval_request' | 'approval_response'
export type AcpApprovalStatus = 'pending' | 'approved' | 'rejected'

export type AcpMessage = {
  id: string
  kind: AcpMessageKind
  from: string
  to: string
  correlationId?: string
  createdAt: string
  payload: Record<string, unknown>
}

export type AcpApproval = {
  id: string
  messageId: string
  requestedBy: string
  reason: string
  status: AcpApprovalStatus
  decidedBy?: string
  decidedAt?: string
}

export type AcpAudit = {
  record: (event: AuditEvent) => void
  list: () => RecordedAuditEvent[]
}

export function createAcpAudit(): AcpAudit {
  const trail = createAuditTrail()
  return {
    record: trail.auditLog,
    list: trail.list,
  }
}

export function validateAcpMessage(input: unknown, now: () => Date = () => new Date()): Result<AcpMessage, string[]> {
  if (!isRecord(input)) {
    return err(['ACP message must be an object.'])
  }

  const errors: string[] = []
  const id = readRequired(input, 'id', errors)
  const kind = readKind(input['kind'], errors)
  const from = readRequired(input, 'from', errors)
  const to = readRequired(input, 'to', errors)
  const payload = isRecord(input['payload']) ? input['payload'] : {}
  const createdAt = typeof input['createdAt'] === 'string' && input['createdAt'].trim()
    ? input['createdAt'].trim()
    : now().toISOString()

  if (errors.length > 0) {
    return err(errors)
  }

  return ok({
    id,
    kind,
    from,
    to,
    correlationId: typeof input['correlationId'] === 'string' ? input['correlationId'] : undefined,
    createdAt,
    payload,
  })
}

export function createApprovalRequest(input: {
  id: string
  message: AcpMessage
  reason: string
  audit?: AcpAudit
}): AcpApproval {
  const approval = {
    id: input.id,
    messageId: input.message.id,
    requestedBy: input.message.from,
    reason: input.reason,
    status: 'pending' as const,
  }
  input.audit?.record({
    event_type: 'acp_approval_requested',
    actor: input.message.from,
    outcome: 'pending',
    metadata: { messageId: input.message.id, reason: input.reason },
  })
  return approval
}

export function decideApproval(
  approval: AcpApproval,
  decision: { approved: boolean; decidedBy: string; now?: () => Date; audit?: AcpAudit },
): AcpApproval {
  if (approval.status !== 'pending') {
    return approval
  }

  const decided = {
    ...approval,
    status: decision.approved ? 'approved' as const : 'rejected' as const,
    decidedBy: decision.decidedBy,
    decidedAt: (decision.now ?? (() => new Date()))().toISOString(),
  }
  decision.audit?.record({
    event_type: 'acp_approval_decided',
    actor: decision.decidedBy,
    outcome: decided.status,
    metadata: { approvalId: approval.id, messageId: approval.messageId },
  })
  return decided
}

function readRequired(record: Record<string, unknown>, field: string, errors: string[]): string {
  const value = record[field]
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push(`ACP message field "${field}" is required.`)
    return ''
  }

  return value.trim()
}

function readKind(value: unknown, errors: string[]): AcpMessageKind {
  const allowed: readonly AcpMessageKind[] = ['agent_message', 'tool_request', 'approval_request', 'approval_response']
  if (typeof value === 'string' && allowed.includes(value as AcpMessageKind)) {
    return value as AcpMessageKind
  }

  errors.push('ACP message field "kind" is invalid.')
  return 'agent_message'
}
