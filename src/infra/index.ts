import { mkdir, mkdtemp, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve, sep } from 'node:path'

import { err, ok, type Result } from '../shared/index.js'

export type SafePath = {
  root: string
  path: string
}

export type TempDirectory = {
  path: string
  dispose: () => Promise<void>
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

  try {
    return ok(await readFile(safePath.value.path, 'utf8'))
  } catch (error) {
    return err(error instanceof Error ? error.message : 'Unable to read file')
  }
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

  try {
    await mkdir(dirname(safePath.value.path), { recursive: true })
    const tempPath = `${safePath.value.path}.${process.pid}.${Date.now()}.tmp`
    await writeFile(tempPath, content, 'utf8')
    await rename(tempPath, safePath.value.path)
    return safePath
  } catch (error) {
    return err(error instanceof Error ? error.message : 'Unable to write file')
  }
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
