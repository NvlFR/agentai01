import { describe, expect, it } from 'bun:test'

import {
  err,
  coerceBoolean,
  coerceNumber,
  coerceString,
  createDeferred,
  createLazyAsync,
  formatIso8601,
  generateCorrelationId,
  generateId,
  isBoolean,
  isNumber,
  isRecord,
  isString,
  mapDeep,
  none,
  normalizeWhitespace,
  ok,
  paginate,
  parseIso8601,
  some,
} from './index.js'

describe('generateId', () => {
  it('returns unique ids for the same prefix', () => {
    const left = generateId('job')
    const right = generateId('job')

    expect(left).toStartWith('job-')
    expect(right).toStartWith('job-')
    expect(left).not.toBe(right)
  })

  it('creates correlation ids with the requested prefix', () => {
    expect(generateCorrelationId('req')).toStartWith('req-')
  })
})

describe('iso helpers', () => {
  it('round-trips a date through ISO 8601 formatting and parsing', () => {
    const date = new Date('2026-05-15T10:11:12.345Z')
    const parsed = parseIso8601(formatIso8601(date))

    expect(parsed?.getTime()).toBe(date.getTime())
  })

  it('returns null for invalid ISO input', () => {
    expect(parseIso8601('not-an-iso-date')).toBeNull()
  })
})

describe('helpers', () => {
  it('exposes explicit result and option helpers', () => {
    expect(ok('value')).toEqual({ ok: true, value: 'value' })
    expect(err('problem')).toEqual({ ok: false, error: 'problem' })
    expect(some(3)).toEqual({ ok: true, value: 3 })
    expect(none).toEqual({ ok: false })
  })

  it('narrows plain records and maps nested values safely', () => {
    const mapped = mapDeep(
      {
        safe: 'yes',
        nested: {
          token: 'secret',
        },
      },
      (value, path) => {
        if (path[path.length - 1] === 'token') {
          return {
            handled: true,
            value: '[REDACTED]',
          }
        }

        if (typeof value === 'string') {
          return {
            handled: true,
            value: value.toUpperCase(),
          }
        }

        return { handled: false }
      },
    )

    expect(isRecord(mapped)).toBe(true)
    expect(mapped).toEqual({
      safe: 'YES',
      nested: {
        token: '[REDACTED]',
      },
    })
  })

  it('normalizes and coerces external values predictably', () => {
    expect(normalizeWhitespace(' hello   runtime\nplatform ')).toBe(
      'hello runtime platform',
    )
    expect(coerceString(null, 'fallback')).toBe('fallback')
    expect(coerceNumber('42', 0)).toBe(42)
    expect(coerceBoolean('yes')).toBe(true)
    expect(isString('x')).toBe(true)
    expect(isNumber(Number.NaN)).toBe(false)
    expect(isBoolean(false)).toBe(true)
  })

  it('creates deferred and lazy async helpers', async () => {
    const deferred = createDeferred<string>()
    deferred.resolve('ready')
    await expect(deferred.promise).resolves.toBe('ready')

    let calls = 0
    const lazy = createLazyAsync(async () => {
      calls += 1
      return calls
    })

    await expect(lazy()).resolves.toBe(1)
    await expect(lazy()).resolves.toBe(1)
    expect(calls).toBe(1)
  })

  it('paginates arrays with explicit metadata', () => {
    expect(paginate(['a', 'b', 'c'], { page: 2, pageSize: 2 })).toEqual({
      items: ['c'],
      page: 2,
      pageSize: 2,
      totalItems: 3,
      totalPages: 2,
      hasNextPage: false,
      hasPreviousPage: true,
    })
  })
})
