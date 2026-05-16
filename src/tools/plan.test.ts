// Adapted from referensi/openclaw/src/tools/plan.test.ts
import { describe, expect, test } from 'bun:test'
import { buildToolPlan } from './plan.js'
import type { ToolDescriptor } from './types.js'

describe('buildToolPlan', () => {
  const descriptor: ToolDescriptor = {
    name: 'search',
    description: 'Search the web',
    input_schema: {},
    owner: { kind: 'core' },
    executor: { kind: 'core', executor_id: 'search' },
    availability: { kind: 'env', name: 'KEY' },
  }

  test('places tool in visible if available', () => {
    const plan = buildToolPlan([descriptor], { env: { KEY: 'val' } })
    expect(plan.visible).toHaveLength(1)
    expect(plan.hidden).toHaveLength(0)
  })

  test('places tool in hidden if unavailable', () => {
    const plan = buildToolPlan([descriptor], { env: {} })
    expect(plan.visible).toHaveLength(0)
    expect(plan.hidden).toHaveLength(1)
    expect(plan.hidden[0].diagnostics[0].reason).toBe('env-missing')
  })

  test('places tool in hidden if executor is missing', () => {
    const noExecutor: ToolDescriptor = { ...descriptor, executor: undefined }
    const plan = buildToolPlan([noExecutor], { env: { KEY: 'val' } })
    expect(plan.visible).toHaveLength(0)
    expect(plan.hidden).toHaveLength(1)
    expect(plan.hidden[0].diagnostics[0].reason).toBe('executor-missing')
  })

  test('sorts tools by sort_key or name', () => {
    const tools: ToolDescriptor[] = [
      { ...descriptor, name: 'b', sort_key: '2' },
      { ...descriptor, name: 'a', sort_key: '1' },
    ]
    const plan = buildToolPlan(tools, { env: { KEY: 'val' } })
    expect(plan.visible[0].descriptor.name).toBe('a')
    expect(plan.visible[1].descriptor.name).toBe('b')
  })
})
