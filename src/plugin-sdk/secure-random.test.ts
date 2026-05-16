import { afterEach, describe, expect, it } from 'bun:test'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'

import { createTempDirectory } from '../infra/index.js'
import {
  createDedupeCache,
  generateSecureToken,
  generateSecureUuid,
  PersistentDedupe,
  resolveGlobalDedupeCache,
} from './secure-random.js'

describe('secure-random', () => {
  it('generates crypto-backed token and uuid values', () => {
    const token = generateSecureToken(24)
    const uuid = generateSecureUuid()

    expect(token.length).toBeGreaterThan(20)
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
  })

  it('expires dedupe entries by ttl and evicts oldest entries by size', () => {
    let nowMs = 1_000
    const cache = createDedupeCache({
      ttlMs: 100,
      maxSize: 2,
      now: () => nowMs,
    })

    expect(cache.claim('a')).toBe(true)
    expect(cache.claim('a')).toBe(false)

    nowMs += 50
    expect(cache.claim('b')).toBe(true)
    nowMs += 50
    expect(cache.claim('c')).toBe(true)

    expect(cache.snapshotKeys()).toEqual(['b', 'c'])
    nowMs += 101
    expect(cache.has('b')).toBe(false)
    expect(cache.size()).toBe(0)
  })

  it('reuses global dedupe cache per namespace', () => {
    const left = resolveGlobalDedupeCache('telegram-updates', { ttlMs: 1_000, maxSize: 10 })
    const right = resolveGlobalDedupeCache('telegram-updates', { ttlMs: 5_000, maxSize: 100 })
    const other = resolveGlobalDedupeCache('whatsapp-updates', { ttlMs: 1_000, maxSize: 10 })

    expect(left).toBe(right)
    expect(left).not.toBe(other)
  })
})

describe('PersistentDedupe', () => {
  let tempDir: Awaited<ReturnType<typeof createTempDirectory>> | null = null

  afterEach(async () => {
    await tempDir?.dispose()
    tempDir = null
  })

  it('persists dedupe keys across instances', async () => {
    tempDir = await createTempDirectory('plugin-sdk-dedupe-')
    const filePath = join(tempDir.path, 'dedupe.json')

    const first = new PersistentDedupe({ filePath, ttlMs: 5_000, maxSize: 10 })
    expect(await first.claim('message-1')).toBe(true)
    expect(await first.claim('message-1')).toBe(false)

    const second = new PersistentDedupe({ filePath, ttlMs: 5_000, maxSize: 10 })
    expect(await second.has('message-1')).toBe(true)
    expect(await second.claim('message-1')).toBe(false)
  })

  it('drops expired entries after reload', async () => {
    tempDir = await createTempDirectory('plugin-sdk-dedupe-')
    const filePath = join(tempDir.path, 'dedupe.json')
    let nowMs = 5_000

    const first = new PersistentDedupe({
      filePath,
      ttlMs: 100,
      maxSize: 10,
      now: () => nowMs,
    })
    expect(await first.claim('message-1')).toBe(true)

    nowMs += 200
    const second = new PersistentDedupe({
      filePath,
      ttlMs: 100,
      maxSize: 10,
      now: () => nowMs,
    })
    expect(await second.has('message-1')).toBe(false)
    expect(await second.claim('message-1')).toBe(true)
  })
})
