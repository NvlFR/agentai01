import { formatIso8601, isRecord, mapDeep, type Result, err, ok } from '../shared/index.js'
import { redactSecret } from '../secrets/index.js'

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

export type RuleMetadata = {
  id: string
  message: string
  severity: string
  languages: string[]
}

const SECRET_KEY_PATTERN = /(secret|token|password|key|authorization)/i
const CONTROL_CHARS_PATTERN = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g

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

export function sanitizeInput(value: string): string {
  return value.replace(CONTROL_CHARS_PATTERN, '')
}

export function assertNoBoundaryViolation(
  importPath: string,
  allowedPrefixes: string[],
): void {
  if (allowedPrefixes.some(prefix => importPath.startsWith(prefix))) {
    return
  }

  throw new Error(`Boundary violation: ${importPath}`)
}

export function validateOperatorToken(
  token: string | null | undefined,
): Result<string, 'missing'> {
  if (!token || sanitizeInput(token).trim().length === 0) {
    return err('missing')
  }

  return ok(sanitizeInput(token).trim())
}

export function validateRuleMetadata(input: unknown): Result<RuleMetadata, string[]> {
  if (!isRecord(input)) {
    return err(['Rule metadata must be an object.'])
  }

  const errors: string[] = []
  const id = typeof input['id'] === 'string' ? input['id'].trim() : ''
  const message = typeof input['message'] === 'string' ? input['message'].trim() : ''
  const severity = typeof input['severity'] === 'string' ? input['severity'].trim() : ''
  const languages = Array.isArray(input['languages'])
    ? input['languages'].filter((entry): entry is string => typeof entry === 'string')
    : []

  if (!id) {
    errors.push('Rule metadata field "id" is required.')
  }
  if (!message) {
    errors.push('Rule metadata field "message" is required.')
  }
  if (!severity) {
    errors.push('Rule metadata field "severity" is required.')
  }
  if (languages.length === 0) {
    errors.push('Rule metadata field "languages" must contain at least one language.')
  }

  if (errors.length > 0) {
    return err(errors)
  }

  return ok({
    id,
    message,
    severity,
    languages,
  })
}

export function serializeAuditSafe<T>(value: T): T {
  return mapDeep(value, (current, path) => {
    const key = path[path.length - 1]
    if (typeof key === 'string' && SECRET_KEY_PATTERN.test(key)) {
      return {
        handled: true,
        value: redactSecret(String(current ?? '')),
      }
    }

    if (typeof current === 'string') {
      const sanitized = sanitizeInput(current)
      if (
        path.some(part => typeof part === 'string' && SECRET_KEY_PATTERN.test(part))
      ) {
        return {
          handled: true,
          value: redactSecret(sanitized),
        }
      }

      return {
        handled: true,
        value: sanitized,
      }
    }

    return {
      handled: false,
    }
  }) as T
}

function normalizeAuditEvent(event: AuditEvent): RecordedAuditEvent {
  return {
    event_type: sanitizeInput(event.event_type),
    actor: sanitizeInput(event.actor),
    outcome: sanitizeInput(event.outcome),
    timestamp: event.timestamp ?? formatIso8601(new Date()),
    project_id: event.project_id ? sanitizeInput(event.project_id) : undefined,
    metadata: event.metadata
      ? serializeAuditSafe(event.metadata) as Record<string, unknown>
      : undefined,
  }
}
