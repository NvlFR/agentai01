import { basename, join, normalize, sep } from 'node:path'

import { err, formatIso8601, ok, parseIso8601, type Result } from '../shared/index.js'

export type RetryOptions = {
  attempts: number
  baseDelayMs?: number
  maxDelayMs?: number
  shouldRetry?: (error: unknown, attempt: number) => boolean
  sleep?: (durationMs: number) => Promise<void>
}

export type ArtifactPath = {
  namespace: string
  name: string
}

export function safeParseJson<T = unknown>(value: string): Result<T, string> {
  try {
    return ok(JSON.parse(value) as T)
  } catch (error) {
    return err(error instanceof Error ? error.message : 'Invalid JSON')
  }
}

export function sleep(durationMs: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, Math.max(0, durationMs)))
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function truncate(value: string, maxLength: number, ellipsis = '...'): string {
  if (value.length <= maxLength) {
    return value
  }

  if (maxLength <= ellipsis.length) {
    return ellipsis.slice(0, Math.max(0, maxLength))
  }

  return `${value.slice(0, maxLength - ellipsis.length)}${ellipsis}`
}

export function dedupe<T>(items: readonly T[], key: (item: T) => string = String): T[] {
  const seen = new Set<string>()
  const result: T[] = []

  for (const item of items) {
    const itemKey = key(item)
    if (!seen.has(itemKey)) {
      seen.add(itemKey)
      result.push(item)
    }
  }

  return result
}

export async function retry<T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  const attempts = Math.max(1, Math.trunc(options.attempts))
  const baseDelayMs = options.baseDelayMs ?? 50
  const maxDelayMs = options.maxDelayMs ?? 1_000
  const wait = options.sleep ?? sleep
  let lastError: unknown

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation(attempt)
    } catch (error) {
      lastError = error
      if (attempt >= attempts || options.shouldRetry?.(error, attempt) === false) {
        throw error
      }

      const delay = clamp(baseDelayMs * 2 ** (attempt - 1), 0, maxDelayMs)
      await wait(delay)
    }
  }

  throw lastError
}

export function nowIso(): string {
  return formatIso8601(new Date())
}

export function parseTimestamp(value: string): Result<Date, string> {
  const parsed = parseIso8601(value)
  return parsed ? ok(parsed) : err('Invalid ISO 8601 timestamp')
}

export function toArtifactPath(input: ArtifactPath): string {
  const namespace = sanitizePathSegment(input.namespace)
  const name = sanitizePathSegment(input.name)
  return join(namespace, name)
}

export function isPathInside(parent: string, child: string): boolean {
  const normalizedParent = withTrailingSeparator(normalize(parent))
  const normalizedChild = normalize(child)
  return normalizedChild === normalize(parent) || normalizedChild.startsWith(normalizedParent)
}

function sanitizePathSegment(value: string): string {
  const leaf = basename(value.trim())
  return leaf.replace(/[^A-Za-z0-9._-]/g, '-')
}

function withTrailingSeparator(value: string): string {
  return value.endsWith(sep) ? value : `${value}${sep}`
}
