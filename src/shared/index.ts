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

export type Deferred<T> = {
  promise: Promise<T>
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: unknown) => void
}

export type LazyAsync<T> = () => Promise<T>

export type PageRequest = {
  page: number
  pageSize: number
}

export type Page<T> = {
  items: T[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

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

export function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function coerceString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') {
    return value
  }

  if (value === null || value === undefined) {
    return fallback
  }

  return String(value)
}

export function coerceNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  return fallback
}

export function coerceBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['1', 'true', 'yes', 'on'].includes(normalized)) {
      return true
    }
    if (['0', 'false', 'no', 'off'].includes(normalized)) {
      return false
    }
  }

  return fallback
}

export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve
    reject = innerReject
  })

  return { promise, resolve, reject }
}

export function createLazyAsync<T>(factory: () => Promise<T>): LazyAsync<T> {
  let promise: Promise<T> | undefined
  return () => {
    promise ??= factory()
    return promise
  }
}

export function paginate<T>(items: readonly T[], request: PageRequest): Page<T> {
  const page = Math.max(1, Math.trunc(request.page))
  const pageSize = Math.max(1, Math.trunc(request.pageSize))
  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const start = (page - 1) * pageSize

  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  }
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
