import { describe, expect, it } from 'bun:test'

import { createLazyAsync } from './lazy.js'

describe('createLazyAsync', () => {
  it('runs the factory once and reuses the first promise', async () => {
    let calls = 0
    const lazy = createLazyAsync(async () => {
      calls += 1
      return calls
    })

    await expect(lazy()).resolves.toBe(1)
    await expect(lazy()).resolves.toBe(1)
    expect(calls).toBe(1)
  })

  it('shares one pending factory result across concurrent callers', async () => {
    let calls = 0
    const lazy = createLazyAsync(async () => {
      calls += 1
      await Bun.sleep(1)
      return 'value'
    })

    await expect(Promise.all([lazy(), lazy()])).resolves.toEqual([
      'value',
      'value',
    ])
    expect(calls).toBe(1)
  })
})
