import { describe, expect, it } from 'bun:test'

import { assertNever, mapDeep } from './deep.js'

describe('mapDeep', () => {
  it('maps nested object and array values while preserving paths', () => {
    const visitedPaths: string[] = []
    const mapped = mapDeep(
      {
        title: 'hello',
        nested: [{ token: 'secret' }],
      },
      (value, path) => {
        visitedPaths.push(path.join('.'))

        if (path[path.length - 1] === 'token') {
          return { handled: true, value: '[REDACTED]' }
        }

        if (typeof value === 'string') {
          return { handled: true, value: value.toUpperCase() }
        }

        return { handled: false }
      },
    )

    expect(mapped).toEqual({
      title: 'HELLO',
      nested: [{ token: '[REDACTED]' }],
    })
    expect(visitedPaths).toContain('nested.0.token')
  })
})

describe('assertNever', () => {
  it('throws with the unexpected value for impossible branches', () => {
    expect(() => assertNever('unexpected' as never)).toThrow(
      'Unexpected value: unexpected',
    )
  })
})
