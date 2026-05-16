import { describe, expect, test } from 'bun:test'
import type { PluginContext, ToolPlugin } from './index.js'
import { normalizeToolResult } from '../tools/index.js'

describe('plugin-sdk', () => {
  test('exposes a tool plugin contract compatible with tool results', async () => {
    const plugin: ToolPlugin = {
      kind: 'tool',
      tools: [{
        name: 'echo',
        description: 'Echo input',
        input_schema: {},
        owner: { kind: 'plugin', plugin_id: 'echo-plugin' },
        executor: { kind: 'plugin', plugin_id: 'echo-plugin', tool_name: 'echo' },
      }],
      execute: async (_toolName: string, input: unknown, _context: PluginContext) => normalizeToolResult(input),
    }

    const result = await plugin.execute('echo', 'hello', { plugin_id: 'echo-plugin' })

    expect(result.ok).toBe(true)
    expect(result.ok ? result.value.output : undefined).toBe('hello')
  })
})
