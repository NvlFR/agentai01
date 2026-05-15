export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E }

export type Option<T> =
  | { ok: true; value: T }
  | { ok: false }

export type DeepPath = ReadonlyArray<string | number>

export type DeepMapVisit =
  | { handled: true; value: unknown }
  | { handled: false }

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value }
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error }
}

export function some<T>(value: T): Option<T> {
  return { ok: true, value }
}

export const none: Option<never> = { ok: false }

export function generateId(prefix = 'id'): string {
  const normalizedPrefix = prefix.trim() || 'id'
  return `${normalizedPrefix}-${readRandomUuid()}`
}

export function generateCorrelationId(prefix = 'corr'): string {
  return generateId(prefix)
}

export function formatIso8601(date: Date): string {
  return date.toISOString()
}

export function parseIso8601(value: string): Date | null {
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) {
    return null
  }

  return new Date(timestamp)
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`)
}

export function mapDeep(
  value: unknown,
  visit: (value: unknown, path: DeepPath) => DeepMapVisit,
  path: DeepPath = [],
): unknown {
  const decision = visit(value, path)
  if (decision.handled) {
    return decision.value
  }

  if (Array.isArray(value)) {
    return value.map((entry, index) => mapDeep(entry, visit, [...path, index]))
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [
        key,
        mapDeep(entryValue, visit, [...path, key]),
      ]),
    )
  }

  return value
}

function readRandomUuid(): string {
  const deterministicFactory = (
    globalThis as {
      __AGENTAI_TEST_RANDOM_UUID__?: (() => string) | undefined
    }
  ).__AGENTAI_TEST_RANDOM_UUID__

  if (typeof deterministicFactory === 'function') {
    return deterministicFactory()
  }

  return crypto.randomUUID()
}
