import { isRecord, mapDeep } from '../shared/index.js'

export type LogContext = Record<string, unknown>

type RedactPattern = {
  pattern: RegExp
  replace: (match: string, ...groups: string[]) => string
}

const SECRET_KEY_PATTERN = /(api[_-]?key|token|secret|password|authorization|cookie|session)/i
const REDACTED = '[REDACTED]'
const COMMON_SECRET_PATTERN = /\b(?:sk-[A-Za-z0-9._\-]+|gh[opusr]_[A-Za-z0-9._\-]+|xox[baprs]-[A-Za-z0-9._\-]+|AIza[A-Za-z0-9._\-]+)\b/g

export const REDACT_PATTERNS: readonly RedactPattern[] = [
  {
    pattern: /\bBearer\s+([^\s,;]+)/gi,
    replace: () => `Bearer ${REDACTED}`,
  },
  {
    pattern:
      /("?(?:api[_-]?key|token|secret|password|authorization|cookie|session)"?\s*:\s*)"([^"]*)"/gi,
    replace: (_, prefix: string) => `${prefix}"${REDACTED}"`,
  },
  {
    pattern:
      /\b(api[_-]?key|token|secret|password|authorization|cookie|session)\b(\s*[:=]\s*)([^\s,;]+)/gi,
    replace: (_, key: string, separator: string) => `${key}${separator}${REDACTED}`,
  },
  {
    pattern: COMMON_SECRET_PATTERN,
    replace: () => REDACTED,
  },
]

export function redactSecrets(text: string): string {
  return REDACT_PATTERNS.reduce(
    (current, { pattern, replace }) => current.replace(pattern, replace),
    text,
  )
}

export function redactLogMessage(message: string): string {
  return redactSecrets(message)
}

export function redactLogContext(context: LogContext): LogContext {
  const mapped = mapDeep(context, (value, path) => {
    const lastPath = path[path.length - 1]
    if (typeof lastPath === 'string' && SECRET_KEY_PATTERN.test(lastPath)) {
      return {
        handled: true,
        value: REDACTED,
      }
    }

    if (value instanceof Error) {
      return {
        handled: true,
        value: {
          name: value.name,
          message: redactSecrets(value.message),
          stack: value.stack ? redactSecrets(value.stack) : undefined,
        },
      }
    }

    if (typeof value === 'string') {
      return {
        handled: true,
        value: redactSecrets(value),
      }
    }

    return {
      handled: false,
    }
  })

  return isRecord(mapped) ? mapped : {}
}

export { REDACTED }
