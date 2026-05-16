export function formatIso8601(date: Date): string {
  return date.toISOString()
}

export function parseIso8601(value: string): Date | null {
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) {
    return null
  }

  return new Date(timestamp)
}
