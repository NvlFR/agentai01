import { describe, expect, it } from 'bun:test'
import { createSettingsSyncService } from './settingsSyncService.js'

describe('createSettingsSyncService', () => {
  it('merges remote overrides into local settings', async () => {
    let persisted: { theme: string; locale: string } | null = null
    const service = createSettingsSyncService({
      readLocal: () => ({ theme: 'light', locale: 'id' }),
      readRemote: async () => ({ locale: 'en' }),
      writeLocal: async next => { persisted = next },
    })

    await expect(service.sync()).resolves.toEqual({ theme: 'light', locale: 'en' })
    expect(persisted).toEqual({ theme: 'light', locale: 'en' })
  })
})
