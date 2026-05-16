import { mkdir, readdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import { basename, dirname, join, relative, resolve } from 'node:path'

export type MemoryOwnerContext = {
  readonly projectId?: string
  readonly agentId?: string
}

export type MemoryNamespace = {
  readonly kind: 'project' | 'agent' | 'shared'
  readonly id: string
  readonly owner: MemoryOwnerContext
  readonly path: string
}

export type MemoryFileRecord = {
  readonly namespace: MemoryNamespace
  readonly key: string
  readonly path: string
  readonly value: unknown
  readonly updatedAt: string
}

export type MemoryMigration = {
  readonly id: string
  readonly fromVersion: number
  readonly toVersion: number
  migrate(value: unknown): unknown
}

export type MemoryRepairReport = {
  readonly repaired: readonly string[]
  readonly failed: readonly string[]
}

export class MemoryFileStore {
  readonly #rootDir: string
  readonly #repairDir: string

  constructor(rootDir: string, repairDir = join(rootDir, '.repair')) {
    this.#rootDir = resolve(rootDir)
    this.#repairDir = resolve(repairDir)
  }

  namespace(kind: MemoryNamespace['kind'], id: string, owner: MemoryOwnerContext = {}): MemoryNamespace {
    const safeId = sanitizeSegment(id)
    const namespacePath = this.resolveInside(this.#rootDir, kind, safeId)
    return {
      kind,
      id: safeId,
      owner,
      path: namespacePath,
    }
  }

  async write(namespace: MemoryNamespace, key: string, value: unknown, now = new Date()): Promise<MemoryFileRecord> {
    const safeKey = sanitizeSegment(key)
    const path = this.resolveInside(namespace.path, `${safeKey}.json`)
    const record: MemoryFileRecord = {
      namespace,
      key: safeKey,
      path,
      value,
      updatedAt: now.toISOString(),
    }

    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, `${JSON.stringify(record, null, 2)}\n`, 'utf8')
    return record
  }

  async read(namespace: MemoryNamespace, key: string): Promise<MemoryFileRecord | null> {
    const path = this.resolveInside(namespace.path, `${sanitizeSegment(key)}.json`)
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
    const records = await this.list(namespace)
    const migrated: MemoryFileRecord[] = []

    for (const record of records) {
      const version = readMemoryVersion(record.value)
      const chain = migrations
        .filter(migration => migration.fromVersion >= version)
        .sort((left, right) => left.fromVersion - right.fromVersion)

      let value = record.value
      let currentVersion = version
      for (const migration of chain) {
        if (migration.fromVersion !== currentVersion) {
          continue
        }

        value = migration.migrate(value)
        currentVersion = migration.toVersion
      }

      if (currentVersion !== version) {
        migrated.push(await this.write(namespace, record.key, withMemoryVersion(value, currentVersion)))
      }
    }

    return migrated
  }

  async repair(namespace: MemoryNamespace): Promise<MemoryRepairReport> {
    await mkdir(this.#repairDir, { recursive: true })
    const repaired: string[] = []
    const failed: string[] = []

    try {
      const entries = await readdir(namespace.path)
      for (const entry of entries.filter(name => name.endsWith('.json'))) {
        const source = this.resolveInside(namespace.path, entry)
        try {
          JSON.parse(await readFile(source, 'utf8')) as unknown
        } catch {
          const target = this.resolveInside(this.#repairDir, `${Date.now()}-${basename(entry)}`)
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

  resolveInside(base: string, ...segments: readonly string[]): string {
    const root = resolve(base)
    const candidate = resolve(root, ...segments)
    const pathIsInside = relative(root, candidate) === '' || !relative(root, candidate).startsWith('..')
    if (!pathIsInside) {
      throw new Error(`Unsafe memory path outside namespace: ${candidate}`)
    }

    return candidate
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

export function sanitizeSegment(value: string): string {
  const normalized = value.trim().replace(/[^a-zA-Z0-9._-]/g, '-')
  if (!normalized || normalized === '.' || normalized === '..' || normalized.includes('..')) {
    throw new Error(`Unsafe memory segment: ${value}`)
  }

  return normalized
}

function parseMemoryFileRecord(value: unknown, namespace: MemoryNamespace, path: string): MemoryFileRecord {
  if (!isRecord(value) || typeof value.key !== 'string' || !('value' in value) || typeof value.updatedAt !== 'string') {
    throw new Error(`Invalid memory file record: ${path}`)
  }

  return {
    namespace,
    key: sanitizeSegment(value.key),
    path,
    value: value.value,
    updatedAt: value.updatedAt,
  }
}

function readMemoryVersion(value: unknown): number {
  if (!isRecord(value) || typeof value.version !== 'number' || !Number.isInteger(value.version)) {
    return 0
  }

  return value.version
}

function withMemoryVersion(value: unknown, version: number): unknown {
  if (isRecord(value)) {
    return { ...value, version }
  }

  return { version, value }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isMissingFileError(error: unknown): boolean {
  return isRecord(error) && error.code === 'ENOENT'
}
