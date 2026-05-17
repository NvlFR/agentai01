// Adapted using referensi/openclaw/extensions/whatsapp/src/inbound/extract.ts
// Note: Baileys is not a dependency — uses generic message shape instead of proto.IMessage

/**
 * Generic WhatsApp message shape (Baileys-compatible subset).
 * Covers the fields needed for text/media/location/contact extraction.
 */
export type WAMessage = {
  conversation?: string | null
  extendedTextMessage?: {
    text?: string | null
    contextInfo?: WAContextInfo | null
  } | null
  imageMessage?: {
    caption?: string | null
    contextInfo?: WAContextInfo | null
  } | null
  videoMessage?: {
    caption?: string | null
    contextInfo?: WAContextInfo | null
  } | null
  audioMessage?: {
    contextInfo?: WAContextInfo | null
  } | null
  documentMessage?: {
    caption?: string | null
    contextInfo?: WAContextInfo | null
  } | null
  stickerMessage?: {
    contextInfo?: WAContextInfo | null
  } | null
  locationMessage?: {
    degreesLatitude?: number | null
    degreesLongitude?: number | null
    accuracyInMeters?: number | null
    name?: string | null
    address?: string | null
    comment?: string | null
    isLive?: boolean | null
  } | null
  liveLocationMessage?: {
    degreesLatitude?: number | null
    degreesLongitude?: number | null
    accuracyInMeters?: number | null
    caption?: string | null
  } | null
  contactMessage?: {
    displayName?: string | null
    vcard?: string | null
  } | null
  contactsArrayMessage?: {
    contacts?: Array<{
      displayName?: string | null
      vcard?: string | null
    }> | null
  } | null
  buttonsResponseMessage?: {
    selectedButtonId?: string | null
    contextInfo?: WAContextInfo | null
  } | null
  listResponseMessage?: {
    singleSelectReply?: { selectedRowId?: string | null } | null
    contextInfo?: WAContextInfo | null
  } | null
  templateButtonReplyMessage?: {
    selectedId?: string | null
    contextInfo?: WAContextInfo | null
  } | null
  interactiveResponseMessage?: {
    nativeFlowResponseMessage?: unknown
    contextInfo?: WAContextInfo | null
  } | null
  ephemeralMessage?: { message?: WAMessage | null } | null
  viewOnceMessage?: { message?: WAMessage | null } | null
  viewOnceMessageV2?: { message?: WAMessage | null } | null
  viewOnceMessageV2Extension?: { message?: WAMessage | null } | null
  documentWithCaptionMessage?: { message?: WAMessage | null } | null
  groupMentionedMessage?: { message?: WAMessage | null } | null
  botInvokeMessage?: { message?: WAMessage | null } | null
}

export type WAContextInfo = {
  stanzaId?: string | null
  participant?: string | null
  quotedMessage?: WAMessage | null
  mentionedJid?: string[] | null
}

export type WhatsAppMessageKind =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'sticker'
  | 'location'
  | 'contact'
  | 'contacts'
  | 'button-response'
  | 'list-response'
  | 'template-button-reply'
  | 'interactive-response'
  | 'unknown'

export type WhatsAppExtractedMessage = {
  text: string | undefined
  kind: WhatsAppMessageKind
  mediaPlaceholder: string | undefined
  contextInfo: WAContextInfo | undefined
  mentionedJids: string[] | undefined
}

export type NormalizedLocation = {
  latitude: number
  longitude: number
  accuracy?: number
  name?: string
  address?: string
  caption?: string
  source: 'live' | 'place' | 'pin'
  isLive: boolean
}

const WRAPPER_KEYS = [
  'botInvokeMessage',
  'ephemeralMessage',
  'viewOnceMessage',
  'viewOnceMessageV2',
  'viewOnceMessageV2Extension',
  'documentWithCaptionMessage',
  'groupMentionedMessage',
] as const

type WrapperKey = (typeof WRAPPER_KEYS)[number]

function unwrapMessage(message: WAMessage | undefined | null): WAMessage | undefined {
  if (!message) return undefined
  let current: WAMessage = message
  for (let depth = 0; depth < 4; depth++) {
    let unwrapped = false
    for (const key of WRAPPER_KEYS) {
      const wrapper = current[key as WrapperKey] as { message?: WAMessage | null } | null | undefined
      if (wrapper?.message) {
        current = wrapper.message
        unwrapped = true
        break
      }
    }
    if (!unwrapped) break
  }
  return current
}

/**
 * Extract plain text from a WhatsApp message (unwraps ephemeral/viewOnce wrappers).
 */
export function extractWhatsAppText(rawMessage: WAMessage | undefined | null): string | undefined {
  const message = unwrapMessage(rawMessage)
  if (!message) return undefined

  if (typeof message.conversation === 'string' && message.conversation.trim()) {
    return message.conversation.trim()
  }
  const extended = message.extendedTextMessage?.text
  if (extended?.trim()) return extended.trim()

  const caption =
    message.imageMessage?.caption ??
    message.videoMessage?.caption ??
    message.documentMessage?.caption
  if (caption?.trim()) return caption.trim()

  // Button/list/template responses
  if (message.buttonsResponseMessage?.selectedButtonId) {
    return message.buttonsResponseMessage.selectedButtonId
  }
  if (message.listResponseMessage?.singleSelectReply?.selectedRowId) {
    return message.listResponseMessage.singleSelectReply.selectedRowId
  }
  if (message.templateButtonReplyMessage?.selectedId) {
    return message.templateButtonReplyMessage.selectedId
  }

  return undefined
}

/**
 * Extract a media placeholder string for non-text media messages.
 */
export function extractWhatsAppMediaPlaceholder(
  rawMessage: WAMessage | undefined | null,
): string | undefined {
  const message = unwrapMessage(rawMessage)
  if (!message) return undefined
  if (message.imageMessage) return '<media:image>'
  if (message.videoMessage) return '<media:video>'
  if (message.audioMessage) return '<media:audio>'
  if (message.documentMessage) return '<media:document>'
  if (message.stickerMessage) return '<media:sticker>'
  return undefined
}

/**
 * Resolve the message kind discriminant.
 */
export function resolveWhatsAppMessageKind(
  rawMessage: WAMessage | undefined | null,
): WhatsAppMessageKind {
  const message = unwrapMessage(rawMessage)
  if (!message) return 'unknown'
  if (message.conversation != null || message.extendedTextMessage != null) return 'text'
  if (message.imageMessage) return 'image'
  if (message.videoMessage) return 'video'
  if (message.audioMessage) return 'audio'
  if (message.documentMessage) return 'document'
  if (message.stickerMessage) return 'sticker'
  if (message.locationMessage || message.liveLocationMessage) return 'location'
  if (message.contactMessage) return 'contact'
  if (message.contactsArrayMessage) return 'contacts'
  if (message.buttonsResponseMessage) return 'button-response'
  if (message.listResponseMessage) return 'list-response'
  if (message.templateButtonReplyMessage) return 'template-button-reply'
  if (message.interactiveResponseMessage) return 'interactive-response'
  return 'unknown'
}

/**
 * Extract context info (quoted message, mentioned JIDs, stanza ID) from a message.
 */
export function extractWhatsAppContextInfo(
  rawMessage: WAMessage | undefined | null,
): WAContextInfo | undefined {
  const message = unwrapMessage(rawMessage)
  if (!message) return undefined

  const candidates: Array<WAContextInfo | null | undefined> = [
    message.extendedTextMessage?.contextInfo,
    message.imageMessage?.contextInfo,
    message.videoMessage?.contextInfo,
    message.audioMessage?.contextInfo,
    message.documentMessage?.contextInfo,
    message.stickerMessage?.contextInfo,
    message.buttonsResponseMessage?.contextInfo,
    message.listResponseMessage?.contextInfo,
    message.templateButtonReplyMessage?.contextInfo,
    message.interactiveResponseMessage?.contextInfo,
  ]

  for (const candidate of candidates) {
    if (candidate) return candidate
  }
  return undefined
}

/**
 * Extract mentioned JIDs from a message.
 */
export function extractWhatsAppMentionedJids(
  rawMessage: WAMessage | undefined | null,
): string[] | undefined {
  const contextInfo = extractWhatsAppContextInfo(rawMessage)
  const jids = contextInfo?.mentionedJid ?? []
  const filtered = jids.filter(Boolean)
  return filtered.length > 0 ? Array.from(new Set(filtered)) : undefined
}

/**
 * Extract location data from a WhatsApp message.
 */
export function extractWhatsAppLocationData(
  rawMessage: WAMessage | undefined | null,
): NormalizedLocation | null {
  const message = unwrapMessage(rawMessage)
  if (!message) return null

  const live = message.liveLocationMessage
  if (live) {
    const lat = live.degreesLatitude
    const lng = live.degreesLongitude
    if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
      return {
        latitude: lat,
        longitude: lng,
        accuracy: live.accuracyInMeters ?? undefined,
        caption: live.caption ?? undefined,
        source: 'live',
        isLive: true,
      }
    }
  }

  const location = message.locationMessage
  if (location) {
    const lat = location.degreesLatitude
    const lng = location.degreesLongitude
    if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
      const isLive = Boolean(location.isLive)
      return {
        latitude: lat,
        longitude: lng,
        accuracy: location.accuracyInMeters ?? undefined,
        name: location.name ?? undefined,
        address: location.address ?? undefined,
        caption: location.comment ?? undefined,
        source: isLive ? 'live' : location.name || location.address ? 'place' : 'pin',
        isLive,
      }
    }
  }

  return null
}

/**
 * Full extraction: text, kind, media placeholder, context info, mentioned JIDs.
 */
export function extractWhatsAppMessageContent(
  rawMessage: WAMessage | undefined | null,
): WhatsAppExtractedMessage {
  return {
    text: extractWhatsAppText(rawMessage),
    kind: resolveWhatsAppMessageKind(rawMessage),
    mediaPlaceholder: extractWhatsAppMediaPlaceholder(rawMessage),
    contextInfo: extractWhatsAppContextInfo(rawMessage),
    mentionedJids: extractWhatsAppMentionedJids(rawMessage),
  }
}

/**
 * Returns true if the message carries user-visible inbound content.
 * Returns false for protocol/receipt/typing notifications.
 */
export function hasInboundUserContent(rawMessage: WAMessage | undefined | null): boolean {
  if (!rawMessage) return false
  if (extractWhatsAppText(rawMessage)) return true
  if (extractWhatsAppMediaPlaceholder(rawMessage)) return true
  if (extractWhatsAppLocationData(rawMessage)) return true
  const message = unwrapMessage(rawMessage)
  if (!message) return false
  return Boolean(
    message.buttonsResponseMessage ||
    message.listResponseMessage ||
    message.templateButtonReplyMessage ||
    message.interactiveResponseMessage,
  )
}
