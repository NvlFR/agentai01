import { err, ok, type Result } from '../shared/index.js'
import { validateOperatorToken } from '../security/index.js'
import type { ChannelAuthContext, ChannelMessage, ChannelPrincipal } from './types.js'

/**
 * Authenticates a channel message against the provided context.
 */
export function authenticateChannelMessage(
  context: ChannelAuthContext,
  message: ChannelMessage,
): Result<ChannelPrincipal, string> {
  if (context.channelId !== message.channelId) {
    return err('channel_mismatch')
  }

  if (context.allowedPrincipalIds && !context.allowedPrincipalIds.has(message.sender.id)) {
    return err('principal_not_allowed')
  }

  if (context.token !== undefined) {
    const token = validateOperatorToken(context.token)
    if (!token.ok) {
      return err('missing_token')
    }
  }

  return ok(message.sender)
}
