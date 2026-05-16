// src/runtime-app/memory/lancedb/lancedbMemoryBackend.ts
// LanceDB memory backend — vector similarity search via LanceDB.
// Falls back to memory-core when lancedb package is not installed.
//
// isAvailable() checks for the lancedb package at runtime without hard import.
// Config: LANCEDB_URI (default: ./runtime/.lancedb), LANCEDB_TABLE (default: memory)

import type { MemoryBackend, MemoryBackendFactory } from '../memoryBackend.js'

// Bypass TypeScript module resolution for optional dependency.
// At runtime this is equivalent to import(specifier) but tsc never checks it.
const dynamicImport: (specifier: string) => Promise<unknown> =
  new Function('specifier', 'return import(specifier)') as (s: string) => Promise<unknown>

const LANCEDB_DEFAULT_URI = './runtime/.lancedb'
const LANCEDB_DEFAULT_TABLE = 'memory'
// Embedding dimension for simple hash-based placeholder embeddings.
// Replace with real embedding model when available.
const EMBEDDING_DIM = 64

export class LanceDbMemoryBackend implements MemoryBackend {
  readonly id = 'memory-lancedb'

  // lancedb connection — typed as unknown because import is dynamic/optional.
  private db: unknown = null
  private table: unknown = null
  private readonly uri: string
  private readonly tableName: string

  constructor() {
    this.uri = process.env['LANCEDB_URI'] ?? LANCEDB_DEFAULT_URI
    this.tableName = process.env['LANCEDB_TABLE'] ?? LANCEDB_DEFAULT_TABLE
  }

  private async ensureConnected(): Promise<void> {
    if (this.db !== null) return

    // Dynamic import — fails gracefully if lancedb not installed.
    // Use a runtime-only import path to avoid TypeScript resolving optional dep at compile time.
    const lancedb: unknown = await dynamicImport('vectordb').catch(() => null)
    if (!lancedb) {
      throw new Error('memory-lancedb: vectordb package not installed. Run: npm install vectordb')
    }

    this.db = await (lancedb as { connect: (uri: string) => Promise<unknown> }).connect(this.uri)
    const dbTyped = this.db as {
      tableNames: () => Promise<string[]>
      openTable: (name: string) => Promise<unknown>
      createTable: (name: string, data: unknown[]) => Promise<unknown>
    }

    const tables = await dbTyped.tableNames()
    if (tables.includes(this.tableName)) {
      this.table = await dbTyped.openTable(this.tableName)
    } else {
      // Create table with initial schema row (will be deleted).
      this.table = await dbTyped.createTable(this.tableName, [
        { key: '__init__', value: '', vector: placeholderEmbedding('') },
      ])
      const tableTyped = this.table as {
        delete: (filter: string) => Promise<void>
      }
      await tableTyped.delete("key = '__init__'")
    }
  }

  async store(key: string, value: unknown): Promise<void> {
    await this.ensureConnected()
    const tableTyped = this.table as {
      delete: (filter: string) => Promise<void>
      add: (rows: unknown[]) => Promise<void>
    }
    // Delete existing entry for idempotency.
    await tableTyped.delete(`key = '${escapeFilter(key)}'`)
    const valueStr = typeof value === 'string' ? value : JSON.stringify(value)
    await tableTyped.add([{
      key,
      value: valueStr,
      vector: placeholderEmbedding(valueStr),
    }])
  }

  async retrieve(key: string): Promise<unknown | null> {
    await this.ensureConnected()
    const tableTyped = this.table as {
      filter: (expr: string) => { toArray: () => Promise<Array<{ key: string; value: string }>> }
    }
    const rows = await tableTyped.filter(`key = '${escapeFilter(key)}'`).toArray()
    if (rows.length === 0) return null
    const row = rows[0]
    if (!row) return null
    try {
      return JSON.parse(row.value)
    } catch {
      return row.value
    }
  }

  async search(query: string): Promise<unknown[]> {
    await this.ensureConnected()
    const tableTyped = this.table as {
      search: (vector: number[]) => { limit: (n: number) => { toArray: () => Promise<Array<{ key: string; value: string; _distance: number }>> } }
    }
    const queryVector = placeholderEmbedding(query)
    const rows = await tableTyped.search(queryVector).limit(10).toArray()
    return rows.map(r => ({
      key: r.key,
      value: (() => {
        try { return JSON.parse(r.value) } catch { return r.value }
      })(),
      score: r._distance,
    }))
  }

  async delete(key: string): Promise<void> {
    await this.ensureConnected()
    const tableTyped = this.table as {
      delete: (filter: string) => Promise<void>
    }
    await tableTyped.delete(`key = '${escapeFilter(key)}'`)
  }
}

/**
 * Placeholder embedding: simple hash-based fixed-dimension vector.
 * Replace with real embedding model (voyage, openai, etc.) in production.
 */
function placeholderEmbedding(text: string): number[] {
  const vec = new Array<number>(EMBEDDING_DIM).fill(0)
  for (let i = 0; i < text.length; i++) {
    vec[i % EMBEDDING_DIM] = (vec[i % EMBEDDING_DIM] ?? 0) + text.charCodeAt(i) / 256
  }
  // Normalize
  const magnitude = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1
  return vec.map(v => v / magnitude)
}

function escapeFilter(value: string): string {
  return value.replace(/'/g, "''")
}

export const lanceDbMemoryBackendFactory: MemoryBackendFactory = {
  id: 'memory-lancedb',
  isAvailable: (): boolean => {
    // We can't use require.resolve in ESM; attempt a sync check via globalThis.require if available.
    try {
      const req = (globalThis as Record<string, unknown>)['require'] as
        | ((id: string) => unknown)
        | undefined
      if (req) req.call(globalThis, 'vectordb')
      return true
    } catch {
      return false
    }
  },
  create: () => new LanceDbMemoryBackend(),
}
