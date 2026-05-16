// Adapted from referensi/openclaw/src/tools/descriptor.test.ts
import { describe, expect, test } from 'bun:test'
import { validateToolDescriptor } from './descriptor.js'
import type { ToolDescriptor } from './types.js'

describe('validateToolDescriptor', () => {
  test('returns ok for valid descriptor', () => {
    const descriptor: ToolDescriptor = {
      name: 'test',
      description: 'test tool',
      input_schema: {},
      owner: { kind: 'core' },
    }
    const result = validateToolDescriptor(descriptor)
    expect(result.ok).toBe(true)
  })

  test('returns error for empty name', () => {
    const descriptor: any = {
      name: '',
      description: 'test',
      input_schema: {},
    }
    const result = validateToolDescriptor(descriptor)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('invalid_input')
      expect(result.error.message).toContain('name')
    }
  })

  test('returns error for empty description', () => {
    const descriptor: any = {
      name: 'test',
      description: ' ',
      input_schema: {},
    }
    const result = validateToolDescriptor(descriptor)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.message).toContain('description')
    }
  })

  test('returns error for invalid input_schema', () => {
    const descriptor: any = {
      name: 'test',
      description: 'test',
      input_schema: null,
    }
    const result = validateToolDescriptor(descriptor)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.message).toContain('input_schema')
    }
  })
})
