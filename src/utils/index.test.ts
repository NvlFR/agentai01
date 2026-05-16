import { describe, expect, it } from 'bun:test'

import {
  clamp,
  dedupe,
  isPathInside,
  parseTimestamp,
  retry,
  safeParseJson,
  toArtifactPath,
  truncate,
} from './index.js'

describe('utils', () => {
  it('parses JSON without throwing', () => {
    expect(safeParseJson<{ ok: boolean }>('{"ok":true}')).toEqual({
      ok: true,
      value: { ok: true },
    })
    expect(safeParseJson('{')).toMatchObject({ ok: false })
  })

  it('provides numeric and collection helpers', () => {
    expect(clamp(12, 1, 10)).toBe(10)
    expect(truncate('runtime-platform', 10)).toBe('runtime...')
    expect(dedupe(['a', 'a', 'b'])).toEqual(['a', 'b'])
  })

  it('retries with injected sleep for deterministic tests', async () => {
    const attempts: number[] = []
    const result = await retry(
      async attempt => {
        attempts.push(attempt)
        if (attempt < 3) {
          throw new Error('try again')
        }
        return 'ok'
      },
      { attempts: 3, sleep: async () => undefined },
    )

    expect(result).toBe('ok')
    expect(attempts).toEqual([1, 2, 3])
  })

  it('normalizes timestamp and artifact path helpers', () => {
    expect(parseTimestamp('bad')).toEqual({
      ok: false,
      error: 'Invalid ISO 8601 timestamp',
    })
    expect(toArtifactPath({ namespace: '../project 1', name: 'MEMORY.md' })).toBe(
      'project-1/MEMORY.md',
    )
    expect(isPathInside('/tmp/root', '/tmp/root/a.txt')).toBe(true)
    expect(isPathInside('/tmp/root', '/tmp/rootish/a.txt')).toBe(false)
  })
})
