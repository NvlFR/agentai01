import { describe, expect, it } from 'bun:test'
import type { ContextItem } from './batch.js'
import { scoreContextItem } from './score.js'

describe('scoreContextItem', () => {
  it('prefers higher priority and fresher attributable items', () => {
    const now = new Date('2026-05-16T00:00:00.000Z')
    const low: ContextItem = {
      id: 'low',
      content: 'older low priority',
      owner: { projectId: 'alpha' },
      priority: 'low',
      createdAt: '2026-05-01T00:00:00.000Z',
    }
    const critical: ContextItem = {
      id: 'critical',
      content: 'must keep',
      owner: { projectId: 'alpha' },
      priority: 'critical',
      createdAt: '2026-05-15T00:00:00.000Z',
    }

    expect(scoreContextItem(critical, now)).toBeGreaterThan(scoreContextItem(low, now))
  })
})
