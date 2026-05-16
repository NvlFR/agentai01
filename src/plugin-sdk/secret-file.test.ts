import { afterEach, describe, expect, it } from 'bun:test'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { createTempDirectory } from '../infra/index.js'
import {
  DEFAULT_SECRET_FILE_MAX_BYTES,
  loadSecretFileSync,
  readSecretFileSync,
  tryReadSecretFileSync,
} from './secret-file.js'

describe('secret-file', () => {
  let tempDir: Awaited<ReturnType<typeof createTempDirectory>> | null = null

  afterEach(async () => {
    await tempDir?.dispose()
    tempDir = null
  })

  it('reads and trims secret files', async () => {
    tempDir = await createTempDirectory('plugin-sdk-secret-')
    const filePath = join(tempDir.path, 'token.txt')
    await writeFile(filePath, '  top-secret  \n', 'utf8')

    expect(readSecretFileSync(filePath, 'Gateway token')).toBe('top-secret')
    expect(tryReadSecretFileSync(filePath, 'Gateway token')).toBe('top-secret')
  })

  it('returns null for missing secret file in tryRead helper', async () => {
    tempDir = await createTempDirectory('plugin-sdk-secret-')
    const filePath = join(tempDir.path, 'missing.txt')

    expect(tryReadSecretFileSync(filePath, 'Gateway token')).toBeNull()
  })

  it('enforces max secret file size and exposes load result', async () => {
    tempDir = await createTempDirectory('plugin-sdk-secret-')
    const filePath = join(tempDir.path, 'large.txt')
    await writeFile(filePath, 'x'.repeat(DEFAULT_SECRET_FILE_MAX_BYTES + 1), 'utf8')

    const result = loadSecretFileSync(filePath, 'Gateway token')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.message).toContain(`exceeds ${DEFAULT_SECRET_FILE_MAX_BYTES} bytes`)
    }
  })
})
