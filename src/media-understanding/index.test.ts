import { describe, expect, test } from 'bun:test'

import { runMediaUnderstanding, type MediaUnderstandingProvider } from './index.js'

describe('media-understanding', () => {
  test('selects the first provider supporting the media kind', async () => {
    const providers: MediaUnderstandingProvider[] = [
      { id: 'audio-only', supports: ['audio'], understand: async () => ({ text: 'no' }) },
      { id: 'vision', supports: ['image'], understand: async () => ({ text: 'a chart' }) },
    ]

    const result = await runMediaUnderstanding({ kind: 'image', bytes: new Uint8Array() }, providers)

    expect(result.provider_id).toBe('vision')
    expect(result.text).toBe('a chart')
  })
})
