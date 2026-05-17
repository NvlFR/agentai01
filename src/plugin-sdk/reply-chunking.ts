import { chunkTextByBreakResolver } from './text-chunking.js';

export const DEFAULT_CHUNK_LIMIT = 4000;

export function resolveTextChunkLimit(
  cfg: unknown,
  provider?: string,
  accountId?: string | null,
  opts?: { fallbackLimit?: number },
): number {
  const fallback = opts?.fallbackLimit ?? DEFAULT_CHUNK_LIMIT;
  const cfgRecord = cfg as Record<string, unknown> | null | undefined;
  const channels = cfgRecord?.channels as Record<string, Record<string, unknown>> | undefined;
  if (!channels || !provider) return fallback;

  const providerCfg = channels[provider];
  if (!providerCfg) return fallback;

  if (accountId) {
    const accounts = providerCfg.accounts as Record<string, Record<string, unknown>> | undefined;
    const accountLimit = accounts?.[accountId]?.textChunkLimit;
    if (typeof accountLimit === 'number') return accountLimit;
  }

  const providerLimit = providerCfg.textChunkLimit;
  return typeof providerLimit === 'number' ? providerLimit : fallback;
}

export function chunkText(text: string, limit: number): string[] {
  if (!text) return [];
  if (limit <= 0 || text.length <= limit) return [text];

  return chunkTextByBreakResolver(text, limit, (window) => {
    const lastNewline = window.lastIndexOf('\n');
    if (lastNewline > 0) return lastNewline;

    const lastSpace = window.lastIndexOf(' ');
    if (lastSpace > 0) return lastSpace;

    return -1;
  });
}
