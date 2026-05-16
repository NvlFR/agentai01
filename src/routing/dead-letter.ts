// Adapted from referensi/openclaw/src/routing/dead-letter.ts
import type { DeadLetterMessage, RoutedMessage } from './types.js'

export class DeadLetterQueue {
  readonly #messages: DeadLetterMessage[] = []

  push(message: DeadLetterMessage): void {
    this.#messages.push(message)
  }

  list(): readonly DeadLetterMessage[] {
    return [...this.#messages]
  }
}

export function deadLetter(
  message: RoutedMessage,
  reason: DeadLetterMessage['reason'],
  detail: string,
): DeadLetterMessage {
  return { message, reason, detail }
}
