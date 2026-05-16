export function sanitizeSegment(value: string): string {
  const normalized = value.trim().replace(/[^a-zA-Z0-9._-]/g, '-')
  if (!normalized || normalized === '.' || normalized === '..' || normalized.includes('..')) {
    throw new Error(`Unsafe memory segment: ${value}`)
  }

  return normalized
}
