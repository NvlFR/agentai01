// src/runtime-app/memory/active-memory/activeMemoryBackend.ts
// Active memory backend — working memory for an active agent session.
// Cleared automatically when the session ends (dispose() or GC).
// Falls back to memory-core interface — same contract, different lifecycle.

import type { MemoryBackend, MemoryBackendFactory } from '../memoryBackend.js'

export class ActiveMemoryBackend implements MemoryBackend {
  readonly id = 'active-memory'
  private readonly entries_: Map<string, { value: unknown; storedAt: number }> = new Map()

  async store(key: string, value: unknown): Promise<void> {
    this.entries_.set(key, { value, storedAt: Date.now() })
  }

  async retrieve(key: string): Promise<unknown | null> {
    const entry = this.entries_.get(key)
    return entry ? entry.value : null
  }

  async search(query: string): Promise<unknown[]> {
    const results: unknown[] = []
    for (const [key, { value }] of this.entries_.entries()) {
      const valueStr = typeof value === 'string' ? value : JSON.stringify(value)
      if (key.includes(query) || valueStr.includes(query)) {
        results.push({ key, value })
      }
    }
    return results
  }

  async delete(key: string): Promise<void> {
    this.entries_.delete(key)
  }

  /** Release all working memory — call when session ends. */
  dispose(): void {
    this.entries_.clear()
  }

  /** Size of current working memory (for diagnostics). */
  get size(): number {
    return this.entries_.size
  }
}

export const activeMemoryBackendFactory: MemoryBackendFactory = {
  id: 'active-memory',
  isAvailable: () => true,
  create: () => new ActiveMemoryBackend(),
}
