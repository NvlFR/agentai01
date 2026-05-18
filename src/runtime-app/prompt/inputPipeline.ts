import { normalizeStringEntries } from '../../shared/string-normalization.js'

export const INPUT_KINDS = ['slash-command', 'bash-command', 'text-prompt'] as const

export type InputKind = typeof INPUT_KINDS[number]

export type PromptPipelineResult = {
  readonly kind: InputKind
  readonly raw: string
  readonly normalized: string
  readonly commandName?: string
  readonly argsText?: string
  readonly tokens: readonly string[]
  readonly shouldQuery: boolean
  readonly tags: readonly string[]
}

export function processPromptInput(input: string): PromptPipelineResult {
  const normalized = normalizePromptInput(input)
  const tokens = normalized.length > 0 ? normalized.split(/\s+/) : []

  if (normalized.startsWith('/')) {
    const [commandToken, ...args] = tokens
    return {
      kind: 'slash-command',
      raw: input,
      normalized,
      commandName: commandToken.slice(1),
      argsText: args.join(' '),
      tokens,
      shouldQuery: false,
      tags: normalizeStringEntries(['command', commandToken.slice(1)]),
    }
  }

  if (normalized.startsWith('!')) {
    const commandText = normalized.slice(1).trim()
    return {
      kind: 'bash-command',
      raw: input,
      normalized: commandText,
      argsText: commandText,
      tokens: commandText.length > 0 ? commandText.split(/\s+/) : [],
      shouldQuery: false,
      tags: normalizeStringEntries(['bash']),
    }
  }

  return {
    kind: 'text-prompt',
    raw: input,
    normalized,
    tokens,
    shouldQuery: normalized.length > 0,
    tags: [],
  }
}

export function normalizePromptInput(input: string): string {
  return input
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .trim()
}
