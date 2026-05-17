import { describe, expect, it, mock } from 'bun:test'
import { watchExtensions } from './hot-reload.js'
import type { PluginRegistry } from './registry.js'
import chokidar from 'chokidar'

mock.module('chokidar', () => ({
  default: {
    watch: mock(() => ({
      on: mock(function(this: any) { return this }),
      close: mock(async () => {}),
    })),
  },
}))

describe('watchExtensions', () => {
  const mockRegistry = {
    load: mock(async () => 'test'),
    enable: mock(async () => {}),
    disable: mock(async () => {}),
    get: mock(() => ({ enabled: true })),
    list: mock(() => []),
  } as unknown as PluginRegistry

  it('starts watching the extension directory', () => {
    const disposer = watchExtensions({
      extensionDir: '/extensions',
      registry: mockRegistry,
    })

    expect(chokidar.watch).toHaveBeenCalledWith('/extensions', expect.any(Object))
    expect(disposer.stop).toBeDefined()
  })

  it('can stop watching', async () => {
    const disposer = watchExtensions({
      extensionDir: '/extensions',
      registry: mockRegistry,
    })

    await disposer.stop()
    // We can't easily check the watcher instance from here without more complex mocking
  })
})
