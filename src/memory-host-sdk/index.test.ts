import { describe, expect, it } from 'bun:test'
import { MemoryHostIndex, type MemoryIndexHookEvent } from './index.js'

describe('memory-host-sdk', () => {
  it('indexes, searches by namespace and context, and emits hooks', async () => {
    const index = new MemoryHostIndex()
    const events: MemoryIndexHookEvent[] = []
    index.registerIndexHook(event => {
      events.push(event)
    })

    await index.upsert({
      id: 'doc-1',
      namespace: 'project:alpha',
      content: 'runtime context budget',
      context: { projectId: 'alpha', agentId: 'engineering' },
      updatedAt: '2026-05-16T00:00:00.000Z',
    })
    await index.upsert({
      id: 'doc-2',
      namespace: 'project:beta',
      content: 'runtime memory',
      context: { projectId: 'beta', agentId: 'support' },
      updatedAt: '2026-05-16T00:01:00.000Z',
    })

    const results = await index.search({
      namespace: 'project:alpha',
      query: 'runtime budget',
      context: { projectId: 'alpha' },
    })
    await index.delete('project:alpha', 'doc-1')

    expect(results.map(result => result.document.id)).toEqual(['doc-1'])
    expect(results[0]?.score).toBe(2)
    expect(events.map(event => event.type)).toEqual(['indexed', 'indexed', 'deleted'])
  })
})
