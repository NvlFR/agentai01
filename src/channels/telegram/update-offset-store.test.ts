import { afterEach, describe, expect, it } from 'bun:test'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

import { createTempDirectory } from '../../infra/index.js'
import {
  readTelegramUpdateOffset,
  resolveTelegramUpdateOffsetPath,
  writeTelegramUpdateOffset,
} from './update-offset-store.js'

describe('src/channels/telegram/update-offset-store.ts', () => {
  let tempDir: Awaited<ReturnType<typeof createTempDirectory>> | null = null

  afterEach(async () => {
    await tempDir?.dispose()
    tempDir = null
  })

  it('returns null when the offset file is missing', async () => {
    tempDir = await createTempDirectory('telegram-offset-')

    expect(
      await readTelegramUpdateOffset({
        stateRoot: tempDir.path,
        accountId: 'main',
      }),
    ).toBeNull()
  })

  it('writes and reads offsets atomically', async () => {
    tempDir = await createTempDirectory('telegram-offset-')

    await writeTelegramUpdateOffset({
      stateRoot: tempDir.path,
      accountId: 'main',
      token: '12345:alpha',
      updateId: 77,
    })

    expect(
      await readTelegramUpdateOffset({
        stateRoot: tempDir.path,
        accountId: 'main',
        token: '12345:alpha',
      }),
    ).toBe(77)
  })

  it('resets offsets when the stored version is incompatible', async () => {
    tempDir = await createTempDirectory('telegram-offset-')
    const storePath = resolveTelegramUpdateOffsetPath(tempDir.path, 'main')
    await mkdir(dirname(storePath), { recursive: true })
    await writeFile(
      storePath,
      JSON.stringify({ version: 99, lastUpdateId: 55, tokenFingerprint: null }),
      'utf8',
    )

    expect(
      await readTelegramUpdateOffset({
        stateRoot: tempDir.path,
        accountId: 'main',
      }),
    ).toBeNull()
  })

  it('resets offsets when the token fingerprint changes', async () => {
    tempDir = await createTempDirectory('telegram-offset-')

    await writeTelegramUpdateOffset({
      stateRoot: tempDir.path,
      accountId: 'main',
      token: '12345:alpha',
      updateId: 88,
    })

    expect(
      await readTelegramUpdateOffset({
        stateRoot: tempDir.path,
        accountId: 'main',
        token: '12345:beta',
      }),
    ).toBeNull()
  })
})
