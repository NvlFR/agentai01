import { normalizeStringEntries } from '../../shared/string-normalization.js'

export type PromptSuggestionKind = 'command' | 'skill' | 'prompt'

export type PromptSuggestionItem = {
  readonly kind: PromptSuggestionKind
  readonly value: string
  readonly reason: string
  readonly score: number
}

export type PromptSuggestionRequest = {
  readonly input: string
  readonly commands?: readonly string[]
  readonly skills?: readonly string[]
  readonly recentPrompts?: readonly string[]
}

export type PromptSuggestionResult = {
  readonly inlineCompletion: string | null
  readonly suggestions: readonly PromptSuggestionItem[]
}

export function buildPromptSuggestions(
  request: PromptSuggestionRequest,
): PromptSuggestionResult {
  const normalizedInput = request.input.trim().toLowerCase()
  const catalog = [
    ...rankEntries('command', normalizedInput, request.commands ?? [], 300),
    ...rankEntries('skill', normalizedInput, request.skills ?? [], 200),
    ...rankEntries('prompt', normalizedInput, request.recentPrompts ?? [], 100),
  ]
    .sort((left, right) => right.score - left.score || left.value.localeCompare(right.value))
    .slice(0, 8)

  const inlineCompletion = chooseInlineCompletion(request.input, catalog)

  return {
    inlineCompletion,
    suggestions: catalog,
  }
}

function rankEntries(
  kind: PromptSuggestionKind,
  normalizedInput: string,
  entries: readonly string[],
  baseScore: number,
): PromptSuggestionItem[] {
  const uniqueEntries = normalizeStringEntries([...entries])
  return uniqueEntries
    .map(value => {
      const normalizedValue = value.toLowerCase()
      if (normalizedInput.length === 0) {
        return {
          kind,
          value,
          reason: `${kind} catalog`,
          score: baseScore,
        }
      }

      if (normalizedValue.startsWith(normalizedInput)) {
        return {
          kind,
          value,
          reason: `prefix match in ${kind}`,
          score: baseScore + 100 - (normalizedValue.length - normalizedInput.length),
        }
      }

      if (normalizedValue.includes(normalizedInput)) {
        return {
          kind,
          value,
          reason: `contains match in ${kind}`,
          score: baseScore + 25,
        }
      }

      return null
    })
    .filter((entry): entry is PromptSuggestionItem => entry !== null)
}

function chooseInlineCompletion(
  rawInput: string,
  suggestions: readonly PromptSuggestionItem[],
): string | null {
  const trimmedInput = rawInput.trim()
  if (trimmedInput.length === 0) {
    return null
  }

  const best = suggestions.find(item => item.value.toLowerCase().startsWith(trimmedInput.toLowerCase()))
  if (!best) {
    return null
  }

  return best.value.slice(trimmedInput.length) || null
}
