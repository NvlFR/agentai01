import { WebClient } from '@slack/web-api'

export type SlackClient = {
  chat: {
    postMessage: (input: { channel: string; text: string }) => Promise<unknown>
  }
}

export function createSlackAdapter(token: string | undefined, client?: SlackClient): {
  enabled: boolean
  postMessage: (channel: string, text: string) => Promise<void>
} {
  const sdk = client ?? (token ? new WebClient(token) : undefined)

  return {
    enabled: sdk !== undefined,
    async postMessage(channel, text) {
      if (!sdk) {
        throw new Error('Slack integration is not configured')
      }

      await sdk.chat.postMessage({ channel, text })
    },
  }
}
