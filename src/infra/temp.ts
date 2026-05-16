import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export type TempDirectory = {
  path: string
  dispose: () => Promise<void>
}

export async function createTempDirectory(prefix = 'agentai01-'): Promise<TempDirectory> {
  const path = await mkdtemp(join(tmpdir(), prefix))
  return {
    path,
    dispose: async () => {
      await rm(path, { recursive: true, force: true })
    },
  }
}
