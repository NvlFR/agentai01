import { describe, expect, it } from 'bun:test'

import { parseConfig } from './parse.js'
import { readBoolean, readInteger, readObject, readString } from './readers.js'

describe('readString', () => {
  it('trims non-empty strings', () => {
    const result = readString()({ name: '  agentai  ' }, 'name')

    expect(result).toEqual({ ok: true, value: 'agentai' })
  })

  it('reports missing required fields', () => {
    const result = readString({ required: true })({}, 'name')

    expect(result).toEqual({
      ok: false,
      error: { field: 'name', message: 'name is required.' },
    })
  })
})

describe('readInteger', () => {
  it('parses bounded integers', () => {
    const result = parseConfig({ port: '3000' }, {
      port: readInteger({ min: 1, max: 65535 }),
    })

    expect(result).toEqual({
      ok: true,
      config: { port: 3000 },
      warnings: [],
    })
  })

  it('returns range errors for out-of-bounds values', () => {
    const result = parseConfig({ port: '70000' }, {
      port: readInteger({ min: 1, max: 65535 }),
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors).toEqual([
        { field: 'port', message: 'port must be at most 65535.' },
      ])
    }
  })
})

describe('readBoolean', () => {
  it('supports common truthy and falsy string values', () => {
    expect(readBoolean()({ enabled: 'yes' }, 'enabled')).toEqual({ ok: true, value: true })
    expect(readBoolean()({ enabled: 'off' }, 'enabled')).toEqual({ ok: true, value: false })
  })
})

describe('readObject', () => {
  it('parses nested object config', () => {
    const result = parseConfig({
      ai: { model: 'gpt-4.1-mini' },
    }, {
      ai: readObject({ model: readString() }),
    })

    expect(result).toEqual({
      ok: true,
      config: {
        ai: { model: 'gpt-4.1-mini' },
      },
      warnings: [],
    })
  })

  it('reports nested validation failures on the parent field', () => {
    const result = parseConfig({
      ai: { model: ' ' },
    }, {
      ai: readObject({ model: readString() }),
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors).toEqual([
        { field: 'ai', message: 'model is required.' },
      ])
    }
  })
})
