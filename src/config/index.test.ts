import { describe, expect, it } from 'bun:test'

import { envSource, parseConfig, readBoolean, readInteger, readObject, readString } from './index.js'

describe('parseConfig', () => {
  it('parses typed config from env-like sources', () => {
    const result = parseConfig(envSource({
      HOST: ' 127.0.0.1 ',
      PORT: '3000',
      ENABLED: 'true',
    }), {
      host: readString({ env: 'HOST' }),
      port: readInteger({ env: 'PORT', min: 1 }),
      enabled: readBoolean({ env: 'ENABLED' }),
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.config).toEqual({
        host: '127.0.0.1',
        port: 3000,
        enabled: true,
      })
    }
  })

  it('returns field-level errors without throwing', () => {
    const result = parseConfig({ port: 'nope' }, {
      port: readInteger(),
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors[0]?.field).toBe('port')
    }
  })

  it('parses nested object config', () => {
    const result = parseConfig({
      ai: { model: 'gpt-4.1-mini' },
    }, {
      ai: readObject({ model: readString() }),
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.config.ai.model).toBe('gpt-4.1-mini')
    }
  })
})
