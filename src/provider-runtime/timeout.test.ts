import { describe, expect, it } from 'bun:test'

import { ProviderTimeoutError, withProviderTimeout } from './timeout.js'

describe('withProviderTimeout', () => {
  it('passes an abort signal to the operation and throws ProviderTimeoutError on timeout', async () => {
    let aborted = false

    await expect(
      withProviderTimeout(
        async signal =>
          new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
              resolve('late')
            }, 50)

            signal.addEventListener(
              'abort',
              () => {
                aborted = true
                clearTimeout(timer)
                reject(new DOMException('Aborted', 'AbortError'))
              },
              { once: true },
            )
          }),
        1,
      ),
    ).rejects.toBeInstanceOf(ProviderTimeoutError)

    expect(aborted).toBe(true)
  })
})
