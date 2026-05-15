import { describe, expect, it } from 'bun:test'
import { createLowPriorityExtensionRegistry } from './registry.js'

describe('LowPriorityExtensionRegistry', () => {
  it('keeps high-risk operator tools disabled by default', () => {
    const registry = createLowPriorityExtensionRegistry({
      env: {},
    })

    const openShell = registry.get('openshell')
    const phoneControl = registry.get('phone-control')

    expect(openShell?.enabled).toBe(false)
    expect(openShell?.status).toBe('disabled')
    expect(phoneControl?.enabled).toBe(false)
    expect(phoneControl?.status).toBe('disabled')
  })

  it('marks enabled extensions as misconfigured when required env is missing', () => {
    const registry = createLowPriorityExtensionRegistry({
      env: {
        OPENSHELL_ENABLED: 'true',
      },
    })

    const openShell = registry.get('openshell')

    expect(openShell?.enabled).toBe(true)
    expect(openShell?.status).toBe('misconfigured')
    expect(openShell?.issues).toEqual([
      {
        field: 'OPENSHELL_ALLOWED_DIRS',
        message: 'OPENSHELL_ALLOWED_DIRS is required when the extension is enabled.',
      },
    ])
  })

  it('redacts secret values from exposed extension config', () => {
    const registry = createLowPriorityExtensionRegistry({
      env: {
        ELEVENLABS_API_KEY: 'eleven-secret-key',
        ELEVENLABS_VOICE_ID: 'voice-01',
      },
    })

    const elevenlabs = registry.get('elevenlabs')

    expect(elevenlabs?.status).toBe('enabled')
    expect(elevenlabs?.config).toEqual({
      ELEVENLABS_API_KEY: 'ele***key',
      ELEVENLABS_VOICE_ID: 'voice-01',
    })
  })
})
