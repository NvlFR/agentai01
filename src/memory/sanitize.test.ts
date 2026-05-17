import { describe, expect, it } from 'bun:test'
import { sanitizeSegment } from './sanitize.js'

describe('sanitizeSegment', () => {
  it('keeps safe alphanumeric segments', () => {
    expect(sanitizeSegment('hello')).toBe('hello')
    expect(sanitizeSegment('file-name.txt')).toBe('file-name.txt')
  })

  it('replaces unsafe characters with hyphens', () => {
    expect(sanitizeSegment('path/to/file')).toBe('path-to-file')
  })

  it('trims whitespace', () => {
    expect(sanitizeSegment('  spaced  ')).toBe('spaced')
  })

  it('throws for empty result', () => {
    expect(() => sanitizeSegment('')).toThrow('Unsafe memory segment')
    expect(() => sanitizeSegment('   ')).toThrow('Unsafe memory segment')
  })

  it('throws for dot-only segments', () => {
    expect(() => sanitizeSegment('.')).toThrow('Unsafe memory segment')
    expect(() => sanitizeSegment('..')).toThrow('Unsafe memory segment')
  })
})
