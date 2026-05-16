import type { TelegramUpdate } from './telegram.js'

type TelegramMessage = NonNullable<TelegramUpdate['message']>
type TelegramSender = TelegramMessage['from']

export type TelegramTopicConfig = {
  enabled?: boolean
  agentId?: string
  systemPrompt?: string
  requireMention?: boolean
  skills?: string[]
}

export type TelegramGroupConfig = {
  enabled?: boolean
  agentId?: string
  systemPrompt?: string
  requireMention?: boolean
  skills?: string[]
  topics?: Record<string, TelegramTopicConfig>
}

export type TelegramChannelConfig = {
  accountId: string
  botUsername?: string
  systemPrompt?: string
  direct?: TelegramGroupConfig
  groups: Record<string, TelegramGroupConfig>
}

export type TelegramPromptSettings = {
  skillFilter: string[] | undefined
  groupSystemPrompt: string | undefined
}

export type TelegramTurnContext = {
  accountId: string
  chatId: string
  chatType: string
  isGroup: boolean
  threadId?: string
  senderId?: string
  senderName?: string
  sessionKey: string
  agentId: string
  groupConfig?: TelegramGroupConfig
  topicConfig?: TelegramTopicConfig
  promptSettings: TelegramPromptSettings
  allowed: boolean
  blockedReason?: 'group-disabled' | 'topic-disabled' | 'mention-required'
}

const DEFAULT_ACCOUNT_ID = 'main'
const DEFAULT_AGENT_ID = 'operator'

export function loadTelegramChannelConfig(
  env: Record<string, string | undefined> = process.env,
): TelegramChannelConfig {
  return {
    accountId: normalizeToken(env['TELEGRAM_ACCOUNT_ID']) ?? DEFAULT_ACCOUNT_ID,
    botUsername: normalizeTelegramUsername(env['TELEGRAM_BOT_USERNAME']),
    systemPrompt: normalizeOptionalString(env['TELEGRAM_SYSTEM_PROMPT']),
    direct: parseConfigObject<TelegramGroupConfig>(env['TELEGRAM_DIRECT_CONFIG_JSON']),
    groups: parseConfigObject<Record<string, TelegramGroupConfig>>(
      env['TELEGRAM_GROUPS_JSON'],
    ) ?? {},
  }
}

export function resolveTelegramTurnContext(input: {
  update: TelegramUpdate
  config: TelegramChannelConfig
}): TelegramTurnContext | undefined {
  const message = input.update.message
  if (!message) {
    return undefined
  }

  const chatId = String(message.chat.id)
  const threadId = message.message_thread_id === undefined
    ? undefined
    : String(message.message_thread_id)
  const isGroup = message.chat.type === 'group' || message.chat.type === 'supergroup'
  const groupConfig = isGroup ? input.config.groups[chatId] : input.config.direct
  const topicConfig = threadId ? groupConfig?.topics?.[threadId] : undefined
  const promptSettings = resolveTelegramGroupPromptSettings({
    globalSystemPrompt: input.config.systemPrompt,
    groupConfig,
    topicConfig,
  })
  const agentId = normalizeToken(topicConfig?.agentId) ??
    normalizeToken(groupConfig?.agentId) ??
    DEFAULT_AGENT_ID
  const sessionKey = buildTelegramSessionKey({
    accountId: input.config.accountId,
    chatId,
    isGroup,
    threadId,
    senderId: message.from?.id,
    agentId,
  })
  const mentionRequired = isGroup &&
    (topicConfig?.requireMention ?? groupConfig?.requireMention) === true &&
    isPlainChatMessage(message.text) &&
    !containsBotMention(message.text ?? '', input.config.botUsername)

  if (groupConfig?.enabled === false) {
    return {
      accountId: input.config.accountId,
      chatId,
      chatType: message.chat.type,
      isGroup,
      threadId,
      senderId: message.from?.id === undefined ? undefined : String(message.from.id),
      senderName: buildSenderName(message.from),
      sessionKey,
      agentId,
      groupConfig,
      topicConfig,
      promptSettings,
      allowed: false,
      blockedReason: 'group-disabled',
    }
  }

  if (topicConfig?.enabled === false) {
    return {
      accountId: input.config.accountId,
      chatId,
      chatType: message.chat.type,
      isGroup,
      threadId,
      senderId: message.from?.id === undefined ? undefined : String(message.from.id),
      senderName: buildSenderName(message.from),
      sessionKey,
      agentId,
      groupConfig,
      topicConfig,
      promptSettings,
      allowed: false,
      blockedReason: 'topic-disabled',
    }
  }

  if (mentionRequired) {
    return {
      accountId: input.config.accountId,
      chatId,
      chatType: message.chat.type,
      isGroup,
      threadId,
      senderId: message.from?.id === undefined ? undefined : String(message.from.id),
      senderName: buildSenderName(message.from),
      sessionKey,
      agentId,
      groupConfig,
      topicConfig,
      promptSettings,
      allowed: false,
      blockedReason: 'mention-required',
    }
  }

  return {
    accountId: input.config.accountId,
    chatId,
    chatType: message.chat.type,
    isGroup,
    threadId,
    senderId: message.from?.id === undefined ? undefined : String(message.from.id),
    senderName: buildSenderName(message.from),
    sessionKey,
    agentId,
    groupConfig,
    topicConfig,
    promptSettings,
    allowed: true,
  }
}

export function resolveTelegramGroupPromptSettings(input: {
  globalSystemPrompt?: string
  groupConfig?: TelegramGroupConfig
  topicConfig?: TelegramTopicConfig
}): TelegramPromptSettings {
  const skillFilter = input.topicConfig?.skills ?? input.groupConfig?.skills
  const systemPromptParts = [
    input.globalSystemPrompt,
    input.groupConfig?.systemPrompt,
    input.topicConfig?.systemPrompt,
  ]
    .map(value => value?.trim())
    .filter((value): value is string => Boolean(value))
  return {
    skillFilter,
    groupSystemPrompt: systemPromptParts.length > 0
      ? systemPromptParts.join('\n\n')
      : undefined,
  }
}

export function buildTelegramSessionKey(input: {
  accountId: string
  chatId: string
  isGroup: boolean
  threadId?: string
  senderId?: string | number
  agentId: string
}): string {
  const peer = input.isGroup
    ? `group:${input.chatId}${input.threadId ? `:topic:${input.threadId}` : ''}`
    : `direct:${input.senderId ?? input.chatId}`
  return [
    'telegram',
    normalizeToken(input.accountId) ?? DEFAULT_ACCOUNT_ID,
    normalizeToken(input.agentId) ?? DEFAULT_AGENT_ID,
    peer,
  ].join(':')
}

function parseConfigObject<T>(value: string | undefined): T | undefined {
  const normalized = normalizeOptionalString(value)
  if (!normalized) {
    return undefined
  }

  try {
    const parsed = JSON.parse(normalized) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as T
    }
  } catch {
    return undefined
  }

  return undefined
}

function buildSenderName(
  sender: TelegramSender,
): string | undefined {
  if (!sender) {
    return undefined
  }
  return [
    normalizeOptionalString(sender.first_name),
    normalizeOptionalString(sender.last_name),
  ].filter(Boolean).join(' ') || normalizeOptionalString(sender.username)
}

function isPlainChatMessage(text: string | undefined): boolean {
  const normalized = text?.trim()
  return Boolean(normalized) && !normalized?.startsWith('/')
}

function containsBotMention(text: string, botUsername: string | undefined): boolean {
  if (!botUsername) {
    return false
  }
  return text.toLowerCase().includes(`@${botUsername.toLowerCase()}`)
}

function normalizeTelegramUsername(value: string | undefined): string | undefined {
  const normalized = normalizeOptionalString(value)
  return normalized?.replace(/^@/, '')
}

function normalizeToken(value: string | undefined): string | undefined {
  const normalized = normalizeOptionalString(value)
  return normalized?.replace(/[^a-zA-Z0-9_.-]/g, '-').toLowerCase()
}

function normalizeOptionalString(value: string | undefined): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}
