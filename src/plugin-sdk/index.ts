import type { ToolDescriptor, ToolExecutionResult } from '../tools/index.js'

export type PluginKind = 'provider' | 'channel' | 'tool'

export type PluginContext = {
  readonly plugin_id: string
  readonly project_id?: string
  readonly logger?: {
    info(message: string, context?: Record<string, unknown>): void
    warn(message: string, context?: Record<string, unknown>): void
    error(message: string, context?: Record<string, unknown>): void
  }
}

export type ProviderPlugin = {
  readonly kind: 'provider'
  complete(prompt: string, context: PluginContext): Promise<string>
}

export type ChannelPlugin = {
  readonly kind: 'channel'
  send(message: { readonly target: string; readonly body: string }, context: PluginContext): Promise<void>
}

export type ToolPlugin = {
  readonly kind: 'tool'
  readonly tools: readonly ToolDescriptor[]
  execute(toolName: string, input: unknown, context: PluginContext): Promise<ToolExecutionResult>
}

export type RuntimePlugin = ProviderPlugin | ChannelPlugin | ToolPlugin

export type PluginFactory = (context: PluginContext) => RuntimePlugin | Promise<RuntimePlugin>
