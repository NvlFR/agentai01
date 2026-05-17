import { describe, expect, it } from 'bun:test'
import { AxiosError } from 'axios'

import { normalizeAxiosError } from './axios-client.js'

describe('axios-client', () => {
  it('normalizes axios request failures', () => {
    const error = new AxiosError('rate limited')
    error.response = {
      status: 429,
      statusText: 'Too Many Requests',
      headers: {},
      config: { headers: {} } as never,
      data: {},
    }

    expect(normalizeAxiosError(error)).toEqual({
      code: 'http_error',
      message: 'rate limited',
      status: 429,
      retryable: true,
    })
  })
})
