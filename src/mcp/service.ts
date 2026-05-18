import { err, ok, type Result } from '../shared/index.js'
import type { McpClientContract, McpToolInput, McpToolOutput } from './index.js'

export function normalizeMcpHeaders(headers: Readonly<Record<string, string | undefined>>): Record<string, string> {
  const normalized: Record<string, string> = {}
  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === 'string' && value.trim()) {
      normalized[key.toLowerCase()] = value.trim()
    }
  }
  return normalized
}

export function createMcpService(input: {
  readonly client: McpClientContract
  readonly authHeaders?: Readonly<Record<string, string | undefined>>
}) {
  const headers = normalizeMcpHeaders(input.authHeaders ?? {})
  return {
    headers,
    async listTools() {
      return input.client.listTools()
    },
    async callTool(name: string, payload: McpToolInput): Promise<Result<McpToolOutput, string>> {
      try {
        return ok(await input.client.callTool(name, payload))
      } catch (error) {
        return err(error instanceof Error ? error.message : String(error))
      }
    },
  }
}
