// Adapted from referensi/openclaw/src/routing/types.ts

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
