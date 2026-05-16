import { describe, expect, it } from 'bun:test'

import { createDeferred } from './deferred.js'

describe('createDeferred', () => {
  it('resolves the exposed promise through the exposed resolver', async () => {
    const deferred = createDeferred<string>()

    deferred.resolve('ready')

    await expect(deferred.promise).resolves.toBe('ready')
  })

  it('rejects the exposed promise through the exposed rejecter', async () => {
    const deferred = createDeferred<string>()

    deferred.reject(new Error('boom'))

    await expect(deferred.promise).rejects.toThrow('boom')
  })
})
