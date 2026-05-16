import { isRecord, mapDeep, type Result, err, ok } from '../shared/index.js'

export type RuleMetadata = {
  id: string
  message: string
  severity: string
  languages: string[]
}

const SECRET_KEY_PATTERN = /(secret|token|password|key|authorization)/i
const CONTROL_CHARS_PATTERN = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g

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

export function serializeAuditSafe<T>(value: T): T {
  return mapDeep(value, (current, path) => {
    const key = path[path.length - 1]
    if (typeof key === 'string' && SECRET_KEY_PATTERN.test(key)) {
      return {
        handled: true,
        value: '[REDACTED]',
      }
    }

    if (typeof current === 'string') {
      return {
        handled: true,
        value: sanitizeInput(current),
      }
    }

    return {
      handled: false,
    }
  }) as T
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
