import type { ChannelAdapter, ChannelInboundHook, InboundRouteDecision } from './types.js'

/**
 * Routes an inbound message using the provided adapter and hook.
 */
export async function routeInboundMessage(
  adapter: ChannelAdapter,
  input: unknown,
  hook: ChannelInboundHook,
): Promise<InboundRouteDecision> {
  const normalized = adapter.normalize(input)
  if (!normalized.ok) {
    return { route: 'reject', reason: normalized.error.join(' ') }
  }

  return hook(normalized.value)
}
