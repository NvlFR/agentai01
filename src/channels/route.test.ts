import { describe, expect, it } from 'bun:test'
import { routeInboundMessage } from './route.js'
import type { ChannelAdapter, ChannelMessage, InboundRouteDecision } from './types.js'
import { ok, err } from '../shared/index.js'

describe('src/channels/route.ts', () => {
  const mockAdapter: ChannelAdapter = {
    id: 'test-adapter',
    kind: 'custom',
    normalize: (input: any) => {
      if (input.fail) return err(['failed to normalize'])
      return ok({ id: input.id, text: input.text } as ChannelMessage)
    },
    authenticate: () => ok({ id: 'op' }),
    health: () => ({ channelId: 'test', status: 'healthy', checkedAt: '' })
  }

  it('routes valid normalized messages', async () => {
    const input = { id: 'msg-1', text: 'hello' }
    const hook = (msg: ChannelMessage): InboundRouteDecision => ({ route: 'accept', message: msg })
    
    const result = await routeInboundMessage(mockAdapter, input, hook)
    expect(result.route).toBe('accept')
    if (result.route === 'accept') {
      expect(result.message.id).toBe('msg-1')
    }
  })

  it('rejects when normalization fails', async () => {
    const input = { fail: true }
    const hook = (): InboundRouteDecision => ({ route: 'accept', message: {} as any })
    
    const result = await routeInboundMessage(mockAdapter, input, hook)
    expect(result).toEqual({ route: 'reject', reason: 'failed to normalize' })
  })
})
