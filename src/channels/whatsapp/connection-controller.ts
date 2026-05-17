// Adapted using referensi/openclaw/extensions/whatsapp/src/connection-controller.ts
import { EventEmitter } from 'node:events'
import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } from 'baileys'
import type { WASocket, ConnectionState } from 'baileys'
import { join } from 'node:path'

import { resolveReconnectPolicy, computeBackoff, sleepWithAbort, type ReconnectPolicy } from './reconnect.js'
import { resolveWebCredsPath, enqueueCredsSave, restoreCredsFromBackupIfNeeded } from './auth-store.js'

export type WhatsAppConnectionControllerEvents = {
  'connection-update': (update: Partial<ConnectionState>) => void
  'max-attempts-reached': (accountId: string) => void
  'closed': (reason?: any) => void
}

export type WhatsAppConnectionController = {
  connect(): Promise<void>
  disconnect(): Promise<void>
  getActiveListener(): { sock: WASocket } | null
  on<K extends keyof WhatsAppConnectionControllerEvents>(
    event: K,
    listener: WhatsAppConnectionControllerEvents[K]
  ): void
}

export type WhatsAppConnectionControllerParams = {
  accountId: string
  stateRoot?: string
  reconnectPolicy?: Partial<ReconnectPolicy>
}

class WhatsAppConnectionControllerImpl extends EventEmitter implements WhatsAppConnectionController {
  private sock: WASocket | null = null
  private reconnectAttempts = 0
  private isConnecting = false
  private shouldReconnect = true
  private abortController = new AbortController()

  constructor(private params: WhatsAppConnectionControllerParams) {
    super()
  }

  async connect(): Promise<void> {
    if (this.isConnecting) return
    this.isConnecting = true
    this.shouldReconnect = true
    this.reconnectAttempts = 0
    this.abortController = new AbortController()

    await this.connectionLoop()
  }

  private async connectionLoop(): Promise<void> {
    const policy = resolveReconnectPolicy({}, this.params.reconnectPolicy)

    while (this.shouldReconnect) {
      try {
        await this.tryConnect()
        // If tryConnect resolves, it means it closed cleanly or we are in a state where we should wait
      } catch (error: any) {
        if (!this.shouldReconnect) break

        this.reconnectAttempts++
        if (policy.maxAttempts > 0 && this.reconnectAttempts >= policy.maxAttempts) {
          this.emit('max-attempts-reached', this.params.accountId)
          this.shouldReconnect = false
          break
        }

        const delay = computeBackoff(policy, this.reconnectAttempts - 1)
        try {
          await sleepWithAbort(delay, this.abortController.signal)
        } catch {
          break
        }
      }
    }
    this.isConnecting = false
  }

  private async tryConnect(): Promise<void> {
    const authDir = join(this.params.stateRoot ?? '.agentai-state', 'whatsapp', `auth-${this.params.accountId}`)
    await restoreCredsFromBackupIfNeeded(this.params.accountId, { stateRoot: this.params.stateRoot })
    
    const { state, saveCreds } = await useMultiFileAuthState(authDir)
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
      auth: state,
      version,
      printQRInTerminal: false,
      generateHighQualityLinkPreview: true,
    })

    this.sock = sock

    return new Promise((resolve, reject) => {
      sock.ev.on('creds.update', () => {
        enqueueCredsSave(this.params.accountId, state.creds, { stateRoot: this.params.stateRoot })
          .catch(() => {}) // non-fatal
      })

      sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        this.emit('connection-update', update)

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode || (lastDisconnect?.error as any)?.statusCode
          const shouldRetry = statusCode !== DisconnectReason.loggedOut
          
          this.sock = null
          if (shouldRetry && this.shouldReconnect) {
            reject(lastDisconnect?.error || new Error('Connection closed'))
          } else {
            this.shouldReconnect = false
            resolve()
          }
        } else if (connection === 'open') {
          this.reconnectAttempts = 0
        }
      })
    })
  }

  async disconnect(): Promise<void> {
    this.shouldReconnect = false
    this.abortController.abort()
    if (this.sock) {
      this.sock.end(undefined)
      this.sock = null
    }
  }

  getActiveListener(): { sock: WASocket } | null {
    return this.sock ? { sock: this.sock } : null
  }
}

export function createWhatsAppConnectionController(params: WhatsAppConnectionControllerParams): WhatsAppConnectionController {
  return new WhatsAppConnectionControllerImpl(params)
}

// Registry
const REGISTRY = new Map<string, WhatsAppConnectionController>()

export function registerWhatsAppConnectionController(accountId: string, controller: WhatsAppConnectionController): void {
  REGISTRY.set(accountId, controller)
}

export function getRegisteredWhatsAppConnectionController(accountId: string): WhatsAppConnectionController | null {
  return REGISTRY.get(accountId) ?? null
}

export function unregisterWhatsAppConnectionController(accountId: string): void {
  REGISTRY.delete(accountId)
}
