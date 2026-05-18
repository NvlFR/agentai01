import { describe, expect, it } from 'bun:test'
import { createTelemetryPipeline } from './telemetry.js'

describe('createTelemetryPipeline', () => {
  it('redacts secret-bearing payloads before exporting', () => {
    const events: unknown[] = []
    const pipeline = createTelemetryPipeline({
      now: () => '2026-05-18T00:00:00.000Z',
      exporters: [{ export: event => events.push(event) }],
    })

    pipeline.record({
      name: 'provider request Bearer sk-secret',
      level: 'info',
      attributes: { api_key: 'secret-value' },
    })

    expect(events).toEqual([
      {
        name: 'provider request Bearer [REDACTED]',
        level: 'info',
        timestamp: '2026-05-18T00:00:00.000Z',
        attributes: { api_key: '[REDACTED]' },
      },
    ])
  })
})
