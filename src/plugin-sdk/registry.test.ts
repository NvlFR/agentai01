import { describe, expect, it, mock } from 'bun:test'
import { createPluginRegistry } from './registry.js'
import type { PluginLoader } from './loader.js'
import type { PluginContext } from './types.js'

describe('createPluginRegistry', () => {
  const mockLoader: PluginLoader = {
    loadManifest: mock(async (path: string) => ({
      id: path,
      name: `Plugin ${path}`,
      version: '1.0.0',
      description: 'Test'
    }))
  }

  const mockContext: PluginContext = { plugin_id: 'system' }

  const registry = createPluginRegistry({
    loader: mockLoader,
    pluginDir: '/plugins',
    context: mockContext
  })

  it('loads a plugin manifest', async () => {
    const id = await registry.load('test-plugin')
    expect(id).toBe('test-plugin')
    
    const record = registry.get(id)
    expect(record).toBeDefined()
    expect(record?.manifest.id).toBe('test-plugin')
    expect(record?.enabled).toBe(false)
  })

  it('lists loaded plugins', async () => {
    await registry.load('plugin-1')
    await registry.load('plugin-2')
    
    const list = registry.list()
    expect(list.length).toBeGreaterThanOrEqual(2)
    expect(list.map(r => r.manifest.id)).toContain('plugin-1')
    expect(list.map(r => r.manifest.id)).toContain('plugin-2')
  })

  it('can disable a plugin', async () => {
    const id = await registry.load('plugin-to-disable')
    const record = registry.get(id)!
    
    // Simulate enabled state
    // @ts-ignore
    record.enabled = true
    
    await registry.disable(id)
    expect(record.enabled).toBe(false)
  })
})
