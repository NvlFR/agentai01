import { describe, expect, it } from 'bun:test'

import { envSource } from './env-source.js'

describe('envSource', () => {
  it('filters undefined values from process.env style records', () => {
    const result = envSource({
      APP_PORT: '3000',
      AI_MODEL: undefined,
      AI_BASE_URL: 'http://localhost:8045/v1',
    })

    expect(result).toEqual({
      APP_PORT: '3000',
      AI_BASE_URL: 'http://localhost:8045/v1',
    })
  })
})
