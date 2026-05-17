export type TelegramThreadSpec = {
  id?: number;
  scope: 'dm' | 'forum' | 'none';
};

export const TELEGRAM_GENERAL_TOPIC_ID = 1;

export function buildTelegramThreadParams(
  thread?: Partial<TelegramThreadSpec> | TelegramThreadSpec | null,
) {
  if (thread?.id == null) {
    return undefined;
  }
  const normalized = Math.trunc(thread.id);

  if (thread.scope === 'dm') {
    return normalized > 0 ? { message_thread_id: normalized } : undefined;
  }

  // Telegram rejects message_thread_id=1 for General forum topic
  if (normalized === TELEGRAM_GENERAL_TOPIC_ID) {
    return undefined;
  }

  return { message_thread_id: normalized };
}

export function normalizeTelegramReplyToMessageId(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && Number.isFinite(parsed)) {
      return Math.trunc(parsed);
    }
  }
  return undefined;
}
