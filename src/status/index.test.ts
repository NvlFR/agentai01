import { describe, expect, it } from 'bun:test'

import { aggregateStatus, createStatusRegistry } from './index.js'

describe('StatusRegistry', () => {
  it('aggregates current status, keeps bounded history, and emits changes', () => {
    const registry = createStatusRegistry(2)
    const events: string[] = []
    const unsubscribe = registry.subscribe(event => {
      events.push(`${event.changed.source}:${event.current.level}`)
    })

    registry.update({ source: 'provider', level: 'healthy', message: 'ready' })
    registry.update({ source: 'worker', level: 'degraded', message: 'lagging' })
    registry.update({ source: 'api', level: 'healthy', message: 'ready' })
    unsubscribe()

    expect(registry.snapshot().level).toBe('degraded')
    expect(registry.history().map(message => message.source)).toEqual(['worker', 'api'])
    expect(events).toEqual(['provider:healthy', 'worker:degraded', 'api:degraded'])
  })
})

describe('aggregateStatus', () => {
  it('returns unknown for empty source sets', () => {
    expect(aggregateStatus([])).toBe('unknown')
  })
})
