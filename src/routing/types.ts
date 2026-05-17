// Adapted using referensi/openclaw/src/routing/types.ts

export const DEAD_LETTER_REASONS = ['invalid-message', 'no-route'] as const

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
  readonly reason: (typeof DEAD_LETTER_REASONS)[number]
  readonly detail: string
}

export type RoutingTable = {
  readonly routes: readonly RouteRule[]
}

export function isDeadLetterReason(value: unknown): value is (typeof DEAD_LETTER_REASONS)[number] {
  return typeof value === 'string' && DEAD_LETTER_REASONS.includes(value as (typeof DEAD_LETTER_REASONS)[number])
}
