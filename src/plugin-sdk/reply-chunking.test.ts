import { describe, expect, it } from 'bun:test'
import { chunkText, resolveTextChunkLimit, DEFAULT_CHUNK_LIMIT } from './reply-chunking.js'

describe('resolveTextChunkLimit', () => {
  it('returns default when cfg is empty', () => {
    expect(resolveTextChunkLimit({}, 'telegram')).toBe(DEFAULT_CHUNK_LIMIT)
  })

  it('returns default when provider is missing', () => {
    expect(resolveTextChunkLimit({ channels: {} })).toBe(DEFAULT_CHUNK_LIMIT)
  })

  it('resolves provider-level textChunkLimit', () => {
    const cfg = { channels: { telegram: { textChunkLimit: 2000 } } }
    expect(resolveTextChunkLimit(cfg, 'telegram')).toBe(2000)
  })

  it('resolves account-level textChunkLimit', () => {
    const cfg = {
      channels: {
        telegram: {
          textChunkLimit: 2000,
          accounts: { acc1: { textChunkLimit: 1500 } },
        },
      },
    }
    expect(resolveTextChunkLimit(cfg, 'telegram', 'acc1')).toBe(1500)
  })

  it('uses fallbackLimit option', () => {
    expect(resolveTextChunkLimit({}, 'telegram', null, { fallbackLimit: 500 })).toBe(500)
  })
})

describe('chunkText', () => {
  it('returns empty for empty text', () => {
    expect(chunkText('', 100)).toEqual([])
  })

  it('returns single chunk for text within limit', () => {
    expect(chunkText('hello world', 100)).toEqual(['hello world'])
  })

  it('splits long text into multiple chunks', () => {
    const text = 'a'.repeat(100)
    const chunks = chunkText(text, 30)
    expect(chunks.length).toBeGreaterThan(1)
    chunks.forEach(chunk => {
      expect(chunk.length).toBeLessThanOrEqual(30)
    })
  })

  it('prefers newline break points', () => {
    const text = 'line one\nline two\nline three'
    const chunks = chunkText(text, 15)
    expect(chunks.length).toBeGreaterThan(1)
    // All parts are accounted for
    const joined = chunks.join('\n')
    expect(joined.replace(/\s+/g, ' ')).toBe(text.replace(/\s+/g, ' '))
  })
})
