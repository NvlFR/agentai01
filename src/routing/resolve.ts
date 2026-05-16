// Adapted from referensi/openclaw/src/routing/resolve.ts
import { err, ok, type Result } from '../shared/index.js'
import { deadLetter, type DeadLetterQueue } from './dead-letter.js'
import type {
  DeadLetterMessage,
  RoutedMessage,
  RouteResolution,
  RoutingTable,
} from './types.js'

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
