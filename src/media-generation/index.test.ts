import { describe, expect, test } from 'bun:test'

import { createInMemoryMediaResultStore, generateMedia, type MediaGenerationProvider } from './index.js'

describe('media-generation', () => {
  test('falls back by capability and stores generated artifacts', async () => {
    const store = createInMemoryMediaResultStore()
    const providers: MediaGenerationProvider[] = [
      { id: 'image-only', supports: ['image'], generate: async request => ({ kind: request.kind, mime: 'image/png', prompt: request.prompt }) },
      { id: 'audio', supports: ['audio'], generate: async request => ({ kind: request.kind, mime: 'audio/mpeg', prompt: request.prompt, bytes: new Uint8Array([1]) }) },
    ]

    const artifact = await generateMedia({ kind: 'audio', prompt: 'theme' }, providers, store)
    const saved = await store.get(artifact.id)

    expect(artifact.provider_id).toBe('audio')
    expect(saved?.bytes?.byteLength).toBe(1)
  })
})
