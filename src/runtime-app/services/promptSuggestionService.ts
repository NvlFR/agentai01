export function createPromptSuggestionService(input: {
  readonly prompts: readonly string[]
  readonly skills?: readonly string[]
}) {
  return {
    suggest(prefix: string): readonly string[] {
      const normalizedPrefix = prefix.trim().toLowerCase()
      const candidates = [
        ...input.prompts,
        ...(input.skills ?? []).map(skill => `Use skill: ${skill}`),
      ]

      return candidates.filter(candidate => candidate.toLowerCase().includes(normalizedPrefix)).slice(0, 5)
    },
  }
}
