import { describe, it, expect, mock } from 'bun:test'
import type { WASocket } from 'baileys'
import { sendWhatsAppText, sendWhatsAppMedia, sendWhatsAppReaction } from './send.js'
import type { WhatsAppConnectionController } from './connection-controller.js'

const mockSock = {
  sendPresenceUpdate: mock(
    async (_presence: string, _jid: string): Promise<void> => undefined,
  ),
  sendMessage: mock(
    async (_jid: string, _content: Record<string, unknown>) =>
      ({ key: { id: 'msg-123' } }),
  ),
}

const getController = (_accountId: string): WhatsAppConnectionController => ({
  connect: async () => undefined,
  disconnect: async () => undefined,
  getActiveListener: () => ({ sock: mockSock as unknown as WASocket }),
  on: () => undefined,
})

describe('WhatsApp Send', () => {
  const accountId = 'test-account'
  const to = '1234567890'

  it('sends text message', async () => {
    const result = await sendWhatsAppText({ accountId, to, text: 'Hello' }, { getController })
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
    }, { getController })
    
    // Check the last call to sendMessage
    const lastContent = getLastSentContent()
    expect(lastContent['text']).toBe('*Bold* and _Italic_')
  })

  it('sends media message', async () => {
    await sendWhatsAppMedia({ 
      accountId, 
      to, 
      media: Buffer.from('fake-image'), 
      mimetype: 'image/jpeg',
      caption: 'Nice image'
    }, { getController })
    
    const lastContent = getLastSentContent()
    expect(lastContent['image']).toBeDefined()
    expect(lastContent['caption']).toBe('Nice image')
  })

  it('sends reaction', async () => {
    await sendWhatsAppReaction(
      { accountId, to, messageId: 'msg-123', emoji: '👍' },
      { getController },
    )
    
    const react = getLastSentContent()['react']
    expect(typeof react).toBe('object')
    expect(react).not.toBeNull()
    if (typeof react !== 'object' || react === null) {
      return
    }

    const reactRecord = react as Record<string, unknown>
    const reactKey = reactRecord['key']
    expect(reactRecord['text']).toBe('👍')
    expect(typeof reactKey).toBe('object')
    expect(reactKey).not.toBeNull()
    if (typeof reactKey !== 'object' || reactKey === null) {
      return
    }

    expect((reactKey as Record<string, unknown>)['id']).toBe('msg-123')
  })
})

function getLastSentContent(): Record<string, unknown> {
  const lastCall = mockSock.sendMessage.mock.calls.at(-1)
  expect(lastCall).toBeDefined()
  if (!lastCall) {
    throw new Error('Expected sendMessage to be called at least once.')
  }

  return lastCall[1] as Record<string, unknown>
}
