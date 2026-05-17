import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

type WebPushModule = {
  setVapidDetails: (subject: string, publicKey: string, privateKey: string) => void
  sendNotification: (subscription: WebPushSubscription, payload: string) => Promise<unknown>
}

export type WebPushSubscription = {
  endpoint: string
  keys: {
    auth: string
    p256dh: string
  }
}

export type WebPushClient = {
  sendNotification: (subscription: WebPushSubscription, payload: string) => Promise<unknown>
}

export function createWebPushAdapter(input: {
  subject?: string
  publicKey?: string
  privateKey?: string
  client?: WebPushClient
}): {
  enabled: boolean
  notify: (subscription: WebPushSubscription, payload: string) => Promise<void>
} {
  const webpush = require('web-push') as WebPushModule
  const configured = Boolean(input.subject && input.publicKey && input.privateKey)
  if (configured) {
    webpush.setVapidDetails(input.subject!, input.publicKey!, input.privateKey!)
  }
  const sdk = input.client ?? (configured ? webpush : undefined)

  return {
    enabled: sdk !== undefined,
    async notify(subscription, payload) {
      if (!sdk) {
        throw new Error('Web push integration is not configured')
      }

      await sdk.sendNotification(subscription, payload)
    },
  }
}
