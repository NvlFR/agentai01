// Adapted using referensi/openclaw/src/memory-host-sdk/host/embeddings.ts

import { z } from 'zod'

import type { MemoryBackend, MemoryBackendFactory } from '../memoryBackend.js'

export type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>

export type EmbeddingFunction = (text: string) => Promise<number[]>

type EmbeddingResponse = {
  data: Array<{
    embedding: number[]
  }>
}

type LanceDbTableRow = {
  key: string
  value: string
  vector: number[]
}

type LanceDbSearchRow = {
  key: string
  value: string
  _distance: number
}

type LanceDbTable = {
  delete: (filter: string) => Promise<void>
  add: (rows: LanceDbTableRow[]) => Promise<void>
  filter: (expr: string) => { toArray: () => Promise<Array<{ key: string; value: string }>> }
  search: (vector: number[]) => { limit: (n: number) => { toArray: () => Promise<LanceDbSearchRow[]> } }
}

type LanceDbDatabase = {
  tableNames: () => Promise<string[]>
  openTable: (name: string) => Promise<LanceDbTable>
  createTable: (name: string, data: LanceDbTableRow[]) => Promise<LanceDbTable>
}

export type LanceDbMemoryBackendOptions = {
  uri?: string
  tableName?: string
  env?: Record<string, string | undefined>
  timeoutMs?: number
  fetchFn?: FetchLike
  embeddingFunction?: EmbeddingFunction
  connectDb?: (uri: string) => Promise<LanceDbDatabase>
}

export type CreateEmbeddingFunctionOptions = {
  baseUrl?: string
  apiKey?: string
  model?: string
  timeoutMs?: number
  fetchFn?: FetchLike
}

const embeddingResponseSchema = z.object({
  data: z.array(
    z.object({
      embedding: z.array(z.number()),
    }),
  ).min(1),
})

const dynamicImport: (specifier: string) => Promise<unknown> =
  new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<unknown>

const LANCEDB_DEFAULT_URI = './runtime/.lancedb'
const LANCEDB_DEFAULT_TABLE = 'memory'
const DEFAULT_EMBEDDING_TIMEOUT_MS = 30_000
const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small'

export function createEmbeddingFunction(
  options: CreateEmbeddingFunctionOptions,
): EmbeddingFunction {
  const fetchFn = options.fetchFn ?? fetch
  const baseUrl = options.baseUrl?.trim()
  const apiKey = options.apiKey?.trim()
  const model = options.model?.trim()
  const timeoutMs = options.timeoutMs ?? DEFAULT_EMBEDDING_TIMEOUT_MS

  if (!baseUrl || !apiKey) {
    return async () => {
      throw new Error(
        'memory-lancedb: embedding provider is not configured. Set AI_BASE_URL and AI_API_KEY.',
      )
    }
  }

  if (!model) {
    return async () => {
      throw new Error(
        'memory-lancedb: embedding model is not configured. Set AI_EMBEDDING_MODEL or AI_MODEL.',
      )
    }
  }

  const endpoint = `${baseUrl.replace(/\/$/, '')}/embeddings`

  return async (text: string): Promise<number[]> => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetchFn(endpoint, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          input: text,
        }),
      })

      if (!response.ok) {
        const responseBody = await response.text()
        throw new Error(
          `memory-lancedb: embedding provider responded with HTTP ${response.status}${responseBody ? `: ${responseBody}` : ''}`,
        )
      }

      const parsed = embeddingResponseSchema.safeParse(await response.json())
      if (!parsed.success) {
        throw new Error('memory-lancedb: embedding provider returned an invalid response payload.')
      }

      return parsed.data.data[0].embedding
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(
          `memory-lancedb: embedding request timed out after ${timeoutMs}ms.`,
          { cause: error },
        )
      }

      if (error instanceof Error) {
        throw new Error(`memory-lancedb: embedding request failed. ${error.message}`, {
          cause: error,
        })
      }

      throw new Error('memory-lancedb: embedding request failed with an unknown error.')
    } finally {
      clearTimeout(timeout)
    }
  }
}

export class LanceDbMemoryBackend implements MemoryBackend {
  readonly id = 'memory-lancedb'

  private db: LanceDbDatabase | null = null
  private table: LanceDbTable | null = null
  private readonly uri: string
  private readonly tableName: string
  private readonly embeddingFunction: EmbeddingFunction
  private readonly connectDb: (uri: string) => Promise<LanceDbDatabase>

  constructor(options: LanceDbMemoryBackendOptions = {}) {
    const env = options.env ?? process.env

    this.uri = options.uri ?? env['LANCEDB_URI'] ?? LANCEDB_DEFAULT_URI
    this.tableName = options.tableName ?? env['LANCEDB_TABLE'] ?? LANCEDB_DEFAULT_TABLE
    this.embeddingFunction = options.embeddingFunction ?? createEmbeddingFunction({
      baseUrl: env['AI_BASE_URL'],
      apiKey: env['AI_API_KEY'],
      model: env['AI_EMBEDDING_MODEL'] ?? env['AI_MODEL'] ?? DEFAULT_EMBEDDING_MODEL,
      timeoutMs: options.timeoutMs ?? readTimeoutMs(env['AI_TIMEOUT_MS']),
      fetchFn: options.fetchFn,
    })
    this.connectDb = options.connectDb ?? loadLanceDbConnection
  }

  private async ensureConnected(): Promise<void> {
    if (this.db !== null && this.table !== null) {
      return
    }

    this.db = await this.connectDb(this.uri)
    const tables = await this.db.tableNames()

    if (tables.includes(this.tableName)) {
      this.table = await this.db.openTable(this.tableName)
      return
    }

    const initialVector = await this.embeddingFunction('')
    this.table = await this.db.createTable(this.tableName, [
      { key: '__init__', value: '', vector: initialVector },
    ])
    await this.table.delete("key = '__init__'")
  }

  async store(key: string, value: unknown): Promise<void> {
    const table = await this.getTable()
    const valueStr = typeof value === 'string' ? value : JSON.stringify(value)
    const vector = await this.embeddingFunction(valueStr)

    await table.delete(`key = '${escapeFilter(key)}'`)
    await table.add([{ key, value: valueStr, vector }])
  }

  async retrieve(key: string): Promise<unknown | null> {
    const table = await this.getTable()
    const rows = await table.filter(`key = '${escapeFilter(key)}'`).toArray()
    const row = rows[0]

    if (!row) {
      return null
    }

    try {
      return JSON.parse(row.value)
    } catch {
      return row.value
    }
  }

  async search(query: string): Promise<unknown[]> {
    const table = await this.getTable()
    const queryVector = await this.embeddingFunction(query)
    const rows = await table.search(queryVector).limit(10).toArray()

    return rows.map(row => ({
      key: row.key,
      value: parseStoredValue(row.value),
      score: row._distance,
    }))
  }

  async delete(key: string): Promise<void> {
    const table = await this.getTable()
    await table.delete(`key = '${escapeFilter(key)}'`)
  }

  private async getTable(): Promise<LanceDbTable> {
    await this.ensureConnected()

    if (this.table === null) {
      throw new Error('memory-lancedb: table was not initialized after connection.')
    }

    return this.table
  }
}

async function loadLanceDbConnection(uri: string): Promise<LanceDbDatabase> {
  const lancedb = await dynamicImport('vectordb').catch(() => null)
  if (!lancedb) {
    throw new Error('memory-lancedb: vectordb package not installed. Run: npm install vectordb')
  }

  const connect = (lancedb as { connect?: (targetUri: string) => Promise<LanceDbDatabase> }).connect
  if (typeof connect !== 'function') {
    throw new Error('memory-lancedb: vectordb package does not expose a connect(uri) function.')
  }

  return connect(uri)
}

function parseStoredValue(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function escapeFilter(value: string): string {
  return value.replace(/'/g, "''")
}

function readTimeoutMs(value: string | undefined): number {
  if (!value) {
    return DEFAULT_EMBEDDING_TIMEOUT_MS
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_EMBEDDING_TIMEOUT_MS
}

export const lanceDbMemoryBackendFactory: MemoryBackendFactory = {
  id: 'memory-lancedb',
  isAvailable: (): boolean => {
    try {
      const req = (globalThis as Record<string, unknown>)['require'] as
        | ((id: string) => unknown)
        | undefined
      if (req) {
        req.call(globalThis, 'vectordb')
      }
      return true
    } catch {
      return false
    }
  },
  create: () => new LanceDbMemoryBackend(),
}
