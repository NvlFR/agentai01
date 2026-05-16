import { describe, expect, test } from 'bun:test'

import { generateMusic } from './index.js'
import type { MediaGenerationProvider } from '../media-generation/index.js'

describe('music-generation', () => {
  test('wraps media generation for audio artifacts', async () => {
    const providers: MediaGenerationProvider[] = [
      { id: 'music', supports: ['audio'], generate: async request => ({ kind: request.kind, mime: 'audio/mpeg', prompt: request.prompt }) },
    ]

    const artifact = await generateMusic({ prompt: 'ambient loop' }, providers)

    expect(artifact.kind).toBe('audio')
    expect(artifact.provider_id).toBe('music')
  })
})
