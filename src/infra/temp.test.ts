import { describe, expect, it } from 'bun:test'
import { stat } from 'node:fs/promises'

import { createTempDirectory } from './index.js'

describe('createTempDirectory', () => {
  it('creates a disposable directory and removes it on dispose', async () => {
    const temp = await createTempDirectory()

    const beforeDispose = await stat(temp.path)
    expect(beforeDispose.isDirectory()).toBe(true)

    await temp.dispose()

    await expect(stat(temp.path)).rejects.toThrow()
  })
})
