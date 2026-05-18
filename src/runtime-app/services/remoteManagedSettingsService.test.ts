import { describe, expect, it } from 'bun:test'
import { createRemoteManagedSettingsService } from './remoteManagedSettingsService.js'

describe('createRemoteManagedSettingsService', () => {
  it('degrades safely when remote source is unavailable', async () => {
    const service = createRemoteManagedSettingsService({
      fetchRemote: async () => {
        throw new Error('offline')
      },
    })

    await expect(service.load()).resolves.toEqual({ available: false, settings: {} })
  })
})
