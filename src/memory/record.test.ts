import { describe, expect, it } from 'bun:test'
import { parseMemoryFileRecord, readMemoryVersion, withMemoryVersion, isRecord, isMissingFileError } from './record.js'

describe('readMemoryVersion', () => {
  it('returns 0 for non-record values', () => {
    expect(readMemoryVersion(null)).toBe(0)
    expect(readMemoryVersion('hello')).toBe(0)
    expect(readMemoryVersion(42)).toBe(0)
  })

  it('returns 0 when version is not a number', () => {
    expect(readMemoryVersion({ version: 'v1' })).toBe(0)
  })

  it('returns the version number', () => {
    expect(readMemoryVersion({ version: 3 })).toBe(3)
  })
})

describe('withMemoryVersion', () => {
  it('adds version to a record', () => {
    expect(withMemoryVersion({ name: 'Ada' }, 2)).toEqual({ name: 'Ada', version: 2 })
  })

  it('wraps non-record values', () => {
    expect(withMemoryVersion('plain', 1)).toEqual({ version: 1, value: 'plain' })
  })
})

describe('isRecord', () => {
  it('returns true for plain objects', () => {
    expect(isRecord({})).toBe(true)
    expect(isRecord({ key: 'value' })).toBe(true)
  })

  it('returns false for non-objects', () => {
    expect(isRecord(null)).toBe(false)
    expect(isRecord([])).toBe(false)
    expect(isRecord('string')).toBe(false)
    expect(isRecord(42)).toBe(false)
  })
})

describe('isMissingFileError', () => {
  it('returns true for ENOENT errors', () => {
    expect(isMissingFileError({ code: 'ENOENT' })).toBe(true)
  })

  it('returns false for other errors', () => {
    expect(isMissingFileError({ code: 'EPERM' })).toBe(false)
    expect(isMissingFileError(new Error('not found'))).toBe(false)
  })
})

describe('parseMemoryFileRecord', () => {
  const namespace = { kind: 'project' as const, id: 'test', owner: {}, path: '/tmp/test' }

  it('parses a valid record', () => {
    const raw = { key: 'brief', value: { text: 'hello' }, updatedAt: '2026-01-01T00:00:00Z' }
    const result = parseMemoryFileRecord(raw, namespace, '/tmp/test/brief.json')
    expect(result.key).toBe('brief')
    expect(result.value).toEqual({ text: 'hello' })
  })

  it('throws for invalid records', () => {
    expect(() => parseMemoryFileRecord(null, namespace, '/tmp/test/bad.json')).toThrow('Invalid memory file record')
    expect(() => parseMemoryFileRecord({}, namespace, '/tmp/test/bad.json')).toThrow('Invalid memory file record')
  })
})
