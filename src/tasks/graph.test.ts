// Adapted from referensi/openclaw/src/tasks/graph.test.ts
import { describe, expect, test } from 'bun:test'
import { sortTasksTopologically, wouldCreateCycle } from './graph.js'
import type { RegisteredTask } from './types.js'

describe('task graph logic', () => {
  test('wouldCreateCycle detects cycles', () => {
    const tasks = new Map<string, RegisteredTask>([
      ['t1', { id: 't1', depends_on: ['t2'] } as any]
    ])
    // t2 -> t1
    expect(wouldCreateCycle('t2', ['t1'], id => tasks.get(id))).toBe(true)
    // t2 -> t3 (no cycle)
    expect(wouldCreateCycle('t2', ['t3'], id => tasks.get(id))).toBe(false)
  })

  test('sortTasksTopologically sorts correctly', () => {
    const tasks: RegisteredTask[] = [
      { id: 't2', depends_on: ['t1'] } as any,
      { id: 't1', depends_on: [] } as any,
      { id: 't3', depends_on: ['t2'] } as any,
    ]
    const sorted = sortTasksTopologically(tasks)
    expect(sorted.map(t => t.id)).toEqual(['t1', 't2', 't3'])
  })

  test('sortTasksTopologically throws on cycle', () => {
    const tasks: RegisteredTask[] = [
      { id: 't1', depends_on: ['t2'] } as any,
      { id: 't2', depends_on: ['t1'] } as any,
    ]
    expect(() => sortTasksTopologically(tasks)).toThrow('Cycle detected')
  })
})
