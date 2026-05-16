import { afterEach, describe, expect, it } from 'bun:test'
import { readdir, readFile } from 'node:fs/promises'

import { atomicWrite, createTempDirectory, resolveInside, type TempDirectory } from './index.js'

const temps: TempDirectory[] = []

afterEach(async () => {
  await Promise.all(temps.splice(0).map(temp => temp.dispose()))
})

describe('atomicWrite', () => {
  it('writes through a sibling temp file then renames to the target', async () => {
    const temp = await createTempDirectory()
    temps.push(temp)

    const safePath = resolveInside(temp.path, 'data/value.txt')
    expect(safePath.ok).toBe(true)
    if (!safePath.ok) {
      return
    }

    const written = await atomicWrite(safePath.value.path, 'stable')
    expect(written).toEqual({ ok: true, value: safePath.value.path })
    expect(await readFile(safePath.value.path, 'utf8')).toBe('stable')

    const files = await readdir(`${temp.path}/data`)
    expect(files).toEqual(['value.txt'])
  })
})
