import { describe, expect, it } from 'bun:test'
import { createMcpService, normalizeMcpHeaders } from './service.js'

describe('mcp service helpers', () => {
  it('normalizes auth headers', () => {
    expect(normalizeMcpHeaders({ Authorization: ' Bearer abc ', Empty: '' })).toEqual({
      authorization: 'Bearer abc',
    })
  })

  it('wraps client tool calls as results', async () => {
    const service = createMcpService({
      client: {
        async listTools() {
          return []
        },
        async callTool() {
          return { content: [{ type: 'text', value: 'ok' }] }
        },
      },
    })

    const result = await service.callTool('ping', {})
    expect(result.ok).toBe(true)
  })
})
