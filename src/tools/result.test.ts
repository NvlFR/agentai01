// Adapted using referensi/openclaw/src/tools/result.test.ts
import { describe, expect, test } from 'bun:test'
import { createToolError, isToolError, normalizeToolError, normalizeToolResult } from './result.js'

describe('tool result helpers', () => {
  test('normalizeToolResult', () => {
    const res = normalizeToolResult({ data: 123 }, { meta: 'val' })
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.value.output).toEqual({ data: 123 })
      expect(res.value.metadata).toEqual({ meta: 'val' })
    }
  })

  test('normalizeToolError from Error', () => {
    const error = new Error('boom')
    const res = normalizeToolError(error, 'timeout', true)
    expect(res.code).toBe('timeout')
    expect(res.message).toBe('boom')
    expect(res.retryable).toBe(true)
    expect(res.details).toEqual({ name: 'Error' })
  })

  test('normalizeToolError from ToolError', () => {
    const original = createToolError('invalid_input', 'msg', false)
    const res = normalizeToolError(original)
    expect(res).toBe(original)
  })

  test('isToolError', () => {
    expect(isToolError({ code: 'a', message: 'b', retryable: true })).toBe(true)
    expect(isToolError({ code: 'a' })).toBe(false)
    expect(isToolError(null)).toBe(false)
  })
})
