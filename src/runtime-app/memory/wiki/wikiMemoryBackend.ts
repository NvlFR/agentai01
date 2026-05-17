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

type WikiStoredEntry = WikiEntry & {
  value: unknown
}

type WikiDocumentInput = {
  title?: string
  content: string
  tags?: string[]
}

export class WikiMemoryBackend implements MemoryBackend {
  readonly id = 'memory-wiki'
  private readonly docs_: Map<string, WikiStoredEntry> = new Map()

  async store(key: string, value: unknown): Promise<void> {
    const existing = this.docs_.get(key)
    const now = new Date().toISOString()
    const storedValue = cloneWikiValue(value)

    if (isWikiDocumentInput(storedValue)) {
      this.docs_.set(key, {
        key,
        title: storedValue.title ?? key,
        content: storedValue.content,
        tags: storedValue.tags ?? [],
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        value: storedValue,
      })
    } else {
      // Plain value — wrap as content string.
      this.docs_.set(key, {
        key,
        title: key,
        content: typeof storedValue === 'string' ? storedValue : JSON.stringify(storedValue),
        tags: [],
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        value: storedValue,
      })
    }
  }

  async retrieve(key: string): Promise<unknown | null> {
    const entry = this.docs_.get(key)
    return entry ? cloneWikiValue(entry.value) : null
  }

  async search(query: string): Promise<unknown[]> {
    const q = query.toLowerCase()
    const results: WikiStoredEntry[] = []

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

    return results.map(entry => ({
      key: entry.key,
      title: entry.title,
      content: entry.content,
      tags: [...entry.tags],
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      value: cloneWikiValue(entry.value),
    }))
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

function isWikiDocumentInput(value: unknown): value is WikiDocumentInput {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const record = value as Record<string, unknown>
  return typeof record['content'] === 'string'
}

function cloneWikiValue<T>(value: T): T {
  return structuredClone(value)
}

export const wikiMemoryBackendFactory: MemoryBackendFactory = {
  id: 'memory-wiki',
  isAvailable: () => true,
  create: () => new WikiMemoryBackend(),
}
