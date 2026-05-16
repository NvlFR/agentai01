// Adapted from referensi/openclaw/src/utils/safe-json.ts
import { err, ok, type Result } from '../shared/index.js';

/**
 * Safely parse JSON string into a Result.
 */
export function safeParseJson<T = unknown>(value: string): Result<T, string> {
  try {
    return ok(JSON.parse(value) as T);
  } catch (error) {
    return err(error instanceof Error ? error.message : 'Invalid JSON');
  }
}

/**
 * Safely stringify a value to JSON, handling BigInt, Functions, Errors, and Uint8Array.
 */
export function safeStringifyJson(value: unknown, indent?: number): string | null {
  try {
    return JSON.stringify(
      value,
      (_key, val) => {
        if (typeof val === 'bigint') {
          return val.toString();
        }
        if (typeof val === 'function') {
          return '[Function]';
        }
        if (val instanceof Error) {
          return { name: val.name, message: val.message, stack: val.stack };
        }
        if (val instanceof Uint8Array) {
          // Use Buffer if available (Node.js/Bun), fallback to array
          if (typeof Buffer !== 'undefined') {
            return { type: 'Uint8Array', data: Buffer.from(val).toString('base64') };
          }
          return Array.from(val);
        }
        return val;
      },
      indent,
    );
  } catch {
    return null;
  }
}
