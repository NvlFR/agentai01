import { describe, expect, it } from 'bun:test'

import {
  err,
  formatIso8601,
  generateCorrelationId,
  generateId,
  isRecord,
  mapDeep,
  none,
  ok,
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
})
