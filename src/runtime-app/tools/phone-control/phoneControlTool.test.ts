import { describe, expect, it } from 'bun:test'
import { PhoneControlError, PhoneControlTool } from './phoneControlTool.js'

describe('PhoneControlTool', () => {
  it('returns screenshot payloads with non-empty data', async () => {
    const tool = new PhoneControlTool({
      enabled: true,
      deviceId: 'device-1',
      driverFactory: async () => ({
        platform: 'android',
        tap: async () => undefined,
        swipe: async () => undefined,
        typeText: async () => undefined,
        screenshot: async () => 'c2NyZWVu',
        launchApp: async () => undefined,
      }),
      now: () => '2026-05-16T00:00:00.000Z',
    })

    const result = await tool.execute({ type: 'screenshot' })

    expect(result.ok).toBe(true)
    expect(result.screenshot?.data).toBe('c2NyZWVu')
    expect(result.audit.deviceId).toBe('device-1')
  })

  it('returns descriptive errors for unavailable devices', async () => {
    const tool = new PhoneControlTool({
      enabled: true,
      deviceId: '',
      driverFactory: async () => {
        throw new Error('should not reach')
      },
    })

    await expect(tool.execute({ type: 'tap', x: 1, y: 2 })).rejects.toMatchObject({
      code: 'device_unavailable',
    })
  })

  it('rejects empty screenshots instead of returning an empty response', async () => {
    const tool = new PhoneControlTool({
      enabled: true,
      deviceId: 'device-1',
      driverFactory: async () => ({
        platform: 'ios',
        tap: async () => undefined,
        swipe: async () => undefined,
        typeText: async () => undefined,
        screenshot: async () => '',
        launchApp: async () => undefined,
      }),
    })

    await expect(tool.execute({ type: 'screenshot' })).rejects.toMatchObject({
      code: 'invalid_action',
    })
  })
})
