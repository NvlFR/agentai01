import { relative, resolve } from 'node:path'

export function sanitizeSegment(value: string): string {
  const normalized = value.trim().replace(/[^a-zA-Z0-9._-]/g, '-')
  if (!normalized || normalized === '.' || normalized === '..' || normalized.includes('..')) {
    throw new Error(`Unsafe memory segment: ${value}`)
  }

  return normalized
}

export function resolveSafePath(base: string, ...segments: readonly string[]): string {
  const root = resolve(base)
  const candidate = resolve(root, ...segments)
  const pathIsInside = relative(root, candidate) === '' || !relative(root, candidate).startsWith('..')
  if (!pathIsInside) {
    throw new Error(`Unsafe memory path outside namespace: ${candidate}`)
  }

  return candidate
}
