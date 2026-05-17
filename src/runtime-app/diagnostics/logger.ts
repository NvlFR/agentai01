import pino, { type DestinationStream, type Logger as PinoLogger, type LoggerOptions } from 'pino'
import pretty from 'pino-pretty'

export interface Logger {
  debug(message: string, ...args: unknown[]): void
  info(message: string, ...args: unknown[]): void
  warn(message: string, ...args: unknown[]): void
  error(message: string, ...args: unknown[]): void
  child(bindings: Record<string, unknown>): Logger
}

function resolveLogType(): 'json' | 'pretty' {
  const env = process.env['APP_ENV'] ?? process.env['NODE_ENV'] ?? 'development'
  return env === 'production' ? 'json' : 'pretty'
}

export function createPinoDestination(mode = resolveLogType()): DestinationStream {
  if (mode === 'pretty') {
    return pretty({
      colorize: true,
      ignore: 'pid,hostname',
      singleLine: true,
    })
  }

  return pino.destination(1)
}

function wrapPinoLogger(inner: PinoLogger): Logger {
  return {
    debug: (msg, ...args) => inner.debug(mergeLogArgs(args), msg),
    info: (msg, ...args) => inner.info(mergeLogArgs(args), msg),
    warn: (msg, ...args) => inner.warn(mergeLogArgs(args), msg),
    error: (msg, ...args) => inner.error(mergeLogArgs(args), msg),
    child: bindings => wrapPinoLogger(inner.child(sanitizeBindings(bindings))),
  }
}

export function createLogger(name: string): Logger {
  const options: LoggerOptions = {
    name,
    level: resolveLogType() === 'json' ? 'info' : 'debug',
    redact: {
      paths: ['apiKey', 'token', 'authorization', '*.apiKey', '*.token', '*.authorization'],
      censor: '[REDACTED]',
    },
    base: undefined,
  }
  const inner = pino(options, createPinoDestination())
  return wrapPinoLogger(inner)
}

export const rootLogger: Logger = createLogger('runtime-app')

function sanitizeBindings(bindings: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(bindings).map(([key, value]) => {
    if (typeof key === 'string' && /(token|api[-_]?key|authorization)/i.test(key)) {
      return [key, '[REDACTED]']
    }

    return [key, value]
  }))
}

function mergeLogArgs(args: unknown[]): Record<string, unknown> | undefined {
  const objectEntries = args.filter((entry): entry is Record<string, unknown> => {
    return typeof entry === 'object' && entry !== null && !Array.isArray(entry)
  })

  if (objectEntries.length === 0) {
    return undefined
  }

  return Object.assign({}, ...objectEntries)
}
