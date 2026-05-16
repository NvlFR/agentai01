import { formatIso8601 } from '../shared/index.js'
import { sanitizeInput, serializeAuditSafe } from './sanitize.js'

export type AuditEvent = {
  event_type: string
  actor: string
  outcome: string
  project_id?: string
  timestamp?: string
  metadata?: Record<string, unknown>
}

export type RecordedAuditEvent = {
  event_type: string
  actor: string
  outcome: string
  timestamp: string
  project_id?: string
  metadata?: Record<string, unknown>
}

export function createAuditTrail(
  sink?: (event: RecordedAuditEvent) => void,
): {
  auditLog: (event: AuditEvent) => void
  list: () => RecordedAuditEvent[]
} {
  const events: RecordedAuditEvent[] = []

  return {
    auditLog(event) {
      const recorded = normalizeAuditEvent(event)
      events.push(recorded)
      sink?.(recorded)
    },
    list() {
      return events.map(event => structuredClone(event))
    },
  }
}

export function auditLog(
  event: AuditEvent,
  sink: (event: RecordedAuditEvent) => void = () => undefined,
): void {
  sink(normalizeAuditEvent(event))
}

function normalizeAuditEvent(event: AuditEvent): RecordedAuditEvent {
  return {
    event_type: sanitizeInput(event.event_type),
    actor: sanitizeInput(event.actor),
    outcome: sanitizeInput(event.outcome),
    timestamp: sanitizeInput(event.timestamp ?? formatIso8601(new Date())),
    project_id: event.project_id ? sanitizeInput(event.project_id) : undefined,
    metadata: event.metadata
      ? (serializeAuditSafe(event.metadata) as Record<string, unknown>)
      : undefined,
  }
}

