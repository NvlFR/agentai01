import { resolveChannelStreamingPreviewChunk } from '../../plugin-sdk/channel-streaming.js';
import { resolveTextChunkLimit } from '../../plugin-sdk/reply-chunking.js';
import {
  TELEGRAM_TEXT_CHUNK_LIMIT,
  DEFAULT_TELEGRAM_DRAFT_STREAM_MIN,
  DEFAULT_TELEGRAM_DRAFT_STREAM_MAX,
} from './constants.js';

export function resolveTelegramDraftStreamingChunking(
  cfg: Record<string, any> | undefined | null,
  accountId?: string | null,
): {
  minChars: number;
  maxChars: number;
  breakPreference: 'paragraph' | 'newline' | 'sentence';
} {
  const textLimit = resolveTextChunkLimit(cfg, 'telegram', accountId, {
    fallbackLimit: TELEGRAM_TEXT_CHUNK_LIMIT,
  });

  const telegramCfg = cfg?.channels?.telegram;
  const accounts = telegramCfg?.accounts;
  const accountCfg =
    accountId && accounts && typeof accounts === 'object' ? accounts[accountId] : undefined;

  const draftCfg =
    resolveChannelStreamingPreviewChunk(accountCfg) ??
    resolveChannelStreamingPreviewChunk(telegramCfg);

  const maxRequested = Math.max(
    1,
    Math.floor(draftCfg?.maxChars ?? DEFAULT_TELEGRAM_DRAFT_STREAM_MAX),
  );
  const maxChars = Math.max(1, Math.min(maxRequested, textLimit));
  const minRequested = Math.max(
    1,
    Math.floor(draftCfg?.minChars ?? DEFAULT_TELEGRAM_DRAFT_STREAM_MIN),
  );
  const minChars = Math.min(minRequested, maxChars);
  const breakPreference =
    draftCfg?.breakPreference === 'newline' || draftCfg?.breakPreference === 'sentence'
      ? draftCfg.breakPreference
      : 'paragraph';

  return { minChars, maxChars, breakPreference };
}
