import { describe, expect, test } from 'bun:test'
import {
  defineChannelPluginEntry,
  definePluginEntry,
  defineSetupPluginEntry,
  emptyPluginConfigSchema,
  type PluginRegistrationApi,
} from './plugin-entry.js'
import type { ChannelPlugin } from './types.js'

function createChannelPlugin(id: string): ChannelPlugin {
  return {
    kind: 'channel',
    id,
    meta: { id, name: id, description: `${id} channel` },
    config: {
      listAccountIds() {
        return [id]
      },
      resolveAccount() {
        return { accountId: id }
      },
    },
    async send() {
      return
    },
  }
}

describe('plugin-sdk/plugin-entry', () => {
  test('trims fields and lazily caches config schema', async () => {
    const invocations: string[] = []
    let schemaCalls = 0
    const entry = definePluginEntry({
      id: ' demo-plugin ',
      name: ' Demo Plugin ',
      description: ' Demo description ',
      configSchema() {
        schemaCalls += 1
        return { enabled: true }
      },
      registerCliMetadata() {
        invocations.push('cli')
      },
      registerFull() {
        invocations.push('full')
      },
    })

    expect(schemaCalls).toBe(0)
    expect(entry.configSchema()).toEqual({ enabled: true })
    expect(entry.configSchema()).toEqual({ enabled: true })
    expect(schemaCalls).toBe(1)

    await entry.register({ registrationMode: 'full' })

    expect(entry.id).toBe('demo-plugin')
    expect(entry.name).toBe('Demo Plugin')
    expect(entry.description).toBe('Demo description')
    expect(invocations).toEqual(['cli', 'full'])
  })

  test('routes plugin registration by mode', async () => {
    const cliCalls: string[] = []
    const fullCalls: string[] = []
    const entry = definePluginEntry({
      id: 'mode-plugin',
      name: 'Mode Plugin',
      description: 'Mode test',
      registerCliMetadata(api) {
        cliCalls.push(api.registrationMode)
      },
      registerFull(api) {
        fullCalls.push(api.registrationMode)
      },
    })

    await entry.register({ registrationMode: 'cli-metadata' })
    await entry.register({ registrationMode: 'discovery' })
    await entry.register({ registrationMode: 'full' })

    expect(cliCalls).toEqual(['cli-metadata', 'discovery', 'full'])
    expect(fullCalls).toEqual(['full'])
  })

  test('registers channel capability during full registration', async () => {
    const calls: string[] = []
    const api: PluginRegistrationApi & {
      readonly channels: string[]
      registerChannel(registration: { readonly plugin: ChannelPlugin }): void
    } = {
      registrationMode: 'full',
      channels: [],
      registerChannel(registration) {
        this.channels.push(registration.plugin.id)
        calls.push('channel')
      },
    }

    const entry = defineChannelPluginEntry({
      id: 'support-bot',
      name: 'Support Bot',
      description: 'Support bot channel',
      plugin: createChannelPlugin('support-bot'),
      registerCliMetadata() {
        calls.push('cli')
      },
      registerFull() {
        calls.push('full')
      },
    })

    await entry.register(api)

    expect(api.channels).toEqual(['support-bot'])
    expect(calls).toEqual(['cli', 'channel', 'full'])
  })

  test('skips channel registration outside full mode', async () => {
    const calls: string[] = []
    const entry = defineChannelPluginEntry({
      id: 'discovery-bot',
      name: 'Discovery Bot',
      description: 'Discovery mode channel',
      plugin: createChannelPlugin('discovery-bot'),
      registerCliMetadata(api) {
        calls.push(api.registrationMode)
      },
      registerFull() {
        calls.push('full')
      },
    })

    await entry.register({
      registrationMode: 'cli-metadata',
      registerChannel() {
        calls.push('channel')
      },
    })
    await entry.register({
      registrationMode: 'discovery',
      registerChannel() {
        calls.push('channel')
      },
    })

    expect(calls).toEqual(['cli-metadata', 'discovery'])
  })

  test('uses default empty config schema and setup helper', () => {
    const entry = definePluginEntry({
      id: 'empty-schema',
      name: 'Empty Schema',
      description: 'Uses default schema',
    })
    const setup = defineSetupPluginEntry({ pluginId: 'channel-setup' })

    expect(entry.configSchema()).toBe(emptyPluginConfigSchema())
    expect(setup).toEqual({ plugin: { pluginId: 'channel-setup' } })
  })
})
