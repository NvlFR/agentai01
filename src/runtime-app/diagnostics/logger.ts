// src/runtime-app/diagnostics/logger.ts
// Structured logger factory using tslog.

import { Logger as TsLogger } from 'tslog'

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

function wrapTsLogger(inner: TsLogger<unknown>): Logger {
  return {
    debug: (msg, ...args) => inner.debug(msg, ...args),
    info: (msg, ...args) => inner.info(msg, ...args),
    warn: (msg, ...args) => inner.warn(msg, ...args),
    error: (msg, ...args) => inner.error(msg, ...args),
    child: (bindings) => wrapTsLogger(inner.getSubLogger(bindings)),
  }
}

export function createLogger(name: string): Logger {
  const inner = new TsLogger({ name, type: resolveLogType() })
  return wrapTsLogger(inner)
}

export const rootLogger: Logger = createLogger('runtime-app')
