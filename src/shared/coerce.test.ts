import { describe, expect, it } from 'bun:test'

import { coerceBoolean, coerceNumber, coerceString } from './coerce.js'

describe('coerceString', () => {
  it('preserves strings and falls back for nullish values', () => {
    expect(coerceString('value', 'fallback')).toBe('value')
    expect(coerceString(null, 'fallback')).toBe('fallback')
    expect(coerceString(undefined, 'fallback')).toBe('fallback')
  })

  it('stringifies non-nullish values', () => {
    expect(coerceString(42)).toBe('42')
  })
})

describe('coerceNumber', () => {
  it('accepts finite numbers and numeric strings', () => {
    expect(coerceNumber(3, 0)).toBe(3)
    expect(coerceNumber('42', 0)).toBe(42)
  })

  it('returns the fallback for non-finite or non-numeric values', () => {
    expect(coerceNumber(Number.NaN, 7)).toBe(7)
    expect(coerceNumber('nope', 7)).toBe(7)
  })
})

describe('coerceBoolean', () => {
  it('accepts booleans and common truthy or falsy strings', () => {
    expect(coerceBoolean(true)).toBe(true)
    expect(coerceBoolean('yes')).toBe(true)
    expect(coerceBoolean('off', true)).toBe(false)
  })

  it('returns the fallback for unknown values', () => {
    expect(coerceBoolean('maybe', true)).toBe(true)
  })
})
