import { createTelemetryPipeline } from '../../logging/telemetry.js'
import { redactLogContext } from '../../logging/redaction.js'

export type AnalyticsSink = {
  track(event: { readonly name: string; readonly metadata?: Record<string, unknown> }): void
}

export function createAnalyticsService(input: {
  readonly enabled?: boolean
  readonly telemetry?: ReturnType<typeof createTelemetryPipeline>
  readonly sinks?: readonly AnalyticsSink[]
}) {
  const enabled = input.enabled ?? true
  return {
    track(name: string, metadata?: Record<string, unknown>): boolean {
      if (!enabled) {
        return false
      }

      const safeMetadata = redactLogContext(metadata ?? {})
      input.telemetry?.record({ name: `analytics.${name}`, level: 'info', attributes: safeMetadata })
      for (const sink of input.sinks ?? []) {
        sink.track({ name, metadata: safeMetadata })
      }
      return true
    },
  }
}
