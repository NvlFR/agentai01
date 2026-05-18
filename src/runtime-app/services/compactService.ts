export function compactTextEntries(input: {
  readonly entries: readonly string[]
  readonly maxCharacters: number
  readonly onTrimmed?: (count: number) => void
}): {
  readonly text: string
  readonly trimmed: boolean
} {
  const joined = input.entries.map(entry => entry.trim()).filter(Boolean).join('\n')
  if (joined.length <= input.maxCharacters) {
    return { text: joined, trimmed: false }
  }

  input.onTrimmed?.(joined.length - input.maxCharacters)
  return {
    text: `${joined.slice(0, input.maxCharacters).trim()}...`,
    trimmed: true,
  }
}
