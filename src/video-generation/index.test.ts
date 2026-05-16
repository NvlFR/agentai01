import { describe, expect, test } from 'bun:test'

import { generateVideo } from './index.js'
import type { MediaGenerationProvider } from '../media-generation/index.js'

describe('video-generation', () => {
  test('wraps media generation for video artifacts', async () => {
    const providers: MediaGenerationProvider[] = [
      { id: 'videos', supports: ['video'], generate: async request => ({ kind: request.kind, mime: 'video/mp4', prompt: request.prompt }) },
    ]

    const artifact = await generateVideo({ prompt: 'launch clip' }, providers)

    expect(artifact.kind).toBe('video')
    expect(artifact.mime).toBe('video/mp4')
  })
})
