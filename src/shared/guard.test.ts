import { describe, expect, it } from 'bun:test'

import { isBoolean, isNumber, isRecord, isString } from './guard.js'

describe('type guards', () => {
  it('narrows primitive values', () => {
    expect(isString('x')).toBe(true)
    expect(isString(1)).toBe(false)
    expect(isNumber(1)).toBe(true)
    expect(isNumber(Number.NaN)).toBe(false)
    expect(isBoolean(false)).toBe(true)
    expect(isBoolean('false')).toBe(false)
  })

  it('recognizes plain records but rejects null and arrays', () => {
    expect(isRecord({ a: 1 })).toBe(true)
    expect(isRecord(null)).toBe(false)
    expect(isRecord(['a'])).toBe(false)
  })
})
