import { describe, expect, it, mock } from 'bun:test'
import { createPluginLoader } from './loader.js'
import * as fs from '../infra/fs.js'
import { ok, err } from '../shared/index.js'

mock.module('../infra/fs.js', () => ({
  readFileSafe: mock(),
}))

describe('createPluginLoader', () => {
  const loader = createPluginLoader({ pluginDir: '/plugins' })

  it('loads and validates a valid manifest', async () => {
    const validManifest = {
      id: 'test-plugin',
      name: 'Test Plugin',
      version: '1.0.0',
      description: 'A test plugin',
    }

    const { readFileSafe } = await import('../infra/fs.js')
    // @ts-ignore
    readFileSafe.mockResolvedValue(ok(JSON.stringify(validManifest)))

    const manifest = await loader.loadManifest('test-plugin')
    expect(manifest).toEqual(validManifest)
  })

  it('throws error for invalid manifest', async () => {
    const invalidManifest = {
      id: 'test-plugin',
      // missing name
      version: '1.0.0',
      description: 'A test plugin',
    }

    const { readFileSafe } = await import('../infra/fs.js')
    // @ts-ignore
    readFileSafe.mockResolvedValue(ok(JSON.stringify(invalidManifest)))

    try {
      await loader.loadManifest('test-plugin')
      expect(true).toBe(false) // Should not reach here
    } catch (error) {
      expect((error as Error).message).toContain('Invalid manifest')
    }
  })

  it('throws error if file read fails', async () => {
    const { readFileSafe } = await import('../infra/fs.js')
    // @ts-ignore
    readFileSafe.mockResolvedValue(err('File not found'))

    try {
      await loader.loadManifest('test-plugin')
      expect(true).toBe(false) // Should not reach here
    } catch (error) {
      expect((error as Error).message).toContain('Failed to load manifest')
    }
  })
})
