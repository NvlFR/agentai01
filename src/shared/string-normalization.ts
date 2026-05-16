/**
 * Normalize an array of string or number entries by trimming strings,
 * filtering out empty values, and removing duplicates.
 */
export function normalizeStringEntries(entries: Array<string | number> | null | undefined): string[] {
  if (!entries) {
    return []
  }

  const normalized = entries
    .map(entry => String(entry).trim())
    .filter(entry => entry.length > 0)

  return [...new Set(normalized)]
}
