import { readFile, stat } from 'node:fs/promises'
import { resolve, sep } from 'node:path'

import { err, ok, type Result } from '../shared/index.js'
import { atomicWrite } from './atomic.js'

export type SafePath = {
  root: string
  path: string
}

export function resolveInside(root: string, unsafePath: string): Result<SafePath, string> {
  const resolvedRoot = resolve(root)
  const resolvedPath = resolve(resolvedRoot, unsafePath)
  const rootWithSeparator = resolvedRoot.endsWith(sep) ? resolvedRoot : `${resolvedRoot}${sep}`

  if (resolvedPath !== resolvedRoot && !resolvedPath.startsWith(rootWithSeparator)) {
    return err('Path traversal outside root is not allowed')
  }

  return ok({ root: resolvedRoot, path: resolvedPath })
}

export async function readFileSafe(path: string): Promise<Result<string, string>> {
  try {
    return ok(await readFile(path, 'utf8'))
  } catch (error) {
    return err(error instanceof Error ? error.message : 'Unable to read file')
  }
}

export async function writeFileAtomic(path: string, content: string): Promise<Result<string, string>> {
  return await atomicWrite(path, content)
}

export async function fileExists(root: string, unsafePath: string): Promise<boolean> {
  const safePath = resolveInside(root, unsafePath)
  if (!safePath.ok) {
    return false
  }

  try {
    const info = await stat(safePath.value.path)
    return info.isFile()
  } catch {
    return false
  }
}

export async function readTextFileSafe(
  root: string,
  unsafePath: string,
): Promise<Result<string, string>> {
  const safePath = resolveInside(root, unsafePath)
  if (!safePath.ok) {
    return safePath
  }

  return await readFileSafe(safePath.value.path)
}

export async function atomicWriteTextFile(
  root: string,
  unsafePath: string,
  content: string,
): Promise<Result<SafePath, string>> {
  const safePath = resolveInside(root, unsafePath)
  if (!safePath.ok) {
    return safePath
  }

  const written = await writeFileAtomic(safePath.value.path, content)
  if (!written.ok) {
    return written
  }

  return safePath
}
