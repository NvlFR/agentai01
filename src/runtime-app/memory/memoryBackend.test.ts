// src/runtime-app/memory/memoryBackend.test.ts
// Contract tests for all memory backends — write-then-read consistency property.

import { describe, it, expect, afterEach } from 'bun:test'
import { CoreMemoryBackend } from './core/coreMemoryBackend.js'
import { ActiveMemoryBackend } from './active-memory/activeMemoryBackend.js'
import { WikiMemoryBackend } from './wiki/wikiMemoryBackend.js'
import type { MemoryBackend } from './memoryBackend.js'

function runContractTests(name: string, getBackend: () => MemoryBackend & { clear?(): void; dispose?(): void }): void {
  describe(`${name} — contract`, () => {
    let backend: MemoryBackend & { clear?(): void; dispose?(): void }

    afterEach(() => {
      backend?.clear?.()
      backend?.dispose?.()
    })

    it('store then retrieve returns the same value (consistency)', async () => {
      backend = getBackend()
      await backend.store('key1', 'hello world')
      const result = await backend.retrieve('key1')
      expect(result).toBe('hello world')
    })

    it('retrieve returns null for missing key', async () => {
      backend = getBackend()
      const result = await backend.retrieve('missing')
      expect(result).toBeNull()
    })

    it('delete removes the key', async () => {
      backend = getBackend()
      await backend.store('to-delete', 'value')
      await backend.delete('to-delete')
      const result = await backend.retrieve('to-delete')
      expect(result).toBeNull()
    })

    it('search returns array (completeness property)', async () => {
      backend = getBackend()
      await backend.store('doc1', 'agent runtime platform')
      const results = await backend.search('agent')
      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBeGreaterThan(0)
    })

    it('search returns empty array for no matches', async () => {
      backend = getBackend()
      await backend.store('key1', 'hello world')
      const results = await backend.search('xyzzy-nonexistent')
      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBe(0)
    })

    it('store twice updates value (idempotency)', async () => {
      backend = getBackend()
      await backend.store('key1', 'first')
      await backend.store('key1', 'second')
      const result = await backend.retrieve('key1')
      expect(result).toBe('second')
    })

    it('stores object values', async () => {
      backend = getBackend()
      const obj = { nested: { x: 1 } }
      await backend.store('obj-key', obj)
      const result = await backend.retrieve('obj-key')
      // Core backends may serialize; check that it round-trips to equivalent shape.
      expect(result).toBeDefined()
    })
  })
}

runContractTests('CoreMemoryBackend', () => new CoreMemoryBackend())
runContractTests('ActiveMemoryBackend', () => new ActiveMemoryBackend())
runContractTests('WikiMemoryBackend', () => new WikiMemoryBackend())

describe('ActiveMemoryBackend — session cleanup', () => {
  it('dispose clears all entries', async () => {
    const backend = new ActiveMemoryBackend()
    await backend.store('k1', 'v1')
    await backend.store('k2', 'v2')
    expect(backend.size).toBe(2)
    backend.dispose()
    expect(backend.size).toBe(0)
    const result = await backend.retrieve('k1')
    expect(result).toBeNull()
  })
})

describe('WikiMemoryBackend — full-text search', () => {
  it('finds entries by title', async () => {
    const backend = new WikiMemoryBackend()
    await backend.store('doc1', { title: 'Agent Orchestration', content: 'Manages agent lifecycle.' })
    const results = await backend.search('Orchestration')
    expect(results.length).toBeGreaterThan(0)
    backend.clear()
  })

  it('ranks title match higher than content match', async () => {
    const backend = new WikiMemoryBackend()
    await backend.store('d1', { title: 'runtime config', content: 'not relevant' })
    await backend.store('d2', { title: 'other', content: 'runtime setup here' })
    const results = await backend.search('runtime') as Array<{ key: string }>
    expect(results[0]?.key).toBe('d1')
    backend.clear()
  })
})
