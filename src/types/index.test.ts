import { describe, expect, it } from 'bun:test'

import { brand, isJsonValue, matchUnion, type ProjectId } from './index.js'

describe('shared types runtime helpers', () => {
  it('brands IDs without changing runtime representation', () => {
    const projectId: ProjectId = brand<'ProjectId'>('project-1')
    expect(String(projectId)).toBe('project-1')
  })

  it('validates JSON-safe values', () => {
    expect(isJsonValue({ ok: true, nested: ['x', 1, null] })).toBe(true)
    expect(isJsonValue({ bad: Number.NaN })).toBe(false)
    expect(isJsonValue({ bad: () => undefined })).toBe(false)
  })

  it('dispatches discriminated unions with exhaustive handler maps', () => {
    type Event =
      | { type: 'created'; id: string }
      | { type: 'closed'; reason: string }

    expect(
      matchUnion<Event, 'type', string>({ type: 'created', id: 'a' }, 'type', {
        created: event => event.id,
        closed: event => event.reason,
      }),
    ).toBe('a')
  })
})
