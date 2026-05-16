import { describe, expect, test } from 'bun:test'

import { generateImage } from './index.js'
import type { MediaGenerationProvider } from '../media-generation/index.js'

describe('image-generation', () => {
  test('uses provider-agnostic media generation contract', async () => {
    const providers: MediaGenerationProvider[] = [
      { id: 'images', supports: ['image'], generate: async request => ({ kind: request.kind, mime: 'image/png', prompt: request.prompt }) },
    ]

    const artifact = await generateImage({ prompt: 'logo' }, providers)

    expect(artifact.kind).toBe('image')
    expect(artifact.provider_id).toBe('images')
  })
})
