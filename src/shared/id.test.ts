import { afterEach, describe, expect, it } from 'bun:test'

import { generateCorrelationId, generateId } from './id.js'

type TestGlobal = typeof globalThis & {
  __AGENTAI_TEST_RANDOM_UUID__?: (() => string) | undefined
}

const testGlobal = globalThis as TestGlobal

describe('id helpers', () => {
  afterEach(() => {
    delete testGlobal.__AGENTAI_TEST_RANDOM_UUID__
  })

  it('uses the deterministic uuid factory when test code installs one', () => {
    testGlobal.__AGENTAI_TEST_RANDOM_UUID__ = () => 'uuid-1'

    expect(generateId('job')).toBe('job-uuid-1')
  })

  it('normalizes blank id prefixes and delegates correlation ids to generateId', () => {
    testGlobal.__AGENTAI_TEST_RANDOM_UUID__ = () => 'uuid-2'

    expect(generateId('  ')).toBe('id-uuid-2')
    expect(generateCorrelationId('req')).toBe('req-uuid-2')
  })

  it('returns crypto-backed ids when no deterministic factory exists', () => {
    const id = generateId('job')

    expect(id).toStartWith('job-')
    expect(id.length).toBeGreaterThan('job-'.length)
  })
})
