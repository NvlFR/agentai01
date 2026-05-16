import { describe, expect, it } from 'bun:test'
import { buildContextBatch, type ContextItem } from './batch.js'

describe('buildContextBatch', () => {
  it('prioritizes matching items within the available window', async () => {
    const items: ContextItem[] = [
      {
        id: 'low',
        content: 'older low priority',
        owner: { projectId: 'alpha' },
        priority: 'low',
        createdAt: '2026-05-01T00:00:00.000Z',
        tokenEstimate: 5,
      },
      {
        id: 'critical',
        content: 'must keep',
        owner: { projectId: 'alpha' },
        priority: 'critical',
        createdAt: '2026-05-15T00:00:00.000Z',
        tokenEstimate: 6,
      },
      {
        id: 'other-project',
        content: 'not for alpha',
        owner: { projectId: 'beta' },
        priority: 'critical',
        createdAt: '2026-05-16T00:00:00.000Z',
        tokenEstimate: 1,
      },
    ]

    const batch = await buildContextBatch(
      { projectId: 'alpha' },
      items,
      { maxTokens: 10, reservedOutputTokens: 2 },
      undefined,
      new Date('2026-05-16T00:00:00.000Z'),
    )

    expect(batch.included.map(item => item.id)).toEqual(['critical'])
    expect(batch.compressed).toHaveLength(0)
    expect(batch.omitted.map(item => item.id)).toEqual(['low'])
  })

  it('uses compression hook for overflow when budget remains', async () => {
    const items: ContextItem[] = [
      {
        id: 'primary',
        content: 'primary',
        owner: { agentId: 'support' },
        priority: 'high',
        createdAt: '2026-05-16T00:00:00.000Z',
        tokenEstimate: 3,
      },
      {
        id: 'overflow',
        content: 'long overflow content',
        owner: { agentId: 'support' },
        priority: 'normal',
        createdAt: '2026-05-16T00:00:00.000Z',
        tokenEstimate: 5,
      },
    ]

    const batch = await buildContextBatch(
      { agentId: 'support' },
      items,
      { maxTokens: 7, reservedOutputTokens: 1 },
      async overflow => ({
        id: 'summary',
        content: overflow.map(item => item.id).join(','),
        owner: { agentId: 'support' },
        priority: 'normal',
        createdAt: '2026-05-16T00:00:01.000Z',
        tokenEstimate: 2,
      }),
    )

    expect(batch.included.map(item => item.id)).toEqual(['primary'])
    expect(batch.compressed.map(item => item.id)).toEqual(['summary'])
    expect(batch.omitted).toHaveLength(0)
    expect(batch.remainingTokens).toBe(1)
  })
})
