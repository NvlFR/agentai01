import { mkdir, readdir, readFile, rename } from 'node:fs/promises'
import { basename } from 'node:path'
import type { MemoryNamespace, MemoryRepairReport } from './types.js'
import { resolveSafePath } from './path.js'
import { isMissingFileError } from './record.js'
import type { MemoryFileStore } from './store.js'

export async function repair(
  store: MemoryFileStore,
  namespace: MemoryNamespace,
): Promise<MemoryRepairReport> {
  const repairDir = store.repairDir
  await mkdir(repairDir, { recursive: true })
  const repaired: string[] = []
  const failed: string[] = []

  try {
    const entries = await readdir(namespace.path)
    for (const entry of entries.filter(name => name.endsWith('.json'))) {
      const source = resolveSafePath(namespace.path, entry)
      try {
        JSON.parse(await readFile(source, 'utf8')) as unknown
      } catch {
        const target = resolveSafePath(repairDir, `${Date.now()}-${basename(entry)}`)
        try {
          await rename(source, target)
          repaired.push(source)
        } catch {
          failed.push(source)
        }
      }
    }
  } catch (error) {
    if (!isMissingFileError(error)) {
      throw error
    }
  }

  return { repaired, failed }
}
