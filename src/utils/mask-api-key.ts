// Adapted from referensi/openclaw/src/utils/mask-api-key.ts
/**
 * Masks an API key for safe logging/display.
 * - If length < 8: returns "****"
 * - If length >= 8: returns first 4 characters followed by "...****"
 */
export function maskApiKey(value: string | undefined | null): string {
  if (!value) {
    return 'missing';
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return 'missing';
  }

  if (trimmed.length < 8) {
    return '****';
  }

  return `${trimmed.slice(0, 4)}...****`;
}
