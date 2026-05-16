import type { ToolDescriptor, ToolExecutionResult } from '../tools/index.js'

export const PLUGIN_KINDS = ['provider', 'channel', 'tool'] as const

export type PluginKind = (typeof PLUGIN_KINDS)[number]

export type PluginContext = {
  readonly plugin_id: string
  readonly project_id?: string
  readonly logger?: PluginLogger
}

export type PluginLogger = {
  info(message: string, context?: Record<string, unknown>): void
  warn(message: string, context?: Record<string, unknown>): void
  error(message: string, context?: Record<string, unknown>): void
  debug?(message: string, context?: Record<string, unknown>): void
}

export type ProviderPlugin = {
  readonly kind: 'provider'
  complete(prompt: string, context: PluginContext): Promise<string>
}

// ---------------------------------------------------------------------------
// Channel Plugin Types
// ---------------------------------------------------------------------------

export type ChannelId = string

export type ChannelMeta = {
  readonly id: ChannelId
  readonly name: string
  readonly description: string
  readonly icon?: string
}

export type ChannelCapabilities = {
  readonly supportsMedia?: boolean
  readonly supportsPolls?: boolean
  readonly supportsStreaming?: boolean
  readonly supportsReactions?: boolean
}

export type ChannelSecurityDmPolicy = {
  readonly policy: string
  readonly allowFrom: Array<string | number>
  readonly policyPath?: string
  readonly allowFromPath: string
  readonly approveHint: string
  readonly normalizeEntry?: (raw: string) => string
}

export type ChannelSecurityAdapter<TResolvedAccount = unknown> = {
  readonly resolveDmPolicy?: (params: {
    readonly cfg: unknown
    readonly accountId?: string | null
    readonly account: TResolvedAccount
  }) => ChannelSecurityDmPolicy | null | undefined
  readonly collectWarnings?: (params: {
    readonly cfg: unknown
    readonly account: TResolvedAccount
  }) => string[]
  readonly collectAuditFindings?: (params: {
    readonly cfg: unknown
    readonly account: TResolvedAccount
  }) => string[]
}

export type ChannelPairingAdapter = {
  readonly idLabel: string
  readonly normalizeAllowEntry?: (raw: string) => string
  readonly notifyApproval?: (ctx: {
    readonly accountId: string
    readonly targetId: string
  }) => Promise<void> | void
}

export type ReplyToMode = 'top' | 'thread' | 'auto' | 'off'

export type ChannelThreadingAdapter = {
  readonly resolveReplyToMode?: (params: {
    readonly cfg: unknown
    readonly accountId?: string | null
    readonly chatType?: string | null
  }) => ReplyToMode | null | undefined
}

export type OutboundDeliveryResult = {
  readonly channel: string
  readonly success: boolean
  readonly messageId?: string
  readonly error?: string
}

export type ChannelPollResult = {
  readonly channel: string
  readonly success: boolean
  readonly pollId?: string
  readonly error?: string
}

export type ChannelOutboundAdapter = {
  readonly sendText?: (params: {
    readonly to: string
    readonly text: string
    readonly accountId?: string | null
    readonly threadId?: string | number | null
  }) => Promise<OutboundDeliveryResult>
  readonly sendMedia?: (params: {
    readonly to: string
    readonly media: unknown
    readonly accountId?: string | null
    readonly threadId?: string | number | null
  }) => Promise<OutboundDeliveryResult>
  readonly sendPoll?: (params: {
    readonly to: string
    readonly poll: unknown
    readonly accountId?: string | null
    readonly threadId?: string | number | null
  }) => Promise<ChannelPollResult>
}

export type ChannelSetupAdapter = {
  readonly applyAccountConfig: (params: {
    readonly cfg: unknown
    readonly accountId: string
    readonly input: unknown
  }) => unknown
}

export type ChannelConfigAdapter<TResolvedAccount = unknown> = {
  readonly listAccountIds: (cfg: unknown) => string[]
  readonly resolveAccount: (cfg: unknown, accountId?: string | null) => TResolvedAccount
}

export type ChannelGroupAdapter = {
  readonly resolveRequireMention?: (params: {
    readonly accountId: string
    readonly groupId: string
  }) => boolean | undefined
}

export type ChannelConversationBindingSupport = {
  readonly supportsCurrentConversationBinding?: boolean
}

export type ChannelMessagingAdapter = {
  readonly resolveOutboundSessionRoute?: (params: {
    readonly to: string
    readonly accountId?: string | null
  }) => unknown
}

export type ChannelPlugin<TResolvedAccount = unknown, Probe = unknown, Audit = unknown> = {
  readonly kind: 'channel'
  readonly id: ChannelId
  readonly meta: ChannelMeta
  readonly setup?: ChannelSetupAdapter
  readonly config: ChannelConfigAdapter<TResolvedAccount>
  readonly configSchema?: unknown
  readonly capabilities?: ChannelCapabilities
  readonly security?: ChannelSecurityAdapter<TResolvedAccount>
  readonly pairing?: ChannelPairingAdapter
  readonly threading?: ChannelThreadingAdapter
  readonly outbound?: ChannelOutboundAdapter
  readonly groups?: ChannelGroupAdapter
  readonly messaging?: ChannelMessagingAdapter
  readonly conversationBindings?: ChannelConversationBindingSupport
  readonly setupWizard?: unknown
  readonly commands?: unknown
  readonly doctor?: unknown
  readonly agentPrompt?: unknown
  readonly streaming?: unknown
  readonly reload?: unknown
  readonly gatewayMethods?: string[]
  // Legacy send method for backward compatibility if needed
  send(message: { readonly target: string; readonly body: string }, context: PluginContext): Promise<void>
}

// ---------------------------------------------------------------------------
// Tool Plugin Types
// ---------------------------------------------------------------------------

export type ToolPlugin = {
  readonly kind: 'tool'
  readonly tools: readonly ToolDescriptor[]
  execute(toolName: string, input: unknown, context: PluginContext): Promise<ToolExecutionResult>
}

export type RuntimePlugin = ProviderPlugin | ChannelPlugin | ToolPlugin

export type PluginFactory = (context: PluginContext) => RuntimePlugin | Promise<RuntimePlugin>

export function isPluginKind(value: unknown): value is PluginKind {
  return typeof value === 'string' && PLUGIN_KINDS.includes(value as PluginKind)
}

export function createPluginContext(context: PluginContext): PluginContext {
  const pluginId = context.plugin_id.trim()
  return {
    plugin_id: pluginId,
    ...(context.project_id ? { project_id: context.project_id } : {}),
    ...(context.logger ? { logger: context.logger } : {}),
  }
}
