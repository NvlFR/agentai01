import { err, isRecord, ok, type Result } from '../shared/index.js'

export type McpToolInput = Record<string, unknown>
export type McpToolOutput = {
  content: readonly {
    type: 'text' | 'json'
    value: string | Record<string, unknown>
  }[]
}

export type McpToolDescriptor = {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

export type McpTool = McpToolDescriptor & {
  execute(input: McpToolInput): Promise<McpToolOutput> | McpToolOutput
}

export type McpServerContract = {
  listTools(): readonly McpToolDescriptor[]
  callTool(name: string, input: unknown): Promise<Result<McpToolOutput, string>>
}

export type McpClientContract = {
  listTools(): Promise<readonly McpToolDescriptor[]>
  callTool(name: string, input: McpToolInput): Promise<McpToolOutput>
}

export type McpChannelBridge = {
  channelId: string
  toToolInput(message: unknown): Result<McpToolInput, string>
}

export * from './service.js'
export * from './repositories.js'
export * from './projectConfig.js'

export function createMcpServer(tools: readonly McpTool[]): McpServerContract {
  const byName = new Map(tools.map(tool => [tool.name, tool]))

  return {
    listTools() {
      return tools.map(({ name, description, inputSchema }) => ({
        name,
        description,
        inputSchema: structuredClone(inputSchema),
      }))
    },
    async callTool(name, input) {
      const tool = byName.get(name)
      if (!tool) {
        return err('tool_not_found')
      }

      const validated = validateMcpToolInput(input)
      if (!validated.ok) {
        return err(validated.error)
      }

      return ok(await tool.execute(validated.value))
    },
  }
}

export function validateMcpToolInput(input: unknown): Result<McpToolInput, string> {
  if (!isRecord(input)) {
    return err('MCP tool input must be an object.')
  }

  return ok(input)
}

export function createChannelBridge(input: {
  channelId: string
  map: (message: Record<string, unknown>) => McpToolInput
}): McpChannelBridge {
  return {
    channelId: input.channelId,
    toToolInput(message) {
      if (!isRecord(message)) {
        return err('Channel bridge message must be an object.')
      }

      return ok(input.map(message))
    },
  }
}
