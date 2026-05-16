import type {
  ChannelId,
  ChannelMeta,
  ChannelPlugin,
  ChannelSecurityAdapter,
  ChannelPairingAdapter,
  ChannelThreadingAdapter,
  ChannelOutboundAdapter,
  ChannelSecurityDmPolicy,
  ReplyToMode,
  OutboundDeliveryResult,
  ChannelPollResult,
} from './types.js'

// ---------------------------------------------------------------------------
// 1. Shorthand Builders & Helpers
// ---------------------------------------------------------------------------

export function createInlineTextPairingAdapter(params: {
  idLabel: string
  message: string
  normalizeAllowEntry?: ChannelPairingAdapter['normalizeAllowEntry']
  notify: (
    params: {
      readonly accountId: string
      readonly targetId: string
      readonly message: string
    }
  ) => Promise<void> | void
}): ChannelPairingAdapter {
  return {
    idLabel: params.idLabel,
    normalizeAllowEntry: params.normalizeAllowEntry,
    notifyApproval: async (ctx) => {
      await params.notify({ ...ctx, message: params.message })
    },
  }
}

export function createTopLevelChannelReplyToModeResolver(channelId: string) {
  return ({ cfg }: { readonly cfg: unknown; readonly accountId?: string | null; readonly chatType?: string | null }) => {
    const cfgRecord = cfg as Record<string, unknown>
    const channelConfig = (
      cfgRecord.channels as Record<string, { replyToMode?: ReplyToMode }> | undefined
    )?.[channelId]
    return channelConfig?.replyToMode ?? 'off'
  }
}

export function createScopedAccountReplyToModeResolver<TAccount>(params: {
  resolveAccount: (cfg: unknown, accountId?: string | null) => TAccount
  resolveReplyToMode: (
    account: TAccount,
    chatType?: string | null
  ) => ReplyToMode | null | undefined
  fallback?: ReplyToMode
}) {
  return ({ cfg, accountId, chatType }: { readonly cfg: unknown; readonly accountId?: string | null; readonly chatType?: string | null }) =>
    params.resolveReplyToMode(params.resolveAccount(cfg, accountId), chatType) ??
    params.fallback ??
    'off'
}

export function buildAccountScopedDmSecurityPolicy(params: {
  cfg: unknown
  channelKey: string
  accountId?: string | null
  fallbackAccountId?: string | null
  policy?: string | null
  allowFrom?: Array<string | number> | null
  defaultPolicy?: string
  allowFromPathSuffix?: string
  policyPathSuffix?: string
  approveChannelId?: string
  approveHint?: string
  normalizeEntry?: (raw: string) => string
  inheritSharedDefaultsFromDefaultAccount?: boolean
}): ChannelSecurityDmPolicy {
  const DEFAULT_ACCOUNT_ID = 'default'
  const resolvedAccountId = params.accountId ?? params.fallbackAccountId ?? DEFAULT_ACCOUNT_ID
  const cfgRecord = params.cfg as Record<string, unknown>
  const channelConfig = (cfgRecord.channels as Record<string, unknown> | undefined)?.[
    params.channelKey
  ] as { accounts?: Record<string, Record<string, unknown>> } | undefined
  
  const rootBasePath = `channels.${params.channelKey}.`
  const accountBasePath = `channels.${params.channelKey}.accounts.${resolvedAccountId}.`
  const defaultBasePath = `channels.${params.channelKey}.accounts.${DEFAULT_ACCOUNT_ID}.`
  
  const accountConfig = channelConfig?.accounts?.[resolvedAccountId]
  const defaultAccountConfig =
    params.inheritSharedDefaultsFromDefaultAccount && resolvedAccountId !== DEFAULT_ACCOUNT_ID
      ? channelConfig?.accounts?.[DEFAULT_ACCOUNT_ID]
      : undefined

  const resolveFieldName = (suffix: string | undefined, fallbackField: string): string | null =>
    suffix == null || suffix === ""
      ? fallbackField
      : /^[A-Za-z0-9_-]+$/.test(suffix)
        ? suffix
        : null

  const simplePolicyField = resolveFieldName(params.policyPathSuffix, "dmPolicy")
  const simpleAllowFromField = resolveFieldName(params.allowFromPathSuffix, "allowFrom")
  
  const matchesAnyField = (
    config: Record<string, unknown> | undefined,
    fields: Array<string | null>
  ) => fields.some((field) => field != null && config?.[field] !== undefined)

  const basePath =
    simplePolicyField || simpleAllowFromField
      ? matchesAnyField(accountConfig, [simplePolicyField, simpleAllowFromField])
        ? accountBasePath
        : matchesAnyField(defaultAccountConfig, [simplePolicyField, simpleAllowFromField])
          ? defaultBasePath
          : matchesAnyField(channelConfig as Record<string, unknown> | undefined, [
                simplePolicyField,
                simpleAllowFromField,
              ])
            ? rootBasePath
            : accountConfig
              ? accountBasePath
              : rootBasePath
      : accountConfig
        ? accountBasePath
        : rootBasePath

  const allowFromPath = `${basePath}${params.allowFromPathSuffix ?? "allowFrom"}`
  const policyPath =
    params.policyPathSuffix != null ? `${basePath}${params.policyPathSuffix}` : `${basePath}${params.policyPathSuffix ?? "dmPolicy"}`

  return {
    policy: params.policy ?? params.defaultPolicy ?? "pairing",
    allowFrom: params.allowFrom ?? [],
    policyPath,
    allowFromPath,
    approveHint: params.approveHint ?? `Approve via dashboard for channel ${params.approveChannelId ?? params.channelKey}`,
    normalizeEntry: params.normalizeEntry,
  }
}

// ---------------------------------------------------------------------------
// 2. Chat Channel Plugin Builder (Requirement 24)
// ---------------------------------------------------------------------------

type ChatChannelSecurityOptions<TResolvedAccount> = {
  dm: {
    channelKey: string
    resolvePolicy: (account: TResolvedAccount) => string | null | undefined
    resolveAllowFrom: (account: TResolvedAccount) => Array<string | number> | null | undefined
    resolveFallbackAccountId?: (account: TResolvedAccount) => string | null | undefined
    defaultPolicy?: string
    allowFromPathSuffix?: string
    policyPathSuffix?: string
    approveChannelId?: string
    approveHint?: string
    normalizeEntry?: (raw: string) => string
    inheritSharedDefaultsFromDefaultAccount?: boolean
  }
  collectWarnings?: ChannelSecurityAdapter<TResolvedAccount>['collectWarnings']
  collectAuditFindings?: ChannelSecurityAdapter<TResolvedAccount>['collectAuditFindings']
}

type ChatChannelPairingOptions = {
  text: {
    idLabel: string
    message: string
    normalizeAllowEntry?: ChannelPairingAdapter['normalizeAllowEntry']
    notify: (
      params: {
        readonly accountId: string
        readonly targetId: string
        readonly message: string
      }
    ) => Promise<void> | void
  }
}

type ChatChannelThreadingOptions<TResolvedAccount> = 
  | { topLevelReplyToMode: string }
  | {
      scopedAccountReplyToMode: {
        resolveAccount: (cfg: unknown, accountId?: string | null) => TResolvedAccount
        resolveReplyToMode: (
          account: TResolvedAccount,
          chatType?: string | null
        ) => ReplyToMode | null | undefined
        fallback?: ReplyToMode
      }
    }
  | {
      resolveReplyToMode: NonNullable<ChannelThreadingAdapter['resolveReplyToMode']>
    }

type ChatChannelAttachedOutboundOptions = {
  base: Omit<ChannelOutboundAdapter, 'sendText' | 'sendMedia' | 'sendPoll'>
  attachedResults: {
    channel: string
    sendText?: (
      params: Parameters<NonNullable<ChannelOutboundAdapter['sendText']>>[0]
    ) => Promise<Omit<OutboundDeliveryResult, 'channel'>>
    sendMedia?: (
      params: Parameters<NonNullable<ChannelOutboundAdapter['sendMedia']>>[0]
    ) => Promise<Omit<OutboundDeliveryResult, 'channel'>>
    sendPoll?: (
      params: Parameters<NonNullable<ChannelOutboundAdapter['sendPoll']>>[0]
    ) => Promise<Omit<ChannelPollResult, 'channel'>>
  }
}

function resolveChatChannelSecurity<TResolvedAccount>(
  security: ChannelSecurityAdapter<TResolvedAccount> | ChatChannelSecurityOptions<TResolvedAccount> | undefined
): ChannelSecurityAdapter<TResolvedAccount> | undefined {
  if (!security) return undefined
  if (!('dm' in security)) return security as ChannelSecurityAdapter<TResolvedAccount>

  const options = security as ChatChannelSecurityOptions<TResolvedAccount>
  return {
    resolveDmPolicy: ({ cfg, accountId, account }) =>
      buildAccountScopedDmSecurityPolicy({
        cfg,
        channelKey: options.dm.channelKey,
        accountId,
        fallbackAccountId: options.dm.resolveFallbackAccountId?.(account) ?? (account as Record<string, unknown>).accountId as string | undefined,
        policy: options.dm.resolvePolicy(account),
        allowFrom: options.dm.resolveAllowFrom(account) ?? [],
        defaultPolicy: options.dm.defaultPolicy,
        allowFromPathSuffix: options.dm.allowFromPathSuffix,
        policyPathSuffix: options.dm.policyPathSuffix,
        approveChannelId: options.dm.approveChannelId,
        approveHint: options.dm.approveHint,
        normalizeEntry: options.dm.normalizeEntry,
        inheritSharedDefaultsFromDefaultAccount: options.dm.inheritSharedDefaultsFromDefaultAccount,
      }),
    ...(options.collectWarnings ? { collectWarnings: options.collectWarnings } : {}),
    ...(options.collectAuditFindings ? { collectAuditFindings: options.collectAuditFindings } : {}),
  }
}

function resolveChatChannelPairing(
  pairing: ChannelPairingAdapter | ChatChannelPairingOptions | undefined
): ChannelPairingAdapter | undefined {
  if (!pairing) return undefined
  if (!('text' in pairing)) return pairing as ChannelPairingAdapter

  const options = pairing as ChatChannelPairingOptions
  return createInlineTextPairingAdapter(options.text)
}

function resolveChatChannelThreading<TResolvedAccount>(
  threading: ChannelThreadingAdapter | ChatChannelThreadingOptions<TResolvedAccount> | undefined
): ChannelThreadingAdapter | undefined {
  if (!threading) return undefined
  if (!('topLevelReplyToMode' in threading) && !('scopedAccountReplyToMode' in threading) && !('resolveReplyToMode' in threading)) {
    return threading as ChannelThreadingAdapter
  }

  const options = threading as Record<string, unknown>
  let resolveReplyToMode: ChannelThreadingAdapter['resolveReplyToMode']
  
  if ('topLevelReplyToMode' in options) {
    resolveReplyToMode = createTopLevelChannelReplyToModeResolver(options.topLevelReplyToMode as string)
  } else if ('scopedAccountReplyToMode' in options) {
    resolveReplyToMode = createScopedAccountReplyToModeResolver<TResolvedAccount>(options.scopedAccountReplyToMode as any)
  } else {
    resolveReplyToMode = options.resolveReplyToMode as any
  }

  return {
    ...options,
    resolveReplyToMode,
  }
}

function resolveChatChannelOutbound(
  outbound: ChannelOutboundAdapter | ChatChannelAttachedOutboundOptions | undefined
): ChannelOutboundAdapter | undefined {
  if (!outbound) return undefined
  if (!('attachedResults' in outbound)) return outbound as ChannelOutboundAdapter

  const options = outbound as ChatChannelAttachedOutboundOptions
  return {
    ...options.base,
    sendText: options.attachedResults.sendText
      ? async (params) => ({
          channel: options.attachedResults.channel,
          ...(await options.attachedResults.sendText!(params)),
        })
      : undefined,
    sendMedia: options.attachedResults.sendMedia
      ? async (params) => ({
          channel: options.attachedResults.channel,
          ...(await options.attachedResults.sendMedia!(params)),
        })
      : undefined,
    sendPoll: options.attachedResults.sendPoll
      ? async (params) => ({
          channel: options.attachedResults.channel,
          ...(await options.attachedResults.sendPoll!(params)),
        })
      : undefined,
  }
}

export function createChatChannelPlugin<
  TResolvedAccount,
  Probe = unknown,
  Audit = unknown
>(params: {
  base: Omit<ChannelPlugin<TResolvedAccount, Probe, Audit>, 'security' | 'pairing' | 'threading' | 'outbound'>
  security?: ChannelSecurityAdapter<TResolvedAccount> | ChatChannelSecurityOptions<TResolvedAccount>
  pairing?: ChannelPairingAdapter | ChatChannelPairingOptions
  threading?: ChannelThreadingAdapter | ChatChannelThreadingOptions<TResolvedAccount>
  outbound?: ChannelOutboundAdapter | ChatChannelAttachedOutboundOptions
}): ChannelPlugin<TResolvedAccount, Probe, Audit> {
  return {
    ...params.base,
    kind: 'channel',
    conversationBindings: {
      supportsCurrentConversationBinding: true,
      ...params.base.conversationBindings,
    },
    ...(params.security ? { security: resolveChatChannelSecurity(params.security) } : {}),
    ...(params.pairing ? { pairing: resolveChatChannelPairing(params.pairing) } : {}),
    ...(params.threading ? { threading: resolveChatChannelThreading(params.threading) } : {}),
    ...(params.outbound ? { outbound: resolveChatChannelOutbound(params.outbound) } : {}),
  } as ChannelPlugin<TResolvedAccount, Probe, Audit>
}

// ---------------------------------------------------------------------------
// 3. Base Channel Plugin Builder
// ---------------------------------------------------------------------------

export function createChannelPluginBase<TResolvedAccount>(params: {
  id: ChannelId
  meta?: Partial<ChannelMeta>
  setup?: ChannelPlugin<TResolvedAccount>['setup']
  config: ChannelPlugin<TResolvedAccount>['config']
  configSchema?: ChannelPlugin<TResolvedAccount>['configSchema']
  capabilities?: ChannelPlugin<TResolvedAccount>['capabilities']
  security?: ChannelPlugin<TResolvedAccount>['security']
  groups?: ChannelPlugin<TResolvedAccount>['groups']
  messaging?: ChannelPlugin<TResolvedAccount>['messaging']
  conversationBindings?: ChannelPlugin<TResolvedAccount>['conversationBindings']
  setupWizard?: ChannelPlugin<TResolvedAccount>['setupWizard']
  commands?: ChannelPlugin<TResolvedAccount>['commands']
  doctor?: ChannelPlugin<TResolvedAccount>['doctor']
  agentPrompt?: ChannelPlugin<TResolvedAccount>['agentPrompt']
  streaming?: ChannelPlugin<TResolvedAccount>['streaming']
  reload?: ChannelPlugin<TResolvedAccount>['reload']
  gatewayMethods?: ChannelPlugin<TResolvedAccount>['gatewayMethods']
  send?: ChannelPlugin<TResolvedAccount>['send']
}): ChannelPlugin<TResolvedAccount> {
  return {
    kind: 'channel',
    id: params.id,
    meta: {
      id: params.id,
      name: params.meta?.name ?? params.id,
      description: params.meta?.description ?? '',
      ...params.meta,
    },
    config: params.config,
    setup: params.setup,
    configSchema: params.configSchema,
    capabilities: params.capabilities,
    security: params.security,
    groups: params.groups,
    messaging: params.messaging,
    conversationBindings: params.conversationBindings,
    setupWizard: params.setupWizard,
    commands: params.commands,
    doctor: params.doctor,
    agentPrompt: params.agentPrompt,
    streaming: params.streaming,
    reload: params.reload,
    gatewayMethods: params.gatewayMethods,
    send: params.send ?? (async () => {}),
  } as ChannelPlugin<TResolvedAccount>
}
