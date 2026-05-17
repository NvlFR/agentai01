// Adapted using referensi/openclaw/src/plugin-sdk/secure-random-runtime.ts
import { randomBytes, randomUUID } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve as resolvePath } from 'node:path'

import { writeFileAtomic } from '../infra/index.js'

export function generateSecureToken(bytes = 32): string {
  const size = Number.isFinite(bytes) ? Math.max(1, Math.trunc(bytes)) : 32
  return randomBytes(size).toString('base64url')
}

export function generateSecureUuid(): string {
  return randomUUID()
}

type DedupeEntry = {
  key: string
  createdAtMs: number
  expiresAtMs: number
}

export type DedupeCache = {
  claim(key: string): boolean
  has(key: string): boolean
  delete(key: string): boolean
  clear(): void
  size(): number
  snapshotKeys(): string[]
}

export type DedupeCacheOptions = {
  ttlMs: number
  maxSize: number
  now?: () => number
}

function normalizePositiveInteger(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback
  }

  return Math.max(1, Math.trunc(value))
}

function createEntry(key: string, nowMs: number, ttlMs: number): DedupeEntry {
  return {
    key,
    createdAtMs: nowMs,
    expiresAtMs: nowMs + ttlMs,
  }
}

function pruneEntries(
  entries: Map<string, DedupeEntry>,
  ttlMs: number,
  maxSize: number,
  nowMs: number,
): void {
  for (const [key, entry] of entries) {
    if (entry.expiresAtMs <= nowMs) {
      entries.delete(key)
    }
  }

  while (entries.size > maxSize) {
    const oldest = [...entries.values()].sort((left, right) => {
      if (left.createdAtMs !== right.createdAtMs) {
        return left.createdAtMs - right.createdAtMs
      }

      return left.key.localeCompare(right.key)
    })[0]

    if (!oldest) {
      return
    }

    entries.delete(oldest.key)
  }

  for (const entry of entries.values()) {
    if (entry.expiresAtMs < entry.createdAtMs) {
      entry.expiresAtMs = entry.createdAtMs + ttlMs
    }
  }
}

export function createDedupeCache(options: DedupeCacheOptions): DedupeCache {
  const ttlMs = normalizePositiveInteger(options.ttlMs, 5 * 60 * 1000)
  const maxSize = normalizePositiveInteger(options.maxSize, 2000)
  const now = options.now ?? (() => Date.now())
  const entries = new Map<string, DedupeEntry>()

  const prune = () => {
    pruneEntries(entries, ttlMs, maxSize, now())
  }

  return {
    claim(key) {
      const normalized = key.trim()
      if (!normalized) {
        return false
      }

      prune()
      if (entries.has(normalized)) {
        return false
      }

      entries.set(normalized, createEntry(normalized, now(), ttlMs))
      prune()
      return true
    },
    has(key) {
      const normalized = key.trim()
      if (!normalized) {
        return false
      }

      prune()
      return entries.has(normalized)
    },
    delete(key) {
      prune()
      return entries.delete(key.trim())
    },
    clear() {
      entries.clear()
    },
    size() {
      prune()
      return entries.size
    },
    snapshotKeys() {
      prune()
      return [...entries.keys()]
    },
  }
}

const GLOBAL_DEDUPE_CACHE_KEY = Symbol.for('agentai01.plugin-sdk.global-dedupe-caches')

type GlobalDedupeState = Map<string, DedupeCache>

function readGlobalDedupeState(): GlobalDedupeState {
  const state = globalThis as typeof globalThis & {
    [GLOBAL_DEDUPE_CACHE_KEY]?: GlobalDedupeState
  }

  if (!state[GLOBAL_DEDUPE_CACHE_KEY]) {
    state[GLOBAL_DEDUPE_CACHE_KEY] = new Map<string, DedupeCache>()
  }

  return state[GLOBAL_DEDUPE_CACHE_KEY]
}

export function resolveGlobalDedupeCache(
  namespace: string,
  options: DedupeCacheOptions,
): DedupeCache {
  const normalizedNamespace = namespace.trim() || 'default'
  const state = readGlobalDedupeState()
  const existing = state.get(normalizedNamespace)
  if (existing) {
    return existing
  }

  const cache = createDedupeCache(options)
  state.set(normalizedNamespace, cache)
  return cache
}

type PersistentDedupeFile = {
  version: 1
  entries: DedupeEntry[]
}

export class PersistentDedupe {
  readonly #filePath: string
  readonly #ttlMs: number
  readonly #maxSize: number
  readonly #now: () => number
  #loaded = false
  #entries = new Map<string, DedupeEntry>()

  constructor(options: DedupeCacheOptions & { filePath: string }) {
    this.#filePath = resolvePath(options.filePath)
    this.#ttlMs = normalizePositiveInteger(options.ttlMs, 5 * 60 * 1000)
    this.#maxSize = normalizePositiveInteger(options.maxSize, 2000)
    this.#now = options.now ?? (() => Date.now())
  }

  async claim(key: string): Promise<boolean> {
    const normalized = key.trim()
    if (!normalized) {
      return false
    }

    await this.#load()
    this.#prune()
    if (this.#entries.has(normalized)) {
      return false
    }

    this.#entries.set(normalized, createEntry(normalized, this.#now(), this.#ttlMs))
    this.#prune()
    await this.#save()
    return true
  }

  async has(key: string): Promise<boolean> {
    await this.#load()
    this.#prune()
    return this.#entries.has(key.trim())
  }

  async clear(): Promise<void> {
    await this.#load()
    this.#entries.clear()
    await this.#save()
  }

  async snapshotKeys(): Promise<string[]> {
    await this.#load()
    this.#prune()
    return [...this.#entries.keys()]
  }

  #prune(): void {
    pruneEntries(this.#entries, this.#ttlMs, this.#maxSize, this.#now())
  }

  async #load(): Promise<void> {
    if (this.#loaded) {
      return
    }

    this.#loaded = true
    try {
      const raw = await readFile(this.#filePath, 'utf8')
      const parsed = JSON.parse(raw) as unknown
      if (!isPersistentDedupeFile(parsed)) {
        return
      }

      this.#entries = new Map(
        parsed.entries
          .filter(entry => entry.key.trim().length > 0)
          .map(entry => [entry.key, entry] as const),
      )
      this.#prune()
    } catch (error) {
      const code = error instanceof Error && 'code' in error ? String(error.code) : ''
      if (code !== 'ENOENT') {
        this.#entries.clear()
      }
    }
  }

  async #save(): Promise<void> {
    this.#prune()
    const payload: PersistentDedupeFile = {
      version: 1,
      entries: [...this.#entries.values()],
    }

    const written = await writeFileAtomic(this.#filePath, JSON.stringify(payload, null, 2))
    if (!written.ok) {
      await writeFile(this.#filePath, JSON.stringify(payload, null, 2), 'utf8')
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPersistentDedupeFile(value: unknown): value is PersistentDedupeFile {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.entries)) {
    return false
  }

  return value.entries.every(entry => {
    if (!isRecord(entry)) {
      return false
    }

    return (
      typeof entry.key === 'string' &&
      typeof entry.createdAtMs === 'number' &&
      Number.isFinite(entry.createdAtMs) &&
      typeof entry.expiresAtMs === 'number' &&
      Number.isFinite(entry.expiresAtMs)
    )
  })
}
