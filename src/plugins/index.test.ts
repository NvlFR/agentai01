import { describe, expect, test } from 'bun:test'
import { PluginRegistry } from './index.js'

describe('plugins', () => {
  test('validates, activates, and deactivates plugin lifecycle entries', async () => {
    const registry = new PluginRegistry()
    const registered = registry.register({
      id: 'echo-tools',
      name: 'Echo Tools',
      version: '1.0.0',
      kind: 'tool',
    }, () => ({
      kind: 'tool',
      tools: [],
      execute: async () => ({ ok: true, value: { output: 'ok' } }),
    }))

    expect(registered.ok).toBe(true)
    const activated = await registry.activate('echo-tools')
    expect(activated.ok).toBe(true)
    expect(activated.ok ? activated.value.state : undefined).toBe('activated')

    const deactivated = registry.deactivate('echo-tools')
    expect(deactivated.ok).toBe(true)
    expect(deactivated.ok ? deactivated.value.state : undefined).toBe('deactivated')
  })
})
