// Adapted using referensi/openclaw/extensions/whatsapp/src/auto-reply/monitor-state.ts
export type WhatsAppMonitorState = {
  start(): void
  stop(): void
  isRunning(): boolean
  waitForStop(): Promise<void>
}

/**
 * Creates a state object for the WhatsApp monitor loop.
 * Handles start/stop transitions and provides a wait mechanism for cleanup.
 */
export function createWhatsAppMonitorState(): WhatsAppMonitorState {
  let running = false
  let stopPromise: Promise<void> | null = null
  let resolveStop: (() => void) | null = null

  return {
    start() {
      if (running) {
        throw new Error('WhatsApp monitor already running')
      }
      running = true
      stopPromise = new Promise((resolve) => {
        resolveStop = resolve
      })
    },

    stop() {
      if (!running) {
        return
      }
      running = false
      if (resolveStop) {
        resolveStop()
        resolveStop = null
      }
    },

    isRunning() {
      return running
    },

    waitForStop() {
      return stopPromise ?? Promise.resolve()
    },
  }
}
