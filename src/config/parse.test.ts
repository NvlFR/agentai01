import { describe, expect, it } from 'bun:test'

import { parseConfig } from './parse.js'
import { readBoolean, readInteger, readString } from './readers.js'

describe('parseConfig', () => {
  it('parses typed config from env-like sources', () => {
    const result = parseConfig({
      HOST: ' 127.0.0.1 ',
      PORT: '3000',
      ENABLED: 'true',
    }, {
      host: readString({ env: 'HOST' }),
      port: readInteger({ env: 'PORT', min: 1 }),
      enabled: readBoolean({ env: 'ENABLED' }),
    })

    expect(result).toEqual({
      ok: true,
      config: {
        host: '127.0.0.1',
        port: 3000,
        enabled: true,
      },
      warnings: [],
    })
  })

  it('returns field-level errors without throwing', () => {
    const result = parseConfig({ port: 'nope' }, {
      port: readInteger(),
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors).toEqual([
        { field: 'port', message: 'port must be an integer.' },
      ])
      expect(result.warnings).toEqual([])
    }
  })
})
