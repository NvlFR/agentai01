import { describe, expect, it } from 'bun:test'

import {
  createActionGate,
  jsonResult,
  parseStrictPositiveInteger,
  readNumberParam,
  readReactionParams,
  readStringArrayParam,
  readStringParam,
} from './action-gate.js'

describe('action-gate', () => {
  it('resolves action availability from gate config', () => {
    const gate = createActionGate<{ send: boolean; delete?: boolean }>({
      send: true,
      delete: false,
    })

    expect(gate('send')).toBe(true)
    expect(gate('delete')).toBe(false)
  })

  it('returns json response payloads', async () => {
    const response = jsonResult({ ok: true }, { status: 202 })

    expect(response.status).toBe(202)
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(await response.json()).toEqual({ ok: true })
  })

  it('reads params and throws descriptive errors for missing required values', () => {
    expect(readStringParam({ thread_id: ' 123 ' }, 'threadId', { required: true })).toBe('123')
    expect(readNumberParam({ limit: '5' }, 'limit', { required: true, integer: true })).toBe(5)
    expect(readStringArrayParam({ ids: 'a, b\nc' }, 'ids')).toEqual(['a', 'b', 'c'])

    expect(() => readStringParam({}, 'name', { required: true })).toThrow('name required')
    expect(() => parseStrictPositiveInteger('0', 'limit')).toThrow(
      'limit must be a positive integer',
    )
  })

  it('parses reaction params and validates removal input', () => {
    expect(
      readReactionParams(
        {
          emoji: '👍',
          remove: false,
        },
        { removeErrorMessage: 'emoji required for remove' },
      ),
    ).toEqual({
      emoji: '👍',
      remove: false,
      isEmpty: false,
    })

    expect(() =>
      readReactionParams(
        {
          emoji: '',
          remove: true,
        },
        { removeErrorMessage: 'emoji required for remove' },
      ),
    ).toThrow('emoji required for remove')
  })
})
