import { normalizeStringEntries } from '../../shared/string-normalization.js'

export const RUNTIME_PROMPT_ROLES = ['system', 'user', 'assistant', 'tool'] as const

export type RuntimePromptRole = typeof RUNTIME_PROMPT_ROLES[number]

export type RuntimePromptMessage = {
  readonly role: RuntimePromptRole
  readonly content: string
  readonly tags?: readonly string[]
}

export type ProviderPromptMessage = {
  readonly role: 'system' | 'user' | 'assistant'
  readonly content: string
}

export function normalizeRuntimePromptMessages(
  messages: readonly RuntimePromptMessage[],
): RuntimePromptMessage[] {
  return messages
    .map(message => ({
      role: message.role,
      content: message.content.replace(/\r\n/g, '\n').trim(),
      tags: normalizeStringEntries([...(message.tags ?? [])]),
    }))
    .filter(message => message.content.length > 0)
}

export function mapPromptMessagesToProviderInput(
  messages: readonly RuntimePromptMessage[],
): ProviderPromptMessage[] {
  return normalizeRuntimePromptMessages(messages).map(message => ({
    role: message.role === 'tool' ? 'assistant' : message.role,
    content: message.content,
  }))
}

export function appendPromptTag(
  message: RuntimePromptMessage,
  tag: string,
): RuntimePromptMessage {
  return {
    ...message,
    tags: normalizeStringEntries([...(message.tags ?? []), tag]),
  }
}
