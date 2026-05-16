import { describe, expect, it } from 'bun:test'
import {
  buildTelegramSessionKey,
  loadTelegramChannelConfig,
  resolveTelegramGroupPromptSettings,
  resolveTelegramTurnContext,
} from './telegramChannel.js'
import type { TelegramUpdate } from './telegram.js'

describe('telegram channel config', () => {
  it('loads account and group config from environment JSON', () => {
    const config = loadTelegramChannelConfig({
      TELEGRAM_ACCOUNT_ID: 'Ops Main',
      TELEGRAM_SYSTEM_PROMPT: 'Global prompt',
      TELEGRAM_GROUPS_JSON: JSON.stringify({
        '-100': {
          systemPrompt: 'Group prompt',
          topics: {
            '42': {
              agentId: 'support',
              systemPrompt: 'Topic prompt',
            },
          },
        },
      }),
    })

    expect(config.accountId).toBe('ops-main')
    expect(config.groups['-100']?.topics?.['42']?.agentId).toBe('support')
  })

  it('combines global, group, and topic prompts in order', () => {
    const settings = resolveTelegramGroupPromptSettings({
      globalSystemPrompt: 'Global prompt',
      groupConfig: { systemPrompt: 'Group prompt' },
      topicConfig: { systemPrompt: 'Topic prompt' },
    })

    expect(settings.groupSystemPrompt).toBe('Global prompt\n\nGroup prompt\n\nTopic prompt')
  })

  it('builds stable session keys per account, agent, group, and topic', () => {
    expect(buildTelegramSessionKey({
      accountId: 'main',
      agentId: 'support',
      chatId: '-100',
      isGroup: true,
      threadId: '42',
    })).toBe('telegram:main:support:group:-100:topic:42')
  })

  it('resolves topic agent and prompt settings from Telegram updates', () => {
    const update: TelegramUpdate = {
      update_id: 1,
      message: {
        message_id: 10,
        message_thread_id: 42,
        date: 1,
        text: 'halo',
        chat: {
          id: -100,
          type: 'supergroup',
        },
        from: {
          id: 99,
          is_bot: false,
          first_name: 'Rani',
        },
      },
    }

    const turn = resolveTelegramTurnContext({
      update,
      config: {
        accountId: 'main',
        groups: {
          '-100': {
            systemPrompt: 'Group prompt',
            topics: {
              '42': {
                agentId: 'support',
                systemPrompt: 'Topic prompt',
              },
            },
          },
        },
      },
    })

    expect(turn?.allowed).toBe(true)
    expect(turn?.agentId).toBe('support')
    expect(turn?.sessionKey).toBe('telegram:main:support:group:-100:topic:42')
    expect(turn?.promptSettings.groupSystemPrompt).toBe('Group prompt\n\nTopic prompt')
  })
})
