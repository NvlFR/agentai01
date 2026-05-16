import { describe, expect, test } from 'bun:test'
import {
  createCachedLazyValueGetter,
  createPluginContext,
  createSubsystemLogger,
  definePluginEntry,
  emptyPluginConfigSchema,
  formatPairingApproveHint,
  generateSecureToken,
  isPluginKind,
  resolveGatewayPort,
} from './index.js'

describe('plugin-sdk index', () => {
  test('re-exports core plugin helpers', () => {
    expect(isPluginKind('provider')).toBe(true)
    expect(isPluginKind('workflow')).toBe(false)
    expect(createPluginContext({ plugin_id: ' demo-plugin ' })).toEqual({ plugin_id: 'demo-plugin' })
  })

  test('re-exports plugin entry helpers', async () => {
    const entry = definePluginEntry({
      id: ' demo-plugin ',
      name: ' Demo Plugin ',
      description: ' Demo description ',
      register() {
        return
      },
    })

    expect(entry.configSchema()).toBe(emptyPluginConfigSchema())
    await entry.register({ registrationMode: 'full' })

    expect(entry.id).toBe('demo-plugin')
    expect(entry.name).toBe('Demo Plugin')
    expect(entry.description).toBe('Demo description')
  })

  test('re-exports runtime utility helpers', () => {
    expect(generateSecureToken(8)).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(createCachedLazyValueGetter(() => 7)()).toBe(7)
    expect(resolveGatewayPort('3010')).toBe(3010)
    expect(formatPairingApproveHint('telegram')).toContain('pairing approve telegram')

    const entries: string[] = []
    const logger = createSubsystemLogger('plugin-sdk', {
      writer(entry) {
        entries.push(JSON.stringify(entry))
      },
    })
    logger.info('ready')
    expect(entries[0]).toContain('"subsystem":"plugin-sdk"')
  })
})
