import { describe, expect, it } from 'bun:test'
import { sanitizeSegment, resolveSafePath } from './path.js'

describe('sanitizeSegment', () => {
  it('normalizes valid segments', () => {
    expect(sanitizeSegment('hello')).toBe('hello')
    expect(sanitizeSegment(' abc ')).toBe('abc')
  })

  it('replaces unsafe characters with hyphens', () => {
    expect(sanitizeSegment('a/b')).toBe('a-b')
    expect(sanitizeSegment('a b c')).toBe('a-b-c')
  })

  it('throws for empty or dot-only segments', () => {
    expect(() => sanitizeSegment('')).toThrow('Unsafe memory segment')
    expect(() => sanitizeSegment('.')).toThrow('Unsafe memory segment')
    expect(() => sanitizeSegment('..')).toThrow('Unsafe memory segment')
  })
})

describe('resolveSafePath', () => {
  it('resolves paths within the base', () => {
    const result = resolveSafePath('/tmp/base', 'sub', 'file.json')
    expect(result).toBe('/tmp/base/sub/file.json')
  })

  it('throws for path traversal outside base', () => {
    expect(() => resolveSafePath('/tmp/base', '..', '..', 'etc', 'passwd')).toThrow('Unsafe memory path')
  })

  it('resolves base without segments', () => {
    const result = resolveSafePath('/tmp/base')
    expect(result).toBe('/tmp/base')
  })
})
