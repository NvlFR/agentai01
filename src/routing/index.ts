import { err, ok, type Result } from '../shared/index.js'

export type RoutedMessage = {
  readonly id: string
  readonly channel: string
  readonly body: string
  readonly agent_type?: string
  readonly metadata?: Record<string, unknown>
}

export type RouteTarget = {
  readonly agent_id: string
  readonly capability?: string
}

export type RouteRule = {
  readonly id: string
  readonly agent_type: string
  readonly target: RouteTarget
}

export type RouteResolution = {
  readonly message: RoutedMessage
  readonly route: RouteRule
}

export type DeadLetterMessage = {
  readonly message: RoutedMessage
  readonly reason: 'invalid-message' | 'no-route'
  readonly detail: string
}

export type RoutingTable = {
  readonly routes: readonly RouteRule[]
}

export function validateRoutedMessage(message: RoutedMessage): Result<RoutedMessage, DeadLetterMessage> {
  if (!message.id.trim()) {
    return err(deadLetter(message, 'invalid-message', 'Message id is required.'))
  }

  if (!message.channel.trim()) {
    return err(deadLetter(message, 'invalid-message', 'Message channel is required.'))
  }

  if (!message.body.trim()) {
    return err(deadLetter(message, 'invalid-message', 'Message body is required.'))
  }

  return ok(message)
}

export function resolveRoute(
  message: RoutedMessage,
  table: RoutingTable,
): Result<RouteResolution, DeadLetterMessage> {
  const validation = validateRoutedMessage(message)
  if (!validation.ok) {
    return validation
  }

  const route = table.routes.find(entry => entry.agent_type === message.agent_type)
  if (!route) {
    return err(deadLetter(message, 'no-route', `No route for agent type "${message.agent_type ?? 'unknown'}".`))
  }

  return ok({ message, route })
}

export class DeadLetterQueue {
  readonly #messages: DeadLetterMessage[] = []

  push(message: DeadLetterMessage): void {
    this.#messages.push(message)
  }

  list(): readonly DeadLetterMessage[] {
    return [...this.#messages]
  }
}

export function routeOrDeadLetter(
  message: RoutedMessage,
  table: RoutingTable,
  queue: DeadLetterQueue,
): Result<RouteResolution, DeadLetterMessage> {
  const resolution = resolveRoute(message, table)
  if (!resolution.ok) {
    queue.push(resolution.error)
  }

  return resolution
}

function deadLetter(
  message: RoutedMessage,
  reason: DeadLetterMessage['reason'],
  detail: string,
): DeadLetterMessage {
  return { message, reason, detail }
}
