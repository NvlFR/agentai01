import { mkdir, readdir, readFile, stat } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { MemoryFileRecord, MemoryNamespace, MemoryOwnerContext } from './types.js'
import { resolveSafePath, sanitizeSegment } from './path.js'
import { isMissingFileError, parseMemoryFileRecord } from './record.js'
import { writeFileAtomic } from '../infra/index.js'
import { migrate } from './migrate.js'
import { repair } from './repair.js'
import type { MemoryMigration, MemoryRepairReport } from './types.js'

export class MemoryFileStore {
  readonly #rootDir: string
  readonly #repairDir: string

  constructor(rootDir: string, repairDir?: string) {
    this.#rootDir = resolveSafePath(rootDir)
    this.#repairDir = repairDir ? resolveSafePath(repairDir) : resolveSafePath(this.#rootDir, '.repair')
  }

  get rootDir(): string {
    return this.#rootDir
  }

  get repairDir(): string {
    return this.#repairDir
  }

  namespace(kind: MemoryNamespace['kind'], id: string, owner: MemoryOwnerContext = {}): MemoryNamespace {
    const safeId = sanitizeSegment(id)
    const namespacePath = resolveSafePath(this.#rootDir, kind, safeId)
    return {
      kind,
      id: safeId,
      owner,
      path: namespacePath,
    }
  }

  async write(namespace: MemoryNamespace, key: string, value: unknown, now = new Date()): Promise<MemoryFileRecord> {
    const safeKey = sanitizeSegment(key)
    const path = resolveSafePath(namespace.path, `${safeKey}.json`)
    const record: MemoryFileRecord = {
      namespace,
      key: safeKey,
      path,
      value,
      updatedAt: now.toISOString(),
    }

    await mkdir(dirname(path), { recursive: true })
    const result = await writeFileAtomic(path, `${JSON.stringify(record, null, 2)}\n`)
    if (!result.ok) {
      throw new Error(`Failed to write memory file atomically: ${result.error}`)
    }
    return record
  }

  async read(namespace: MemoryNamespace, key: string): Promise<MemoryFileRecord | null> {
    const path = resolveSafePath(namespace.path, `${sanitizeSegment(key)}.json`)
    try {
      const parsed = JSON.parse(await readFile(path, 'utf8')) as unknown
      return parseMemoryFileRecord(parsed, namespace, path)
    } catch (error) {
      if (isMissingFileError(error)) {
        return null
      }

      throw error
    }
  }

  async list(namespace: MemoryNamespace): Promise<MemoryFileRecord[]> {
    try {
      const entries = await readdir(namespace.path)
      const records = await Promise.all(
        entries
          .filter(entry => entry.endsWith('.json'))
          .map(entry => this.read(namespace, entry.slice(0, -'.json'.length))),
      )
      return records.filter((record): record is MemoryFileRecord => record !== null)
    } catch (error) {
      if (isMissingFileError(error)) {
        return []
      }

      throw error
    }
  }

  async migrate(namespace: MemoryNamespace, migrations: readonly MemoryMigration[]): Promise<MemoryFileRecord[]> {
    return migrate(this, namespace, migrations)
  }

  async repair(namespace: MemoryNamespace): Promise<MemoryRepairReport> {
    return repair(this, namespace)
  }

  async exists(path: string): Promise<boolean> {
    try {
      await stat(path)
      return true
    } catch (error) {
      if (isMissingFileError(error)) {
        return false
      }

      throw error
    }
  }
}
