// src/runtime-app/memory/wiki/wikiMemoryBackend.ts
// Wiki memory backend — structured full-text document store.
// Stores entries as titled markdown-like documents with metadata.
// Falls back to memory-core interface when not configured.

import type { MemoryBackend, MemoryBackendFactory } from '../memoryBackend.js'

export type WikiEntry = {
  key: string
  title: string
  content: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export class WikiMemoryBackend implements MemoryBackend {
  readonly id = 'memory-wiki'
  private readonly docs_: Map<string, WikiEntry> = new Map()

  async store(key: string, value: unknown): Promise<void> {
    const existing = this.docs_.get(key)
    const now = new Date().toISOString()

    if (typeof value === 'object' && value !== null && 'content' in value) {
      const v = value as { title?: string; content: string; tags?: string[] }
      this.docs_.set(key, {
        key,
        title: v.title ?? key,
        content: v.content,
        tags: v.tags ?? [],
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      })
    } else {
      // Plain value — wrap as content string.
      this.docs_.set(key, {
        key,
        title: key,
        content: typeof value === 'string' ? value : JSON.stringify(value),
        tags: [],
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      })
    }
  }

  async retrieve(key: string): Promise<unknown | null> {
    const entry = this.docs_.get(key)
    return entry ?? null
  }

  async search(query: string): Promise<unknown[]> {
    const q = query.toLowerCase()
    const results: WikiEntry[] = []

    for (const entry of this.docs_.values()) {
      if (
        entry.title.toLowerCase().includes(q) ||
        entry.content.toLowerCase().includes(q) ||
        entry.tags.some(t => t.toLowerCase().includes(q)) ||
        entry.key.toLowerCase().includes(q)
      ) {
        results.push(entry)
      }
    }

    // Sort by relevance: title match > content match > key match
    results.sort((a, b) => {
      const scoreA = (a.title.toLowerCase().includes(q) ? 3 : 0) +
        (a.content.toLowerCase().includes(q) ? 1 : 0)
      const scoreB = (b.title.toLowerCase().includes(q) ? 3 : 0) +
        (b.content.toLowerCase().includes(q) ? 1 : 0)
      return scoreB - scoreA
    })

    return results
  }

  async delete(key: string): Promise<void> {
    this.docs_.delete(key)
  }

  /** List all document keys (for inspection). */
  keys(): string[] {
    return Array.from(this.docs_.keys())
  }

  /** Clear all entries — for test cleanup. */
  clear(): void {
    this.docs_.clear()
  }
}

export const wikiMemoryBackendFactory: MemoryBackendFactory = {
  id: 'memory-wiki',
  isAvailable: () => true,
  create: () => new WikiMemoryBackend(),
}
