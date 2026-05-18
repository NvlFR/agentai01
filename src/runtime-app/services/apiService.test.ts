import { describe, expect, it } from 'bun:test'
import { createApiService } from './apiService.js'

describe('createApiService', () => {
  it('retries and parses provider responses', async () => {
    let attempts = 0
    const service = createApiService({
      retries: 1,
      transport: async () => {
        attempts += 1
        if (attempts === 1) {
          throw new Error('temporary')
        }
        return { status: 200, body: '{"ok":true}' }
      },
    })

    await expect(service.request({
      url: 'https://example.test',
      parse: response => JSON.parse(response.body) as { ok: boolean },
    })).resolves.toEqual({ ok: true })
  })
})
