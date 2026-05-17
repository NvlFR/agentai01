// Adapted using referensi/openclaw/extensions/whatsapp/src/send.ts
import type { AnyMessageContent } from 'baileys'
import { getRegisteredWhatsAppConnectionController } from './connection-controller.js'
import { isWhatsAppNewsletterJid } from './normalize-target.js'

export type SendWhatsAppTextParams = {
  accountId: string
  to: string
  text: string
  convertMarkdown?: boolean
}

export type SendWhatsAppMediaParams = {
  accountId: string
  to: string
  media: Buffer | string
  mimetype: string
  caption?: string
}

export type SendWhatsAppReactionParams = {
  accountId: string
  to: string
  messageId: string
  emoji: string
}

type ConnectionControllerResolver = typeof getRegisteredWhatsAppConnectionController

type SendOptions = {
  getController?: ConnectionControllerResolver
}

export async function sendWhatsAppText(
  params: SendWhatsAppTextParams,
  options: SendOptions = {},
): Promise<{ messageId: string; jid: string }> {
  const controller =
    (options.getController ?? getRegisteredWhatsAppConnectionController)(params.accountId)
  const active = controller?.getActiveListener()
  if (!active) {
    throw new Error(`No active WhatsApp connection for account: ${params.accountId}`)
  }

  let text = params.text
  if (params.convertMarkdown) {
    text = convertMarkdownTables(text)
    text = markdownToWhatsApp(text)
  }

  const jid = ensureWhatsAppJid(params.to)
  
  // Skip typing for newsletters
  if (!isWhatsAppNewsletterJid(jid)) {
    await active.sock.sendPresenceUpdate('composing', jid)
  }

  const result = await active.sock.sendMessage(jid, { text })
  if (!result) {
    throw new Error('Failed to send WhatsApp message')
  }

  return { messageId: result.key.id || 'unknown', jid }
}

export async function sendWhatsAppMedia(
  params: SendWhatsAppMediaParams,
  options: SendOptions = {},
): Promise<{ messageId: string; jid: string }> {
  const controller =
    (options.getController ?? getRegisteredWhatsAppConnectionController)(params.accountId)
  const active = controller?.getActiveListener()
  if (!active) {
    throw new Error(`No active WhatsApp connection for account: ${params.accountId}`)
  }

  const jid = ensureWhatsAppJid(params.to)
  let content: AnyMessageContent

  const mediaData = typeof params.media === 'string' ? { url: params.media } : params.media

  if (params.mimetype.startsWith('image/')) {
    content = { image: mediaData, caption: params.caption }
  } else if (params.mimetype.startsWith('video/')) {
    content = { video: mediaData, caption: params.caption }
  } else if (params.mimetype.startsWith('audio/')) {
    content = { audio: mediaData }
  } else {
    content = { document: mediaData, caption: params.caption, mimetype: params.mimetype }
  }

  const result = await active.sock.sendMessage(jid, content)
  if (!result) {
    throw new Error('Failed to send WhatsApp media')
  }

  return { messageId: result.key.id || 'unknown', jid }
}

export async function sendWhatsAppReaction(
  params: SendWhatsAppReactionParams,
  options: SendOptions = {},
): Promise<void> {
  const controller =
    (options.getController ?? getRegisteredWhatsAppConnectionController)(params.accountId)
  const active = controller?.getActiveListener()
  if (!active) {
    throw new Error(`No active WhatsApp connection for account: ${params.accountId}`)
  }

  const jid = ensureWhatsAppJid(params.to)
  await active.sock.sendMessage(jid, {
    react: {
      text: params.emoji,
      key: {
        remoteJid: jid,
        id: params.messageId,
        fromMe: false, // We usually react to others' messages
      }
    }
  })
}

function ensureWhatsAppJid(to: string): string {
  if (to.includes('@')) return to
  if (to.includes('-')) return `${to}@g.us`
  return `${to}@s.whatsapp.net`
}

function convertMarkdownTables(text: string): string {
  // Minimal conversion: strip pipes and ensure alignment might be lost but text is readable
  return text.replace(/^[ \t]*\|(.+)\|[ \t]*$/gm, (match, content) => {
    return content.split('|').map((s: string) => s.trim()).join('  ')
  })
}

function markdownToWhatsApp(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '*$1*') // Bold: **text** -> *text*
    .replace(/__(.*?)__/g, '_$1_')     // Italic: __text__ -> _text_
    .replace(/~~(.*?)~~/g, '~$1~')     // Strike: ~~text~~ -> ~text~
}
