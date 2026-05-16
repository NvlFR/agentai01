import { describe, expect, test } from 'bun:test'
import { buildToolPlan, normalizeToolError, normalizeToolResult, type ToolDescriptor } from './index.js'

const descriptor: ToolDescriptor = {
  name: 'search',
  description: 'Search the web',
  input_schema: {},
  owner: { kind: 'core' },
  executor: { kind: 'core', executor_id: 'search' },
  availability: {
    allOf: [
      { kind: 'env', name: 'SEARCH_API_KEY' },
      { kind: 'plugin-enabled', plugin_id: 'search-pack' },
    ],
  },
}

describe('tools', () => {
  test('buildToolPlan separates visible and hidden tools with diagnostics', () => {
    const plan = buildToolPlan([descriptor], {
      env: { SEARCH_API_KEY: 'present' },
      enabled_plugin_ids: new Set(),
    })

    expect(plan.visible).toHaveLength(0)
    expect(plan.hidden).toHaveLength(1)
    expect(plan.hidden[0]?.diagnostics[0]?.reason).toBe('plugin-disabled')
  })

  test('normalizes results and errors into stable contracts', () => {
    expect(normalizeToolResult({ ok: true }).ok).toBe(true)
    expect(normalizeToolError(new Error('boom'), 'timeout', true)).toEqual({
      code: 'timeout',
      message: 'boom',
      retryable: true,
      details: { name: 'Error' },
    })
  })
})
