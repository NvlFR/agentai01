// Adapted from referensi/openclaw/src/plugin-sdk/secret-file-runtime.ts
import { readFileSync, statSync } from 'node:fs'
import { resolve as resolvePath } from 'node:path'

export const DEFAULT_SECRET_FILE_MAX_BYTES = 64 * 1024

export type SecretFileReadOptions = {
  maxBytes?: number
  trim?: boolean
}

export type SecretFileReadResult =
  | {
      ok: true
      secret: string
      resolvedPath: string
    }
  | {
      ok: false
      message: string
      resolvedPath?: string
      error?: unknown
    }

export function readSecretFileSync(
  filePath: string,
  label: string,
  options: SecretFileReadOptions = {},
): string {
  const resolvedPath = resolveSecretFilePath(filePath, label)
  const maxBytes = normalizeMaxBytes(options.maxBytes)
  const info = statSync(resolvedPath)
  if (info.size > maxBytes) {
    throw new Error(`${label} file at ${resolvedPath} exceeds ${maxBytes} bytes.`)
  }

  const raw = readFileSync(resolvedPath, 'utf8')
  const value = options.trim === false ? raw : raw.trim()
  if (!value) {
    throw new Error(`${label} file at ${resolvedPath} is empty.`)
  }

  return value
}

export function tryReadSecretFileSync(
  filePath: string,
  label: string,
  options: SecretFileReadOptions = {},
): string | null {
  try {
    return readSecretFileSync(filePath, label, options)
  } catch (error) {
    const code = error instanceof Error && 'code' in error ? String(error.code) : ''
    if (code === 'ENOENT') {
      return null
    }

    throw error
  }
}

export function loadSecretFileSync(
  filePath: string,
  label: string,
  options: SecretFileReadOptions = {},
): SecretFileReadResult {
  const trimmedPath = filePath.trim()
  if (!trimmedPath) {
    return { ok: false, message: `${label} file path is empty.` }
  }

  const resolvedPath = resolvePath(trimmedPath)
  try {
    return {
      ok: true,
      secret: readSecretFileSync(filePath, label, options),
      resolvedPath,
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : String(error),
      resolvedPath,
      error,
    }
  }
}

function resolveSecretFilePath(filePath: string, label: string): string {
  const trimmedPath = filePath.trim()
  if (!trimmedPath) {
    throw new Error(`${label} file path is empty.`)
  }

  return resolvePath(trimmedPath)
}

function normalizeMaxBytes(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return DEFAULT_SECRET_FILE_MAX_BYTES
  }

  return Math.trunc(value)
}
