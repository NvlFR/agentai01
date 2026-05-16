import { appendFileSync } from 'node:fs'

import { formatIso8601, mapDeep } from '../shared/index.js'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type LogContext = Record<string, unknown>
export type LogOutputFormat = 'json' | 'text'

export type LogEntry = {
  timestamp: string
  level: LogLevel
  message: string
  subsystem?: string
  correlation_id?: string
  context?: LogContext
}

export type LoggerChildBindings = {
  subsystem?: string
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
  writer?: LogWriter
  bindings?: LoggerChildBindings
  format?: LogOutputFormat
}

export type LogWriter = (entry: LogEntry) => void

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
  const writer = options.writer ?? createConsoleLogWriter(options.format ?? 'json')
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

export function getMinimumLogLevelForEnvironment(env: string = 'development'): LogLevel {
  if (env === 'production') {
    return 'info'
  }

  if (env === 'test') {
    return 'warn'
  }

  return 'debug'
}

export function createSubsystemLogger(
  subsystem: string,
  options: Omit<CreateLoggerOptions, 'bindings'> = {},
): Logger {
  return createLogger({
    ...options,
    bindings: {
      subsystem,
    },
  })
}

export function createConsoleLogWriter(format: LogOutputFormat = 'json'): LogWriter {
  return entry => {
    const serialized = `${formatLogEntry(entry, format)}\n`
    if (entry.level === 'error') {
      process.stderr.write(serialized)
      return
    }

    process.stdout.write(serialized)
  }
}

export function createFileLogWriter(filePath: string): LogWriter {
  return entry => {
    appendFileSync(filePath, `${formatLogEntry(entry, 'json')}\n`, 'utf8')
  }
}

export function formatLogEntry(entry: LogEntry, format: LogOutputFormat): string {
  if (format === 'json') {
    return JSON.stringify(entry)
  }

  const subsystem = entry.subsystem ? ` [${entry.subsystem}]` : ''
  const correlation = entry.correlation_id ? ` (${entry.correlation_id})` : ''
  const context = entry.context ? ` ${JSON.stringify(entry.context)}` : ''
  return `${entry.timestamp} ${entry.level.toUpperCase()}${subsystem}${correlation} ${entry.message}${context}`
}

export function redactLogMessage(message: string): string {
  const inlineRedacted = INLINE_SECRET_PATTERNS.reduce(
    (current, pattern) => current.replace(pattern, match => {
      if (match.includes(REDACTED)) {
        return match
      }

      if (match.toLowerCase().startsWith('bearer ')) {
        return `Bearer ${REDACTED}`
      }

      return REDACTED
    }),
    message,
  )

  return inlineRedacted.replace(
    KEY_VALUE_SECRET_PATTERN,
    (_, key: string, separator: string) => `${key}${separator}${REDACTED}`,
  )
}

export function redactLogContext(context: LogContext): LogContext {
  return mapDeep(context, (value, path) => {
    const key = path[path.length - 1]
    if (typeof key === 'string' && SECRET_KEY_PATTERN.test(key)) {
      return {
        handled: true,
        value: REDACTED,
      }
    }

    if (
      typeof value === 'string' &&
      path.some(part => typeof part === 'string' && SECRET_KEY_PATTERN.test(part))
    ) {
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
          message: redactLogMessage(value.message),
          stack: value.stack ? redactLogMessage(value.stack) : undefined,
        },
      }
    }

    if (typeof value === 'string') {
      return {
        handled: true,
        value: redactLogMessage(value),
      }
    }

    return {
      handled: false,
    }
  }) as LogContext
}

function buildEntry(
  level: LogLevel,
  message: string,
  context: LogContext | undefined,
  bindings: LoggerChildBindings,
): LogEntry {
  const mergedContext = mergeContexts(bindings.context, context)
  const entry: LogEntry = {
    timestamp: formatIso8601(new Date()),
    level,
    message: redactLogMessage(message),
  }

  if (bindings.subsystem) {
    entry.subsystem = bindings.subsystem
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

function normalizeBindings(bindings: LoggerChildBindings | undefined): LoggerChildBindings {
  if (!bindings) {
    return {}
  }

  return {
    subsystem: bindings.subsystem,
    correlation_id: bindings.correlation_id,
    context: bindings.context ? { ...bindings.context } : undefined,
  }
}

function mergeBindings(
  parent: LoggerChildBindings,
  child: LoggerChildBindings,
): LoggerChildBindings {
  return {
    subsystem: child.subsystem ?? parent.subsystem,
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
