// Adapted using referensi/openclaw/extensions/whatsapp/src/reconnect.ts
import { randomUUID } from 'node:crypto'

export type BackoffPolicy = {
  initialMs: number
  maxMs: number
  factor: number
  jitter: number
}

export type ReconnectPolicy = BackoffPolicy & {
  maxAttempts: number
}

export const DEFAULT_HEARTBEAT_SECONDS = 60

export const DEFAULT_RECONNECT_POLICY: ReconnectPolicy = {
  initialMs: 2_000,
  maxMs: 30_000,
  factor: 1.8,
  jitter: 0.25,
  maxAttempts: 12,
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Minimal config shape for reconnect/heartbeat resolution.
 */
export type ReconnectConfig = {
  web?: {
    heartbeatSeconds?: number
    reconnect?: Partial<ReconnectPolicy>
  }
}

/**
 * Resolve heartbeat interval in seconds.
 * Precedence: overrideSeconds > cfg.web.heartbeatSeconds > DEFAULT_HEARTBEAT_SECONDS.
 */
export function resolveHeartbeatSeconds(cfg: ReconnectConfig, overrideSeconds?: number): number {
  const candidate = overrideSeconds ?? cfg.web?.heartbeatSeconds
  if (typeof candidate === 'number' && candidate > 0) {
    return candidate
  }
  return DEFAULT_HEARTBEAT_SECONDS
}

/**
 * Resolve reconnect policy from config and optional overrides.
 * Clamps all values to safe ranges.
 */
export function resolveReconnectPolicy(
  cfg: ReconnectConfig,
  overrides?: Partial<ReconnectPolicy>,
): ReconnectPolicy {
  const reconnectOverrides = cfg.web?.reconnect ?? {}
  const overrideConfig = overrides ?? {}
  const merged: ReconnectPolicy = {
    ...DEFAULT_RECONNECT_POLICY,
    ...reconnectOverrides,
    ...overrideConfig,
  }

  merged.initialMs = Math.max(250, merged.initialMs)
  merged.maxMs = Math.max(merged.initialMs, merged.maxMs)
  merged.factor = clamp(merged.factor, 1.1, 10)
  merged.jitter = clamp(merged.jitter, 0, 1)
  merged.maxAttempts = Math.max(0, Math.floor(merged.maxAttempts))
  return merged
}

/**
 * Compute exponential backoff delay for a given attempt (0-indexed).
 * Applies jitter as a random fraction of the computed delay.
 */
export function computeBackoff(policy: BackoffPolicy, attempt: number): number {
  const base = policy.initialMs * Math.pow(policy.factor, attempt)
  const clamped = Math.min(base, policy.maxMs)
  const jitterAmount = clamped * policy.jitter * Math.random()
  return Math.round(clamped + jitterAmount)
}

/**
 * Sleep for the given number of milliseconds, respecting an optional AbortSignal.
 */
export function sleepWithAbort(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }, { once: true })
  })
}

/**
 * Generate a new unique connection ID.
 */
export function newConnectionId(): string {
  return randomUUID()
}
