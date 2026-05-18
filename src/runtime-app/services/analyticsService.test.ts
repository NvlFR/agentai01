import { describe, expect, it } from 'bun:test'
import { createAnalyticsService } from './analyticsService.js'

describe('createAnalyticsService', () => {
  it('killswitches analytics safely and redacts metadata', () => {
    const tracked: unknown[] = []
    const service = createAnalyticsService({
      sinks: [{ track: event => tracked.push(event) }],
    })

    expect(service.track('tool_used', { api_key: 'secret' })).toBe(true)
    expect(tracked).toEqual([{ name: 'tool_used', metadata: { api_key: '[REDACTED]' } }])
  })
})
