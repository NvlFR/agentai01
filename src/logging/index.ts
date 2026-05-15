export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type LogContext = Record<string, unknown>

export type LogEntry = {
  timestamp: string
  level: LogLevel
  message: string
  correlation_id?: string
  context?: LogContext
}

export type LoggerChildBindings = {
  correlation_id?: string
  context?: LogContext
}

export type Logger = {
  debug(message: string, context?: LogContext): void
  info(message: string, context?: LogContext): void
  warn(message: string, context?: LogContext): void
  error(message: string, context?: LogContext): void
  child(bindings: LoggerChildBindings): Logger
}

export type CreateLoggerOptions = {
  env?: string
  minLevel?: LogLevel
  writer?: (entry: LogEntry) => void
  bindings?: LoggerChildBindings
}

const SECRET_KEY_PATTERN = /(api[_-]?key|token|secret|password|authorization|cookie|session)/i
const REDACTED = '[REDACTED]'
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}
const INLINE_SECRET_PATTERNS = [
  /\bBearer\s+[A-Za-z0-9._\-=/+]+\b/gi,
  /\bsk-[A-Za-z0-9._\-]+\b/g,
  /\b(?:gh[opusr]_|xox[baprs]-|AIza)[A-Za-z0-9._\-]+\b/g,
]
const KEY_VALUE_SECRET_PATTERN =
  /\b(api[_-]?key|token|secret|password|authorization)\b(\s*[:=]\s*)([^\s,;]+)/gi

export function createLogger(options: CreateLoggerOptions = {}): Logger {
  const minLevel = options.minLevel ?? getMinimumLogLevelForEnvironment(options.env)
  const writer = options.writer ?? writeLogEntry
  const bindings = normalizeBindings(options.bindings)

  return {
    debug(message, context) {
      log('debug', message, context)
    },
    info(message, context) {
      log('info', message, context)
    },
    warn(message, context) {
      log('warn', message, context)
    },
    error(message, context) {
      log('error', message, context)
    },
    child(childBindings) {
      return createLogger({
        minLevel,
        writer,
        bindings: mergeBindings(bindings, childBindings),
      })
    },
  }

  function log(level: LogLevel, message: string, context?: LogContext): void {
    if (!shouldLog(level, minLevel)) {
      return
    }

    const entry = buildEntry(level, message, context, bindings)
    writer(entry)
  }
}

export function getMinimumLogLevelForEnvironment(env = resolveRuntimeEnvironment()): LogLevel {
  if (env === 'production') {
    return 'info'
  }

  if (env === 'test') {
    return 'warn'
  }

  return 'debug'
}

export function redactLogMessage(message: string): string {
  const keyValueRedacted = message.replace(
    KEY_VALUE_SECRET_PATTERN,
    (_, key: string, separator: string) => `${key}${separator}${REDACTED}`,
  )

  return INLINE_SECRET_PATTERNS.reduce(
    (current, pattern) => current.replace(pattern, match => {
      if (match.includes(REDACTED)) {
        return match
      }

      if (match.toLowerCase().startsWith('bearer ')) {
        return `Bearer ${REDACTED}`
      }

      return REDACTED
    }),
    keyValueRedacted,
  )
}

export function redactLogContext(context: LogContext): LogContext {
  return redactValue(context, []) as LogContext
}

function buildEntry(
  level: LogLevel,
  message: string,
  context: LogContext | undefined,
  bindings: LoggerChildBindings,
): LogEntry {
  const mergedContext = mergeContexts(bindings.context, context)
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message: redactLogMessage(message),
  }

  if (bindings.correlation_id) {
    entry.correlation_id = bindings.correlation_id
  }

  if (mergedContext && Object.keys(mergedContext).length > 0) {
    entry.context = redactLogContext(mergedContext)
  }

  return entry
}

function shouldLog(level: LogLevel, minLevel: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[minLevel]
}

function writeLogEntry(entry: LogEntry): void {
  const serialized = `${JSON.stringify(entry)}\n`
  if (entry.level === 'error') {
    process.stderr.write(serialized)
    return
  }

  process.stdout.write(serialized)
}

function normalizeBindings(bindings: LoggerChildBindings | undefined): LoggerChildBindings {
  if (!bindings) {
    return {}
  }

  return {
    correlation_id: bindings.correlation_id,
    context: bindings.context ? { ...bindings.context } : undefined,
  }
}

function mergeBindings(
  parent: LoggerChildBindings,
  child: LoggerChildBindings,
): LoggerChildBindings {
  return {
    correlation_id: child.correlation_id ?? parent.correlation_id,
    context: mergeContexts(parent.context, child.context),
  }
}

function mergeContexts(
  base: LogContext | undefined,
  override: LogContext | undefined,
): LogContext | undefined {
  if (!base && !override) {
    return undefined
  }

  return {
    ...(base ?? {}),
    ...(override ?? {}),
  }
}

function redactValue(value: unknown, parentKeys: string[]): unknown {
  if (Array.isArray(value)) {
    return value.map(item => redactValue(item, parentKeys))
  }

  if (value instanceof Error) {
    return redactValue(
      {
        name: value.name,
        message: value.message,
        stack: value.stack,
      },
      parentKeys,
    )
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => {
        const nextParentKeys = [...parentKeys, key]
        if (SECRET_KEY_PATTERN.test(key)) {
          return [key, redactSecretValue(entryValue)]
        }

        return [key, redactValue(entryValue, nextParentKeys)]
      }),
    )
  }

  if (typeof value === 'string') {
    if (parentKeys.some(key => SECRET_KEY_PATTERN.test(key))) {
      return redactSecretValue(value)
    }

    return redactLogMessage(value)
  }

  return value
}

function redactSecretValue(value: unknown): string {
  if (typeof value === 'string' && value === REDACTED) {
    return value
  }

  const normalized = String(value ?? '')
  return normalized.length === 0 ? normalized : REDACTED
}

function resolveRuntimeEnvironment(): string {
  return process.env['APP_ENV'] ?? process.env['NODE_ENV'] ?? 'development'
}
