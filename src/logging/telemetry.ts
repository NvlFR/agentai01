import { redactLogContext, redactLogMessage, type LogContext } from './redaction.js'
import type { Logger } from './logger.js'

export type TelemetryEvent = {
  readonly name: string
  readonly timestamp: string
  readonly level: 'debug' | 'info' | 'warn' | 'error'
  readonly attributes?: LogContext
}

export type TelemetrySpan = {
  readonly name: string
  readonly startedAt: string
  end(attributes?: LogContext): void
}

export type TelemetryExporter = {
  export(event: TelemetryEvent): void
}

export function createTelemetryPipeline(input: {
  readonly enabled?: boolean
  readonly logger?: Logger
  readonly exporters?: readonly TelemetryExporter[]
  readonly now?: () => string
} = {}) {
  const enabled = input.enabled ?? true
  const now = input.now ?? (() => new Date().toISOString())
  const exporters = [...(input.exporters ?? [])]

  function emit(event: Omit<TelemetryEvent, 'timestamp'>): TelemetryEvent {
    const normalized: TelemetryEvent = {
      ...event,
      timestamp: now(),
      name: redactLogMessage(event.name),
      attributes: event.attributes ? redactLogContext(event.attributes) : undefined,
    }

    if (!enabled) {
      return normalized
    }

    logEvent(normalized, input.logger)
    for (const exporter of exporters) {
      exporter.export(normalized)
    }

    return normalized
  }

  return {
    record(event: Omit<TelemetryEvent, 'timestamp'>): TelemetryEvent {
      return emit(event)
    },
    startSpan(name: string, attributes?: LogContext): TelemetrySpan {
      const startedAt = now()
      emit({ name: `${name}:start`, level: 'debug', attributes })
      return {
        name,
        startedAt,
        end(extraAttributes) {
          emit({
            name: `${name}:end`,
            level: 'debug',
            attributes: {
              ...(attributes ?? {}),
              ...(extraAttributes ?? {}),
              started_at: startedAt,
            },
          })
        },
      }
    },
  }
}

function logEvent(event: TelemetryEvent, logger?: Logger): void {
  if (!logger) {
    return
  }

  switch (event.level) {
    case 'debug':
      logger.debug(event.name, event.attributes)
      return
    case 'info':
      logger.info(event.name, event.attributes)
      return
    case 'warn':
      logger.warn(event.name, event.attributes)
      return
    case 'error':
      logger.error(event.name, event.attributes)
  }
}
