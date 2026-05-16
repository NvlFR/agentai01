import { describe, expect, test } from 'bun:test'
import { normalizeToolResult } from '../tools/index.js'
import {
  PLUGIN_KINDS,
  createPluginContext,
  isPluginKind,
  type ChannelPlugin,
  type PluginContext,
  type ProviderPlugin,
  type ToolPlugin,
} from './types.js'

describe('plugin-sdk/types', () => {
  test('exposes plugin kinds as runtime values', () => {
    expect(PLUGIN_KINDS).toEqual(['provider', 'channel', 'tool'])
    expect(isPluginKind('provider')).toBe(true)
    expect(isPluginKind('channel')).toBe(true)
    expect(isPluginKind('other')).toBe(false)
  })

  test('normalizes plugin context while keeping optional fields', () => {
    const logger = { info() {}, warn() {}, error() {} }

    expect(createPluginContext({ plugin_id: ' plugin-a ', project_id: 'project-1', logger })).toEqual({
      plugin_id: 'plugin-a',
      project_id: 'project-1',
      logger,
    })
  })

  test('supports provider, channel, and tool contracts', async () => {
    const calls: string[] = []
    const context: PluginContext = { plugin_id: 'demo-plugin' }

    const provider: ProviderPlugin = {
      kind: 'provider',
      async complete(prompt, pluginContext) {
        calls.push(`provider:${pluginContext.plugin_id}:${prompt}`)
        return `${prompt} done`
      },
    }

    const channel: ChannelPlugin = {
      kind: 'channel',
      id: 'demo-channel',
      meta: { id: 'demo-channel', name: 'Demo', description: 'Demo channel' },
      config: {
        listAccountIds() {
          return ['default']
        },
        resolveAccount() {
          return { accountId: 'default' }
        },
      },
      async send(message, pluginContext) {
        calls.push(`channel:${pluginContext.plugin_id}:${message.target}:${message.body}`)
      },
    }

    const tool: ToolPlugin = {
      kind: 'tool',
      tools: [{
        name: 'echo',
        description: 'Echo input',
        input_schema: {},
        owner: { kind: 'plugin', plugin_id: 'demo-plugin' },
        executor: { kind: 'plugin', plugin_id: 'demo-plugin', tool_name: 'echo' },
      }],
      async execute(_toolName, input, pluginContext) {
        calls.push(`tool:${pluginContext.plugin_id}`)
        return normalizeToolResult(input)
      },
    }

    await expect(provider.complete('work', context)).resolves.toBe('work done')
    await expect(channel.send({ target: 'ops', body: 'hello' }, context)).resolves.toBeUndefined()
    const toolResult = await tool.execute('echo', 'payload', context)

    expect(toolResult.ok).toBe(true)
    expect(toolResult.ok ? toolResult.value.output : undefined).toBe('payload')
    expect(calls).toEqual([
      'provider:demo-plugin:work',
      'channel:demo-plugin:ops:hello',
      'tool:demo-plugin',
    ])
  })
})
