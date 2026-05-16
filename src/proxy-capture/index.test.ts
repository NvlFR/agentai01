import { describe, expect, test } from 'bun:test'

import { createProxyCaptureStore } from './index.js'

describe('proxy-capture', () => {
  test('captures replay data without exposing authorization headers', () => {
    const store = createProxyCaptureStore()
    const capture = store.capture({
      request: {
        method: 'POST',
        url: 'https://provider.test/v1/chat',
        headers: { authorization: 'Bearer secret-token' },
        body: { prompt: 'hello' },
      },
      response: { status: 200, body: { ok: true } },
      tags: ['debug'],
    })

    expect(store.replay(capture.id)?.request.method).toBe('POST')
    expect(store.exportDebugLog()).not.toContain('secret-token')
  })
})
