import { describe, expect, it, mock } from 'bun:test'
import { createChatChannelPlugin, createChannelPluginBase } from './channel-core.js'
import type { ChannelPlugin } from './types.js'

describe('channel-core', () => {
  describe('createChannelPluginBase', () => {
    it('should create a base plugin with required fields', () => {
      const plugin = createChannelPluginBase({
        id: 'test-channel',
        config: {
          listAccountIds: () => ['acc1'],
          resolveAccount: () => ({ accountId: 'acc1' }),
        },
      })

      expect(plugin.id).toBe('test-channel')
      expect(plugin.kind).toBe('channel')
      expect(plugin.meta.name).toBe('test-channel')
    })

    it('should override meta if provided', () => {
      const plugin = createChannelPluginBase({
        id: 'test-channel',
        meta: { name: 'Custom Name', description: 'Custom Desc' },
        config: {
          listAccountIds: () => [],
          resolveAccount: () => ({}),
        },
      })

      expect(plugin.meta.name).toBe('Custom Name')
      expect(plugin.meta.description).toBe('Custom Desc')
    })
  })

  describe('createChatChannelPlugin', () => {
    const basePlugin: Omit<ChannelPlugin<any>, 'security' | 'pairing' | 'threading' | 'outbound'> = {
      kind: 'channel',
      id: 'chat-channel',
      meta: { id: 'chat-channel', name: 'Chat', description: 'Chat Channel' },
      config: {
        listAccountIds: () => ['acc1'],
        resolveAccount: () => ({ accountId: 'acc1' }),
      },
      send: async () => {},
    }

    it('should merge security.dm shorthand', () => {
      const plugin = createChatChannelPlugin({
        base: basePlugin,
        security: {
          dm: {
            channelKey: 'test',
            resolvePolicy: () => 'allow',
            resolveAllowFrom: () => ['user1'],
          },
        },
      })

      expect(plugin.security).toBeDefined()
      const policy = plugin.security?.resolveDmPolicy?.({
        cfg: { channels: { test: { accounts: { default: { dmPolicy: 'allow', allowFrom: ['user1'] } } } } },
        accountId: 'default',
        account: { accountId: 'acc1' },
      })
      expect(policy?.policy).toBe('allow')
      expect(policy?.allowFrom).toEqual(['user1'])
    })

    it('should merge pairing.text shorthand', async () => {
      let notified = false
      const plugin = createChatChannelPlugin({
        base: basePlugin,
        pairing: {
          text: {
            idLabel: 'Code',
            message: 'Your code is {code}',
            notify: () => { notified = true },
          },
        },
      })

      expect(plugin.pairing?.idLabel).toBe('Code')
      await plugin.pairing?.notifyApproval?.({ accountId: 'acc1', targetId: 'user1' })
      expect(notified).toBe(true)
    })

    it('should merge threading.topLevelReplyToMode shorthand', () => {
      const plugin = createChatChannelPlugin({
        base: basePlugin,
        threading: {
          topLevelReplyToMode: 'test-channel',
        },
      })

      const mode = plugin.threading?.resolveReplyToMode?.({
        cfg: { channels: { 'test-channel': { replyToMode: 'thread' } } },
      })
      expect(mode).toBe('thread')
    })

    it('should merge outbound.attachedResults shorthand', async () => {
      const sendText = mock(() => Promise.resolve({ success: true, messageId: '123' }))
      const plugin = createChatChannelPlugin({
        base: basePlugin,
        outbound: {
          base: {},
          attachedResults: {
            channel: 'test-attached',
            sendText,
          },
        },
      })

      const result = await plugin.outbound?.sendText?.({ to: 'user1', text: 'hi' })
      expect(result?.channel).toBe('test-attached')
      expect(result?.messageId).toBe('123')
      expect(sendText).toHaveBeenCalled()
    })

    it('should default supportsCurrentConversationBinding to true', () => {
      const plugin = createChatChannelPlugin({ base: basePlugin })
      expect(plugin.conversationBindings?.supportsCurrentConversationBinding).toBe(true)
    })
  })
})
