import { WebClient } from '@slack/web-api'

export type SlackClient = {
  chat: {
    postMessage: (input: { channel: string; text: string }) => Promise<unknown>
  }
}

export function createSlackAdapter(token: string | undefined, client?: SlackClient): {
  enabled: boolean
  postMessage: (
    channel: string,
    text: string,
  ) => Promise<{ channel: string; ts: string; text: string }>
} {
  const sdk = client ?? (token ? new WebClient(token) : undefined)

  return {
    enabled: sdk !== undefined,
    async postMessage(channel, text) {
      if (!sdk) {
        throw new Error('Slack integration is not configured')
      }

      const response = await sdk.chat.postMessage({ channel, text })
      return {
        channel,
        ts: readString(response, 'ts'),
        text,
      }
    },
  }
}

function readString(record: unknown, key: string, fallback = ''): string {
  if (record !== null && typeof record === 'object') {
    const value = (record as Record<string, unknown>)[key]
    if (typeof value === 'string') {
      return value
    }
  }
  return fallback
}
