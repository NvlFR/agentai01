import { describe, expect, it } from 'bun:test'

import {
  createEmbeddingFunction,
  LanceDbMemoryBackend,
  type EmbeddingFunction,
} from './lancedbMemoryBackend.js'

describe('createEmbeddingFunction', () => {
  it('calls the OpenAI-compatible embeddings endpoint', async () => {
    const calls: Array<{ url: string; init: RequestInit | undefined }> = []
    const embedding = createEmbeddingFunction({
      baseUrl: 'http://127.0.0.1:8045/v1/',
      apiKey: 'test-key',
      model: 'text-embedding-3-small',
      fetchFn: async (url, init) => {
        calls.push({ url: String(url), init })
        return Response.json({
          data: [{ embedding: [0.1, 0.2, 0.3] }],
        })
      },
    })

    const vector = await embedding('halo runtime')

    expect(vector).toEqual([0.1, 0.2, 0.3])
    expect(calls).toHaveLength(1)
    expect(calls[0]?.url).toBe('http://127.0.0.1:8045/v1/embeddings')
    expect(calls[0]?.init?.headers).toEqual({
      'content-type': 'application/json',
      authorization: 'Bearer test-key',
    })
    expect(calls[0]?.init?.body).toContain('"model":"text-embedding-3-small"')
    expect(calls[0]?.init?.body).toContain('"input":"halo runtime"')
  })

  it('returns a descriptive error when provider responds with failure', async () => {
    const embedding = createEmbeddingFunction({
      baseUrl: 'http://127.0.0.1:8045/v1',
      apiKey: 'test-key',
      model: 'text-embedding-3-small',
      fetchFn: async () => new Response('upstream unavailable', { status: 503 }),
    })

    await expect(embedding('halo runtime')).rejects.toThrow(
      'memory-lancedb: embedding request failed. memory-lancedb: embedding provider responded with HTTP 503: upstream unavailable',
    )
  })
})

describe('LanceDbMemoryBackend', () => {
  it('uses the injected embedding function during store and search', async () => {
    const calls: string[] = []
    const rows: Array<{ key: string; value: string; vector: number[] }> = []
    const embeddingFunction: EmbeddingFunction = async text => {
      calls.push(text)
      return [text.length, text.length + 1]
    }

    const backend = new LanceDbMemoryBackend({
      embeddingFunction,
      connectDb: async () => ({
        tableNames: async () => ['memory'],
        openTable: async () => ({
          delete: async filter => {
            const match = /key = '(.+)'/.exec(filter)
            const key = match?.[1]?.replace(/''/g, "'")
            if (!key) {
              return
            }

            const index = rows.findIndex(row => row.key === key)
            if (index >= 0) {
              rows.splice(index, 1)
            }
          },
          add: async inputRows => {
            rows.push(...inputRows)
          },
          filter: expr => ({
            toArray: async () => {
              const match = /key = '(.+)'/.exec(expr)
              const key = match?.[1]?.replace(/''/g, "'")
              return rows
                .filter(row => row.key === key)
                .map(row => ({ key: row.key, value: row.value }))
            },
          }),
          search: vector => ({
            limit: count => ({
              toArray: async () =>
                rows.slice(0, count).map(row => ({
                  key: row.key,
                  value: row.value,
                  _distance: Math.abs((row.vector[0] ?? 0) - (vector[0] ?? 0)),
                })),
            }),
          }),
        }),
        createTable: async () => {
          throw new Error('createTable should not be called when table already exists')
        },
      }),
    })

    await backend.store('doc-1', { text: 'semantic memory' })
    const results = await backend.search('semantic query')

    expect(calls).toEqual([
      JSON.stringify({ text: 'semantic memory' }),
      'semantic query',
    ])
    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      key: 'doc-1',
      value: { text: 'semantic memory' },
    })
  })

  it('surfaces provider configuration errors instead of falling back to placeholder vectors', async () => {
    const backend = new LanceDbMemoryBackend({
      env: {
        AI_BASE_URL: undefined,
        AI_API_KEY: undefined,
      },
      connectDb: async () => ({
        tableNames: async () => ['memory'],
        openTable: async () => ({
          delete: async () => undefined,
          add: async () => undefined,
          filter: () => ({
            toArray: async () => [],
          }),
          search: () => ({
            limit: () => ({
              toArray: async () => [],
            }),
          }),
        }),
        createTable: async () => {
          throw new Error('createTable should not be called when table already exists')
        },
      }),
    })

    await expect(backend.search('needs embedding')).rejects.toThrow(
      'memory-lancedb: embedding provider is not configured. Set AI_BASE_URL and AI_API_KEY.',
    )
  })
})
