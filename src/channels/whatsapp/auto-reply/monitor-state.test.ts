import { describe, it, expect } from 'bun:test'
import { createWhatsAppMonitorState } from './monitor-state.js'

describe('WhatsApp Monitor State', () => {
  it('starts and stops correctly', async () => {
    const state = createWhatsAppMonitorState()
    expect(state.isRunning()).toBe(false)
    
    state.start()
    expect(state.isRunning()).toBe(true)
    
    state.stop()
    expect(state.isRunning()).toBe(false)
  })

  it('throws on double start', () => {
    const state = createWhatsAppMonitorState()
    state.start()
    expect(() => state.start()).toThrow('WhatsApp monitor already running')
  })

  it('waits for stop', async () => {
    const state = createWhatsAppMonitorState()
    state.start()
    
    let stopped = false
    const wait = state.waitForStop().then(() => {
      stopped = true
    })
    
    expect(stopped).toBe(false)
    state.stop()
    await wait
    expect(stopped).toBe(true)
  })
})
