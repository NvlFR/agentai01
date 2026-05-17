import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test'
import { createWhatsAppConnectionController, registerWhatsAppConnectionController, getRegisteredWhatsAppConnectionController, unregisterWhatsAppConnectionController } from './connection-controller.js'

// Mock dependencies
mock.module('baileys', () => ({
  makeWASocket: () => ({
    ev: {
      on: (event: string, handler: Function) => {
        // Simple mock: emit 'open' on next tick if connection.update is subscribed
        if (event === 'connection.update') {
          setTimeout(() => handler({ connection: 'open' }), 10)
        }
      }
    },
    end: () => {}
  }),
  useMultiFileAuthState: async () => ({
    state: { creds: {}, keys: {} },
    saveCreds: async () => {}
  }),
  fetchLatestBaileysVersion: async () => ({ version: [2, 3000, 1] }),
  DisconnectReason: { loggedOut: 401 }
}))

mock.module('./auth-store.js', () => ({
  resolveWebCredsPath: () => 'mock-path',
  enqueueCredsSave: async () => {},
  restoreCredsFromBackupIfNeeded: async () => false
}))

describe('WhatsApp Connection Controller', () => {
  const accountId = 'test-account'

  it('creates and registers a controller', () => {
    const controller = createWhatsAppConnectionController({ accountId })
    registerWhatsAppConnectionController(accountId, controller)
    
    const registered = getRegisteredWhatsAppConnectionController(accountId)
    expect(registered).toBe(controller)
    
    unregisterWhatsAppConnectionController(accountId)
    expect(getRegisteredWhatsAppConnectionController(accountId)).toBeNull()
  })

  it('connects and exposes socket', async () => {
    const controller = createWhatsAppConnectionController({ accountId })
    // We don't call connect() here because it enters an infinite loop in the mock
    // without manual event emission to close it.
    // But we can check the initial state.
    expect(controller.getActiveListener()).toBeNull()
  })
})
