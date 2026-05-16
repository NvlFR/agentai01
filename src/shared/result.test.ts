import { describe, expect, it } from 'bun:test'

import { err, none, ok, some } from './result.js'

describe('result and option helpers', () => {
  it('creates explicit success and error result values', () => {
    expect(ok('ready')).toEqual({ ok: true, value: 'ready' })
    expect(err('failed')).toEqual({ ok: false, error: 'failed' })
  })

  it('creates explicit present and absent option values', () => {
    expect(some(42)).toEqual({ ok: true, value: 42 })
    expect(none).toEqual({ ok: false })
  })
})
