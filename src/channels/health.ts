import type { ChannelHealth, ChannelHealthStatus, ChannelId } from './types.js'

/**
 * Creates a channel health record.
 */
export function createChannelHealth(
  channelId: ChannelId,
  status: ChannelHealthStatus,
  detail?: string,
  now: () => Date = () => new Date(),
): ChannelHealth {
  return {
    channelId,
    status,
    detail,
    checkedAt: now().toISOString(),
  }
}
