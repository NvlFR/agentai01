// Re-exports
export * from './auth-store.js'
export * from './connection-controller.js'
export * from './send.js'
export * from './auto-reply/monitor-state.js'
export * from './auto-reply/monitor/process-message.js'

import { createChatChannelPlugin } from '../../plugin-sdk/channel-core.js'
import type { ChannelPlugin } from '../../plugin-sdk/types.js'
import { sendWhatsAppText, sendWhatsAppMedia } from './send.js'
import { createWhatsAppConnectionController, registerWhatsAppConnectionController, unregisterWhatsAppConnectionController } from './connection-controller.js'

type WhatsAppConfig = {
  readonly channels?: {
    readonly whatsapp?: {
      readonly stateRoot?: string
    }
  }
}

/**
 * Creates the WhatsApp channel plugin for the AgentAI01 runtime.
 */
export function createWhatsAppChannelPlugin(): ChannelPlugin<any, any, any> {
  return createChatChannelPlugin({
    base: ({
      id: 'whatsapp',
      meta: {
        id: 'whatsapp',
        name: 'WhatsApp',
        description: 'WhatsApp channel via Baileys (Web session)',
      },
      setup: (async ({ accountId, cfg }: { accountId: string; cfg: unknown }) => {
        const controller = createWhatsAppConnectionController({
          accountId,
          stateRoot: (cfg as any)?.channels?.whatsapp?.stateRoot,
        })
        registerWhatsAppConnectionController(accountId, controller)
        await controller.connect()
      }) as any,
      reload: (async ({ accountId }: { accountId: string }) => {
        unregisterWhatsAppConnectionController(accountId)
      }) as any,
      config: (async () => ({})) as any,
      capabilities: {
        supportsMedia: true,
        supportsPolls: false,
      },
    }) as any,
    outbound: {
      base: {
        id: 'whatsapp',
        name: 'WhatsApp',
      },
      attachedResults: {
        channel: 'whatsapp',
        sendText: async ({ accountId, to, text }) => {
          const result = await sendWhatsAppText({ 
            accountId: accountId ?? 'default', 
            to, 
            text, 
            convertMarkdown: true 
          })
          return { success: true, messageId: result.messageId }
        },
        sendMedia: async (params: any) => {
          const { accountId, to, media, mimetype, caption } = params
          const result = await sendWhatsAppMedia({ 
            accountId: accountId ?? 'default', 
            to, 
            media: media, 
            mimetype: mimetype ?? 'application/octet-stream', 
            caption: caption 
          })
          return { success: true, messageId: result.messageId }
        },
      },
    },
  }) as any
}

function readWhatsAppStateRoot(cfg: unknown): string | undefined {
  const config = cfg as WhatsAppConfig
  const stateRoot = config.channels?.whatsapp?.stateRoot?.trim()
  return stateRoot ? stateRoot : undefined
}
