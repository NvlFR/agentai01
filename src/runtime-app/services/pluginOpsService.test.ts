import { describe, expect, it } from 'bun:test'
import { PluginRegistry } from '../../plugins/index.js'
import { createPluginOpsService } from './pluginOpsService.js'

describe('createPluginOpsService', () => {
  it('lists and activates registered plugins', async () => {
    const registry = new PluginRegistry()
    registry.register({ id: 'demo', name: 'Demo', version: '1.0.0', kind: 'channel' }, async () => ({
      kind: 'channel',
      id: 'demo',
      meta: { id: 'demo', name: 'demo', description: 'demo channel' },
      config: {
        listAccountIds: () => [],
        resolveAccount: () => ({}),
      },
      async send() {
        return
      },
    }))
    const service = createPluginOpsService(registry)

    expect(service.listInstalled()).toEqual(['demo'])
    const activated = await service.activate('demo')
    expect(activated.ok).toBe(true)
  })
})
