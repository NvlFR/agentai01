import { describe, it, expect, mock } from 'bun:test'
import { processWhatsAppMessage } from './process-message.js'

describe('WhatsApp Process Message', () => {
  const accountId = 'test-account'

  it('extracts text from a standard message', async () => {
    const processedIds = new Set<string>()
    const onMessage = mock(async () => {}) as any
    
    const message = {
      key: { id: 'msg-1', remoteJid: '123@s.whatsapp.net' },
      message: { conversation: 'Hello' },
      messageTimestamp: 1700000000
    }

    await processWhatsAppMessage({
      accountId,
      message: message as any,
      processedIds,
      onMessage
    })

    expect(onMessage).toHaveBeenCalled()
    const inbound = onMessage.mock.calls[0][0]
    expect(inbound.body).toBe('Hello')
    expect(inbound.messageId).toBe('msg-1')
    expect(processedIds.has('msg-1')).toBe(true)
  })

  it('deduplicates messages', async () => {
    const processedIds = new Set<string>(['msg-1'])
    const onMessage = mock(async () => {}) as any
    
    const message = {
      key: { id: 'msg-1', remoteJid: '123@s.whatsapp.net' },
      message: { conversation: 'Hello' }
    }

    await processWhatsAppMessage({
      accountId,
      message: message as any,
      processedIds,
      onMessage
    })

    expect(onMessage).not.toHaveBeenCalled()
  })

  it('extracts caption from image message', async () => {
    const processedIds = new Set<string>()
    const onMessage = mock(async () => {}) as any
    
    const message = {
      key: { id: 'msg-img', remoteJid: '123@s.whatsapp.net' },
      message: { imageMessage: { caption: 'Cool photo' } }
    }

    await processWhatsAppMessage({
      accountId,
      message: message as any,
      processedIds,
      onMessage
    })

    expect(onMessage.mock.calls[0][0].body).toBe('Cool photo')
  })
})
