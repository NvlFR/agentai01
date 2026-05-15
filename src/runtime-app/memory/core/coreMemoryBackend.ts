// src/runtime-app/memory/core/coreMemoryBackend.ts
// In-memory Map backend — simple key-value store with no external dependencies.
// Used as the baseline fallback for all other optional memory backends.

import type { MemoryBackend, MemoryBackendFactory } from '../memoryBackend.js'

export class CoreMemoryBackend implements MemoryBackend {
  readonly id = 'memory-core'
  private readonly store_: Map<string, unknown> = new Map()

  async store(key: string, value: unknown): Promise<void> {
    this.store_.set(key, value)
  }

  async retrieve(key: string): Promise<unknown | null> {
    return this.store_.has(key) ? (this.store_.get(key) ?? null) : null
  }

  async search(query: string): Promise<unknown[]> {
    // Simple substring match on string values. No vector search.
    const results: unknown[] = []
    for (const [key, value] of this.store_.entries()) {
      const valueStr = typeof value === 'string' ? value : JSON.stringify(value)
      if (key.includes(query) || valueStr.includes(query)) {
        results.push({ key, value })
      }
    }
    return results
  }

  async delete(key: string): Promise<void> {
    this.store_.delete(key)
  }

  /** Clear all entries — useful for test cleanup. */
  clear(): void {
    this.store_.clear()
  }
}

export const coreMemoryBackendFactory: MemoryBackendFactory = {
  id: 'memory-core',
  isAvailable: () => true,
  create: () => new CoreMemoryBackend(),
}
