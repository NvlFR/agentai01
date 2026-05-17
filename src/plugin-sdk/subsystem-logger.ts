// Adapted using referensi/openclaw/src/plugin-sdk/runtime.ts
import {
  createSubsystemLogger as createBaseSubsystemLogger,
  type CreateLoggerOptions,
  type Logger,
} from '../logging/index.js'

export type PluginLogger = {
  debug(message: string, context?: Record<string, unknown>): void
  info(message: string, context?: Record<string, unknown>): void
  warn(message: string, context?: Record<string, unknown>): void
  error(message: string, context?: Record<string, unknown>): void
  child(bindings: { subsystem?: string; correlation_id?: string }): PluginLogger
}

export function createSubsystemLogger(
  subsystem: string,
  options: Omit<CreateLoggerOptions, 'bindings'> = {},
): PluginLogger {
  const logger = createBaseSubsystemLogger(subsystem, options)
  return wrapLogger(logger)
}

function wrapLogger(logger: Logger): PluginLogger {
  return {
    debug(message, context) {
      logger.debug(message, context)
    },
    info(message, context) {
      logger.info(message, context)
    },
    warn(message, context) {
      logger.warn(message, context)
    },
    error(message, context) {
      logger.error(message, context)
    },
    child(bindings) {
      return wrapLogger(
        logger.child({
          subsystem: bindings.subsystem,
          correlation_id: bindings.correlation_id,
        }),
      )
    },
  }
}
