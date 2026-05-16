import { describe, expect, test } from 'bun:test'

import { detectMedia, validateMediaInput, writeTempMedia } from './index.js'

describe('media', () => {
  test('sniffs media type and validates policy', () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47])

    expect(detectMedia({ bytes: png, fileName: 'x.bin' }).mime).toBe('image/png')
    expect(validateMediaInput({ bytes: png }, { allowedKinds: ['audio'], maxBytes: 10 }).ok).toBe(false)
    expect(validateMediaInput({ bytes: png }, { allowedKinds: ['image'], maxBytes: 3 }).ok).toBe(false)
  })

  test('writes temp media with sanitized file name', async () => {
    const result = await writeTempMedia(
      { bytes: new Uint8Array([0xff, 0xd8]), fileName: '../photo.jpg' },
      { allowedKinds: ['image'], maxBytes: 10 },
    )

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.path.endsWith('photo.jpg')).toBe(true)
      await result.value.dispose()
    }
  })
})
