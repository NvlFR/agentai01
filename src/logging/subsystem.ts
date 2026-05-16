import { createLogger, type CreateLoggerOptions, type Logger } from './logger.js'

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
