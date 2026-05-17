const TELEGRAM_PREFIX_RE = /^(telegram|tg):/iu

export function normalizeTelegramTarget(raw: string): string | undefined {
  const parsed = parseTelegramTarget(raw)
  if (!parsed) {
    return undefined
  }

  const chatSegment = parsed.scope === 'group'
    ? `group:${parsed.chatId}`
    : parsed.chatId
  const threadSegment = parsed.threadMode === 'topic'
    ? `:topic:${parsed.threadId}`
    : parsed.threadMode === 'suffix'
      ? `:${parsed.threadId}`
      : ''

  return `telegram:${chatSegment}${threadSegment}`.toLowerCase()
}

export function looksLikeTelegramTarget(raw: string): boolean {
  return normalizeTelegramTarget(raw) !== undefined
}

type ParsedTelegramTarget = {
  scope: 'chat' | 'group'
  chatId: string
  threadId?: string
  threadMode?: 'topic' | 'suffix'
}

function parseTelegramTarget(raw: string): ParsedTelegramTarget | null {
  const trimmed = raw.trim()
  if (!trimmed) {
    return null
  }

  const withoutPrefix = trimmed.replace(TELEGRAM_PREFIX_RE, '').trim()
  if (!withoutPrefix) {
    return null
  }

  const match = withoutPrefix.match(
    /^(?:(group):)?([^:]+?)(?:(?::(topic):(\d+))|(?::(\d+)))?$/iu,
  )
  if (!match) {
    return null
  }

  const scope = match[1] ? 'group' : 'chat'
  const chatId = match[2]?.trim().toLowerCase()
  if (!chatId || !isValidTelegramChatId(chatId)) {
    return null
  }

  const topicThreadId = match[4]
  if (topicThreadId) {
    return {
      scope,
      chatId,
      threadId: topicThreadId,
      threadMode: 'topic',
    }
  }

  const suffixThreadId = match[5]
  if (suffixThreadId) {
    return {
      scope,
      chatId,
      threadId: suffixThreadId,
      threadMode: 'suffix',
    }
  }

  return { scope, chatId }
}

function isValidTelegramChatId(value: string): boolean {
  return /^@?[a-z0-9_.-]+$/u.test(value) || /^-?\d+$/u.test(value)
}
