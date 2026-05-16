import { afterEach, describe, expect, it } from 'bun:test'

import {
  atomicWriteTextFile,
  createTempDirectory,
  fileExists,
  readFileSafe,
  readTextFileSafe,
  resolveInside,
  writeFileAtomic,
  type TempDirectory,
} from './index.js'

const temps: TempDirectory[] = []

afterEach(async () => {
  await Promise.all(temps.splice(0).map(temp => temp.dispose()))
})

describe('infra filesystem helpers', () => {
  it('prevents traversal outside the configured root', () => {
    expect(resolveInside('/tmp/root', '../../etc/passwd')).toEqual({
      ok: false,
      error: 'Path traversal outside root is not allowed',
    })
  })

  it('allows resolving the root itself', () => {
    const resolved = resolveInside('/tmp/root', '.')
    expect(resolved.ok).toBe(true)
    if (resolved.ok) {
      expect(resolved.value.path).toBe(resolved.value.root)
    }
  })

  it('returns an error result for missing files instead of throwing', async () => {
    const result = await readFileSafe('/path/that/does/not/exist.txt')
    expect(result.ok).toBe(false)
  })

  it('writes and reads files through the direct task contract', async () => {
    const temp = await createTempDirectory()
    temps.push(temp)

    const safePath = resolveInside(temp.path, 'nested/file.txt')
    expect(safePath.ok).toBe(true)
    if (!safePath.ok) {
      return
    }

    const written = await writeFileAtomic(safePath.value.path, 'hello')
    expect(written).toEqual({ ok: true, value: safePath.value.path })
    expect(await readFileSafe(safePath.value.path)).toEqual({ ok: true, value: 'hello' })
  })

  it('keeps backward-compatible root-scoped helpers', async () => {
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
