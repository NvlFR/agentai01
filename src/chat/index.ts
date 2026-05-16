import { redactLogMessage } from '../logging/index.js'
import { serializeAuditSafe } from '../security/index.js'
import { generateId } from '../shared/index.js'
import { nowIso } from '../utils/index.js'

export type ChatRole = 'system' | 'user' | 'assistant' | 'tool'

export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
  timestamp: string
  metadata?: Record<string, unknown>
}

export type ChatHistory = {
  append(input: Omit<ChatMessage, 'id' | 'timestamp'> & Partial<Pick<ChatMessage, 'id' | 'timestamp'>>): ChatMessage
  list(): ChatMessage[]
  buildContext(maxCharacters: number): ChatMessage[]
}

export function createChatHistory(initialMessages: readonly ChatMessage[] = []): ChatHistory {
  const messages = initialMessages.map(sanitizeMessage)

  return {
    append(input) {
      const message = sanitizeMessage({
        ...input,
        id: input.id ?? generateId('msg'),
        timestamp: input.timestamp ?? nowIso(),
      })
      messages.push(message)
      return structuredClone(message)
    },
    list() {
      return messages.map(message => structuredClone(message))
    },
    buildContext(maxCharacters) {
      const result: ChatMessage[] = []
      let remaining = Math.max(0, maxCharacters)
      for (const message of [...messages].reverse()) {
        if (message.content.length > remaining) {
          continue
        }
        result.unshift(message)
        remaining -= message.content.length
      }
      return result.map(message => structuredClone(message))
    },
  }
}

function sanitizeMessage(message: ChatMessage): ChatMessage {
  return serializeAuditSafe({
    ...message,
    content: redactLogMessage(message.content),
  })
}
