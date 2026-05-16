import { describe, expect, it } from 'bun:test'

import {
  createChannelBridge,
  createMcpServer,
  validateMcpToolInput,
  type McpTool,
} from './index.js'

describe('mcp', () => {
  it('serves tool descriptors and validates calls', async () => {
    const echoTool: McpTool = {
      name: 'echo',
      description: 'Echo text',
      inputSchema: { type: 'object' },
      execute(input) {
        return {
          content: [{ type: 'json', value: input }],
        }
      },
    }
    const server = createMcpServer([echoTool])

    expect(server.listTools()).toEqual([
      { name: 'echo', description: 'Echo text', inputSchema: { type: 'object' } },
    ])
    expect(await server.callTool('echo', { text: 'hello' })).toEqual({
      ok: true,
      value: {
        content: [{ type: 'json', value: { text: 'hello' } }],
      },
    })
    expect(await server.callTool('missing', {})).toEqual({ ok: false, error: 'tool_not_found' })
  })

  it('rejects non-object tool input before execution', () => {
    expect(validateMcpToolInput('bad')).toEqual({
      ok: false,
      error: 'MCP tool input must be an object.',
    })
  })

  it('bridges channel messages into tool input contracts', () => {
    const bridge = createChannelBridge({
      channelId: 'telegram-main',
      map: message => ({ text: String(message['text'] ?? '') }),
    })

    expect(bridge.toToolInput({ text: 'run check' })).toEqual({
      ok: true,
      value: { text: 'run check' },
    })
    expect(bridge.toToolInput(null)).toEqual({
      ok: false,
      error: 'Channel bridge message must be an object.',
    })
  })
})
