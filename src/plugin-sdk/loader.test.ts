import { describe, expect, it, mock } from 'bun:test'
import { createPluginLoader } from './loader.js'
import type { Result } from '../shared/index.js'
import { ok, err } from '../shared/index.js'

describe('createPluginLoader', () => {
  const readFile = mock(
    async (_path: string): Promise<Result<string, string>> => err('File not found'),
  )
  const loader = createPluginLoader({
    pluginDir: '/plugins',
    readFile,
  })

  it('loads and validates a valid manifest', async () => {
    const validManifest = {
      id: 'test-plugin',
      name: 'Test Plugin',
      version: '1.0.0',
      description: 'A test plugin',
    }

    readFile.mockResolvedValueOnce(ok(JSON.stringify(validManifest)))

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

    readFile.mockResolvedValueOnce(ok(JSON.stringify(invalidManifest)))

    try {
      await loader.loadManifest('test-plugin')
      expect(true).toBe(false) // Should not reach here
    } catch (error) {
      expect((error as Error).message).toContain('Invalid manifest')
    }
  })

  it('throws error if file read fails', async () => {
    readFile.mockResolvedValueOnce(err('File not found'))

    try {
      await loader.loadManifest('test-plugin')
      expect(true).toBe(false) // Should not reach here
    } catch (error) {
      expect((error as Error).message).toContain('Failed to load manifest')
    }
  })
})
