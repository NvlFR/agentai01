import { describe, expect, test } from 'bun:test'
import { TaskRegistry } from './index.js'

describe('tasks', () => {
  test('tracks dependencies and promotes tasks after dependency success', () => {
    const registry = new TaskRegistry()

    expect(registry.register({ id: 'build', title: 'Build' }).ok).toBe(true)
    expect(registry.register({ id: 'test', title: 'Test', depends_on: ['build'] }).ok).toBe(true)
    expect(registry.listReady().map(task => task.id)).toEqual(['build'])

    const stored = registry.storeResult({ task_id: 'build', status: 'succeeded', output: { ok: true } })

    expect(stored.ok).toBe(true)
    expect(registry.listReady().map(task => task.id)).toEqual(['test'])
  })

  test('rejects duplicate task ids', () => {
    const registry = new TaskRegistry()
    registry.register({ id: 'audit', title: 'Audit' })

    const duplicate = registry.register({ id: 'audit', title: 'Audit again' })

    expect(duplicate).toEqual({
      ok: false,
      error: {
        code: 'duplicate',
        message: 'Task "audit" is already registered.',
        task_id: 'audit',
      },
    })
  })
})
