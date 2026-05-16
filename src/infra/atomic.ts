import { mkdir, rename, rm, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { dirname } from 'node:path'

import { err, ok, type Result } from '../shared/index.js'

export async function atomicWrite(path: string, content: string): Promise<Result<string, string>> {
  const directory = dirname(path)
  const tempPath = `${path}.${process.pid}.${randomUUID()}.tmp`

  try {
    await mkdir(directory, { recursive: true })
    await writeFile(tempPath, content, 'utf8')
    await rename(tempPath, path)
    return ok(path)
  } catch (error) {
    await rm(tempPath, { force: true }).catch(() => undefined)
    return err(error instanceof Error ? error.message : 'Unable to write file')
  }
}
