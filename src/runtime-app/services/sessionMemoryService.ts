export type SessionMemoryEntry = {
  readonly role: 'system' | 'user' | 'assistant'
  readonly content: string
}

export function createSessionMemoryService() {
  const entries: SessionMemoryEntry[] = []

  return {
    append(entry: SessionMemoryEntry): void {
      entries.push(entry)
    },
    list(): readonly SessionMemoryEntry[] {
      return [...entries]
    },
    buildPromptPrelude(limit = 3): string {
      return entries.slice(-limit).map(entry => `${entry.role}: ${entry.content}`).join('\n')
    },
  }
}
