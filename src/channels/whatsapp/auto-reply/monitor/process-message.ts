// Adapted using referensi/openclaw/extensions/whatsapp/src/auto-reply/monitor/process-message.ts
import type { proto } from 'baileys'

export type ProcessWhatsAppMessageParams = {
  accountId: string
  message: proto.IWebMessageInfo
  processedIds: Set<string>
  onMessage: (inbound: WhatsAppInboundMessage) => Promise<void>
}

export type WhatsAppInboundMessage = {
  accountId: string
  messageId: string
  chatId: string
  from: string
  body: string
  timestamp: number
  isGroup: boolean
  isNewsletter: boolean
  raw: proto.IWebMessageInfo
}

/**
 * Processes an inbound WhatsApp message, handles deduplication, and extracts normalized content.
 */
export async function processWhatsAppMessage(params: ProcessWhatsAppMessageParams): Promise<void> {
  const { message, processedIds, accountId, onMessage } = params
  const id = message.key?.id
  
  if (!id || processedIds.has(id)) {
    return
  }

  // Add to deduplication set
  processedIds.add(id)

  const chatId = message.key?.remoteJid
  if (!chatId) return

  const isGroup = chatId.endsWith('@g.us')
  const isNewsletter = chatId.endsWith('@newsletter')
  const from = message.key?.participant || message.key?.remoteJid || 'unknown'
  
  const rawTimestamp = message.messageTimestamp
  const timestamp = typeof rawTimestamp === 'number' 
    ? rawTimestamp * 1000 
    : (rawTimestamp as any)?.toNumber ? (rawTimestamp as any).toNumber() * 1000 : Date.now()

  const body = extractMessageText(message.message)
  if (!body && !message.message?.imageMessage && !message.message?.videoMessage) {
    // Skip empty/unsupported messages unless they have media we might want later
    return
  }

  const inbound: WhatsAppInboundMessage = {
    accountId,
    messageId: id,
    chatId,
    from,
    body: body || '',
    timestamp,
    isGroup,
    isNewsletter,
    raw: message
  }

  await onMessage(inbound)
}

function extractMessageText(message: proto.IMessage | null | undefined): string | null {
  if (!message) return null

  return (
    message.conversation ||
    message.extendedTextMessage?.text ||
    message.imageMessage?.caption ||
    message.videoMessage?.caption ||
    message.templateButtonReplyMessage?.selectedId ||
    message.buttonsResponseMessage?.selectedButtonId ||
    message.listResponseMessage?.singleSelectReply?.selectedRowId ||
    null
  )
}
