import { describe, expect, it } from 'bun:test'
import { createChannelHealth } from './health.js'

describe('src/channels/health.ts', () => {
  it('creates a health record with correct status and time', () => {
    const now = () => new Date('2026-05-16T12:00:00Z')
    const health = createChannelHealth('telegram', 'healthy', 'All systems go', now)
    
    expect(health).toEqual({
      channelId: 'telegram',
      status: 'healthy',
      detail: 'All systems go',
      checkedAt: '2026-05-16T12:00:00.000Z'
    })
  })

  it('uses current time if now is not provided', () => {
    const health = createChannelHealth('whatsapp', 'degraded')
    expect(health.checkedAt).toBeDefined()
    expect(new Date(health.checkedAt).getTime()).toBeLessThanOrEqual(Date.now())
  })
})
