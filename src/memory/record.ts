import type { MemoryFileRecord, MemoryNamespace } from './types.js'
import { sanitizeSegment } from './sanitize.js'

export function parseMemoryFileRecord(value: unknown, namespace: MemoryNamespace, path: string): MemoryFileRecord {
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

export function readMemoryVersion(value: unknown): number {
  if (!isRecord(value) || typeof value.version !== 'number' || !Number.isInteger(value.version)) {
    return 0
  }

  return value.version
}

export function withMemoryVersion(value: unknown, version: number): unknown {
  if (isRecord(value)) {
    return { ...value, version }
  }

  return { version, value }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isMissingFileError(error: unknown): boolean {
  return isRecord(error) && error.code === 'ENOENT'
}
