// Adapted using referensi/openclaw/src/utils/usage-format.ts

/**
 * Formats a token count into a human-readable string (e.g., 1.5k, 1.0m).
 */
export function formatTokenCount(value?: number): string {
  if (value === undefined || !Number.isFinite(value)) {
    return '0';
  }
  const safe = Math.max(0, value);
  if (safe >= 1_000_000) {
    return `${(safe / 1_000_000).toFixed(1)}m`;
  }
  if (safe >= 1_000) {
    const precision = safe >= 10_000 ? 0 : 1;
    const formattedThousands = (safe / 1_000).toFixed(precision);
    if (Number(formattedThousands) >= 1_000) {
      return `${(safe / 1_000_000).toFixed(1)}m`;
    }
    return `${formattedThousands}k`;
  }
  return String(Math.round(safe));
}

/**
 * Formats token usage into a human-readable summary string.
 */
export function formatTokenUsage(usage: {
  input?: number;
  output?: number;
  total?: number;
}): string {
  const parts: string[] = [];

  if (usage.input !== undefined) {
    parts.push(`${formatTokenCount(usage.input)} in`);
  }
  if (usage.output !== undefined) {
    parts.push(`${formatTokenCount(usage.output)} out`);
  }

  const base = parts.join(', ');
  if (usage.total !== undefined) {
    return `${base} (${formatTokenCount(usage.total)} total)`;
  }

  return base;
}
