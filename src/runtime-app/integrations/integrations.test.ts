import { describe, expect, it } from 'bun:test'
import { createStripeAdapter } from './billing/stripeAdapter.js'
import { createEmailAdapter } from './email/emailAdapter.js'
import { createGoogleDriveAdapter } from './google/googleAdapter.js'
import { createGitHubAdapter } from './github/githubAdapter.js'
import { createInMemoryMcpPingPair } from './mcp/mcpAdapter.js'
import { createNotionAdapter } from './notion/notionAdapter.js'
import { createWebPushAdapter, type WebPushSubscription } from './push/webPushAdapter.js'
import { createSlackAdapter } from './slack/slackAdapter.js'
import { createGoogleGenAiTextAdapter } from '../providers/google-genai/googleGenAiAdapter.js'

describe('external integrations', () => {
  it('shapes GitHub repository requests through the Octokit adapter', async () => {
    const adapter = createGitHubAdapter(undefined, {
      request: async () => ({ data: { full_name: 'owner/repo' } }),
    })

    await expect(adapter.getRepository('owner', 'repo')).resolves.toEqual({
      full_name: 'owner/repo',
    })
  })

  it('posts Slack messages through the Slack adapter', async () => {
    let sent = ''
    const adapter = createSlackAdapter(undefined, {
      chat: {
        postMessage: async input => {
          sent = input.text
          return undefined
        },
      },
    })

    await adapter.postMessage('C1', 'hello')
    expect(sent).toBe('hello')
  })

  it('creates Notion pages through the Notion adapter', async () => {
    let created = ''
    const adapter = createNotionAdapter(undefined, {
      pages: {
        create: async input => {
          created = input.properties.title.title[0]?.text.content ?? ''
          return undefined
        },
      },
    })

    await adapter.createPage('page_1', 'Daily summary')
    expect(created).toBe('Daily summary')
  })

  it('reads Google Drive about data through the Google adapter', async () => {
    const adapter = createGoogleDriveAdapter(undefined, {
      get: async () => ({ data: { storageQuota: { limit: '1' } } }),
    })

    await expect(adapter.getAbout()).resolves.toEqual({
      storageQuota: { limit: '1' },
    })
  })

  it('creates Stripe checkout sessions through the billing adapter', async () => {
    const adapter = createStripeAdapter(undefined, {
      checkout: {
        sessions: {
          create: async () => ({ id: 'cs_test_1' }),
        },
      },
    })

    await expect(adapter.createCheckoutSession('owner@example.com')).resolves.toBe('cs_test_1')
  })

  it('sends email through the nodemailer adapter', async () => {
    let subject = ''
    const adapter = createEmailAdapter(undefined, {
      sendMail: async input => {
        subject = String(input.subject)
        return undefined
      },
    })

    await adapter.send('owner@example.com', 'Ready', 'Done')
    expect(subject).toBe('Ready')
  })

  it('sends push payloads through the web-push adapter', async () => {
    let body = ''
    const adapter = createWebPushAdapter({
      client: {
        sendNotification: async (_subscription: WebPushSubscription, payload: string) => {
          body = payload
          return undefined
        },
      },
    })

    await adapter.notify({ endpoint: 'https://example.com', keys: { auth: 'a', p256dh: 'b' } }, '{"ok":true}')
    expect(body).toBe('{"ok":true}')
  })

  it('generates text through the Google GenAI adapter', async () => {
    const adapter = createGoogleGenAiTextAdapter({
      apiKey: undefined,
      model: 'gemini-2.5-flash',
      client: {
        models: {
          generateContent: async () => ({ text: 'hello world' }),
        },
      },
    })

    await expect(adapter.generateText('hi')).resolves.toBe('hello world')
  })

  it('supports in-memory MCP ping without network transport', async () => {
    const pair = await createInMemoryMcpPingPair()
    await expect(pair.ping()).resolves.toBeUndefined()
    await pair.close()
  })
})
