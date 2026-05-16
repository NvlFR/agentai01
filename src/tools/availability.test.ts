// Adapted from referensi/openclaw/src/tools/availability.test.ts
import { describe, expect, test } from 'bun:test'
import { evaluateToolAvailability } from './availability.js'

describe('evaluateToolAvailability', () => {
  test('returns empty diagnostics for undefined expression', () => {
    expect(evaluateToolAvailability(undefined)).toEqual([])
  })

  test('handles always signal', () => {
    expect(evaluateToolAvailability({ kind: 'always' })).toEqual([])
  })

  test('handles auth signal', () => {
    const signal = { kind: 'auth', provider_id: 'google' } as const
    expect(evaluateToolAvailability(signal, { auth_provider_ids: new Set(['google']) })).toEqual([])
    expect(evaluateToolAvailability(signal, { auth_provider_ids: new Set() })).toHaveLength(1)
  })

  test('handles env signal', () => {
    const signal = { kind: 'env', name: 'API_KEY' } as const
    expect(evaluateToolAvailability(signal, { env: { API_KEY: 'secret' } })).toEqual([])
    expect(evaluateToolAvailability(signal, { env: {} })).toHaveLength(1)
  })

  test('handles allOf with failing sub-expressions', () => {
    const expression = {
      allOf: [
        { kind: 'env', name: 'KEY1' },
        { kind: 'env', name: 'KEY2' },
      ],
    } as const
    const diagnostics = evaluateToolAvailability(expression, { env: {} })
    expect(diagnostics).toHaveLength(2)
  })

  test('handles anyOf with one passing sub-expression', () => {
    const expression = {
      anyOf: [
        { kind: 'env', name: 'KEY1' },
        { kind: 'env', name: 'KEY2' },
      ],
    } as const
    const diagnostics = evaluateToolAvailability(expression, { env: { KEY2: 'value' } })
    expect(diagnostics).toHaveLength(0)
  })

  test('handles config signal', () => {
    const signal = { kind: 'config', path: ['deep', 'key'], check: 'non-empty' } as const
    expect(evaluateToolAvailability(signal, { config: { deep: { key: 'val' } } })).toEqual([])
    expect(evaluateToolAvailability(signal, { config: { deep: { key: '' } } })).toHaveLength(1)
  })
})
