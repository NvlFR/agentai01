import { isRecord } from '../shared/index.js'
import type { ChannelAttachment } from './types.js'

/**
 * Normalizes raw attachments from a channel message.
 * Skips entries missing required fields (id or mimeType).
 */
export function normalizeAttachments(input: unknown): readonly ChannelAttachment[] {
  if (!Array.isArray(input)) {
    return []
  }

  return input.flatMap(entry => {
    if (!isRecord(entry)) {
      return []
    }

    const id = typeof entry['id'] === 'string' ? entry['id'].trim() : ''
    const mimeType = typeof entry['mimeType'] === 'string' ? entry['mimeType'].trim() : ''
    if (!id || !mimeType) {
      return []
    }

    return [{
      id,
      mimeType,
      url: typeof entry['url'] === 'string' ? entry['url'] : undefined,
      name: typeof entry['name'] === 'string' ? entry['name'] : undefined,
    }]
  })
}
