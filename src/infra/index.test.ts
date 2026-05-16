import { afterEach, describe, expect, it } from 'bun:test'

import {
  atomicWriteTextFile,
  createTempDirectory,
  fileExists,
  readTextFileSafe,
  resolveInside,
  type TempDirectory,
} from './index.js'

const temps: TempDirectory[] = []

afterEach(async () => {
  await Promise.all(temps.splice(0).map(temp => temp.dispose()))
})

describe('infra filesystem helpers', () => {
  it('prevents traversal outside the configured root', () => {
    expect(resolveInside('/tmp/root', '../secret')).toEqual({
      ok: false,
      error: 'Path traversal outside root is not allowed',
    })
  })

  it('writes and reads files atomically inside the root', async () => {
    const temp = await createTempDirectory()
    temps.push(temp)

    const written = await atomicWriteTextFile(temp.path, 'nested/file.txt', 'hello')
    expect(written.ok).toBe(true)
    expect(await fileExists(temp.path, 'nested/file.txt')).toBe(true)
    expect(await readTextFileSafe(temp.path, 'nested/file.txt')).toEqual({
      ok: true,
      value: 'hello',
    })
  })
})
