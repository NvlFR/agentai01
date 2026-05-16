// Adapted from referensi/openclaw/src/utils/parse-json-compat.ts
import JSON5 from 'json5';

/**
 * Parses JSON with a fallback to JSON5 if standard JSON.parse fails.
 */
export function parseJsonCompat(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    try {
      return JSON5.parse(raw);
    } catch {
      return undefined;
    }
  }
}
