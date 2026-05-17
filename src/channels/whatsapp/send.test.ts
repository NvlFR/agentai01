import { describe, it, expect, mock } from 'bun:test'
import { sendWhatsAppText, sendWhatsAppMedia, sendWhatsAppReaction } from './send.js'

// Mock connection controller
const mockSock: any = {
  sendPresenceUpdate: mock(() => Promise.resolve()),
  sendMessage: mock(() => Promise.resolve({ key: { id: 'msg-123' } }))
}

mock.module('./connection-controller.js', () => ({
  getRegisteredWhatsAppConnectionController: () => ({
    getActiveListener: () => ({ sock: mockSock })
  })
}))

describe('WhatsApp Send', () => {
  const accountId = 'test-account'
  const to = '1234567890'

  it('sends text message', async () => {
    const result = await sendWhatsAppText({ accountId, to, text: 'Hello' })
    expect(result.messageId).toBe('msg-123')
    expect(result.jid).toBe('1234567890@s.whatsapp.net')
    expect(mockSock.sendMessage).toHaveBeenCalled()
  })

  it('converts markdown to WhatsApp format', async () => {
    await sendWhatsAppText({ 
      accountId, 
      to, 
      text: '**Bold** and __Italic__', 
      convertMarkdown: true 
    })
    
    // Check the last call to sendMessage
    const lastCall = mockSock.sendMessage.mock.calls[mockSock.sendMessage.mock.calls.length - 1]
    expect(lastCall[1].text).toBe('*Bold* and _Italic_')
  })

  it('sends media message', async () => {
    await sendWhatsAppMedia({ 
      accountId, 
      to, 
      media: Buffer.from('fake-image'), 
      mimetype: 'image/jpeg',
      caption: 'Nice image'
    })
    
    const lastCall = mockSock.sendMessage.mock.calls[mockSock.sendMessage.mock.calls.length - 1]
    expect(lastCall[1].image).toBeDefined()
    expect(lastCall[1].caption).toBe('Nice image')
  })

  it('sends reaction', async () => {
    await sendWhatsAppReaction({ accountId, to, messageId: 'msg-123', emoji: '👍' })
    
    const lastCall = mockSock.sendMessage.mock.calls[mockSock.sendMessage.mock.calls.length - 1]
    expect(lastCall[1].react.text).toBe('👍')
    expect(lastCall[1].react.key.id).toBe('msg-123')
  })
})
