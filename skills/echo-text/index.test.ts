import { describe, expect, it } from 'bun:test'
import { execute } from './index.mjs'

describe('echo-text skill', () => {
  it('returns deterministic formatted output', async () => {
    await expect(execute({ text: 'halo dunia', uppercase: true })).resolves.toEqual({
      text: 'HALO DUNIA',
      original: 'halo dunia',
      characterCount: 10,
    })
  })

  it('preserves original casing when uppercase is omitted', async () => {
    await expect(execute({ text: 'Mixed Case' })).resolves.toEqual({
      text: 'Mixed Case',
      original: 'Mixed Case',
      characterCount: 10,
    })
  })
})
