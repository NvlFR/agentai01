// Adapted using referensi/openclaw/src/utils/timer-delay.ts

export const MAX_SAFE_TIMEOUT_DELAY_MS = 2_147_483_647;

/**
 * Resolves a delay to a safe range for setTimeout.
 */
export function resolveSafeTimeoutDelayMs(delayMs: number, opts?: { minMs?: number }): number {
  const rawMinMs = opts?.minMs ?? 1;
  const minMs = Math.min(
    MAX_SAFE_TIMEOUT_DELAY_MS,
    Math.max(0, Number.isFinite(rawMinMs) ? Math.floor(rawMinMs) : 1),
  );
  const candidateMs = Number.isFinite(delayMs) ? Math.floor(delayMs) : minMs;
  return Math.min(MAX_SAFE_TIMEOUT_DELAY_MS, Math.max(minMs, candidateMs));
}

/**
 * Promise-based sleep/delay.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, resolveSafeTimeoutDelayMs(ms));
  });
}

/**
 * Alias for sleep.
 */
export const delay = sleep;

/**
 * Safe version of setTimeout that handles large/invalid delays.
 */
export function setSafeTimeout(
  callback: () => void,
  delayMs: number,
  opts?: { minMs?: number },
): ReturnType<typeof setTimeout> {
  return setTimeout(callback, resolveSafeTimeoutDelayMs(delayMs, opts));
}
