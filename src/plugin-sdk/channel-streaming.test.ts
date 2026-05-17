import { describe, expect, it } from 'bun:test'
import { getChannelStreamingConfigObject, resolveChannelStreamingPreviewChunk } from './channel-streaming.js'

describe('getChannelStreamingConfigObject', () => {
  it('returns undefined for null/undefined entry', () => {
    expect(getChannelStreamingConfigObject(null)).toBeUndefined()
    expect(getChannelStreamingConfigObject(undefined)).toBeUndefined()
  })

  it('returns undefined when streaming is not an object', () => {
    expect(getChannelStreamingConfigObject({ streaming: 'off' })).toBeUndefined()
    expect(getChannelStreamingConfigObject({ streaming: 42 })).toBeUndefined()
  })

  it('returns the streaming config when it is an object', () => {
    const result = getChannelStreamingConfigObject({ streaming: { mode: 'block' } })
    expect(result).toEqual({ mode: 'block' })
  })
})

describe('resolveChannelStreamingPreviewChunk', () => {
  it('returns null/undefined for null/undefined entry', () => {
    expect(resolveChannelStreamingPreviewChunk(null)).toBeFalsy()
    expect(resolveChannelStreamingPreviewChunk(undefined)).toBeFalsy()
  })

  it('resolves chunk config from streaming.preview.chunk', () => {
    const result = resolveChannelStreamingPreviewChunk({
      streaming: { preview: { chunk: { minChars: 100, maxChars: 500 } } },
    })
    expect(result).toEqual({ minChars: 100, maxChars: 500 })
  })

  it('falls back to draftChunk when streaming config is absent', () => {
    const result = resolveChannelStreamingPreviewChunk({
      draftChunk: { minChars: 200, maxChars: 800 },
    })
    expect(result).toEqual({ minChars: 200, maxChars: 800 })
  })

  it('prefers streaming.preview.chunk over draftChunk', () => {
    const result = resolveChannelStreamingPreviewChunk({
      streaming: { preview: { chunk: { minChars: 100 } } },
      draftChunk: { minChars: 200 },
    })
    expect(result).toEqual({ minChars: 100 })
  })
})
