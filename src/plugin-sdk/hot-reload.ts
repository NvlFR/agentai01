// Adapted using referensi/openclaw/src/plugin-sdk/hot-reload.ts
import chokidar from 'chokidar'
import { basename, relative, sep } from 'node:path'
import type { PluginRegistry } from './registry.js'
import type { PluginLogger } from './types.js'

export type HotReloadOptions = {
  readonly extensionDir: string
  readonly registry: PluginRegistry
  readonly logger?: PluginLogger
}

export type HotReloadDisposer = {
  stop(): Promise<void>
}

export function watchExtensions(options: HotReloadOptions): HotReloadDisposer {
  const { extensionDir, registry, logger } = options

  const watcher = chokidar.watch(extensionDir, {
    ignoreInitial: true,
    depth: 2, // We need to catch manifest.json or index.js changes
    persistent: true,
  })

  const resolvePluginPath = (path: string): string | null => {
    const rel = relative(extensionDir, path)
    const segments = rel.split(sep)
    return segments.length > 0 ? segments[0] : null
  }

  const reloadPlugin = async (path: string) => {
    const pluginPath = resolvePluginPath(path)
    if (!pluginPath) return

    logger?.info(`Hot reload: detected change in ${pluginPath}, reloading...`)
    
    try {
      const pluginId = await registry.load(pluginPath)
      const record = registry.get(pluginId)
      
      if (record?.enabled) {
        // To properly reload, we might need to disable first to clear state
        await registry.disable(pluginId)
        await registry.enable(pluginId)
        logger?.info(`Hot reload: successfully reloaded plugin ${pluginId}`)
      }
    } catch (error) {
      logger?.error(`Hot reload: failed to reload plugin at ${pluginPath}`, { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
    }
  }

  watcher.on('add', (path) => {
    if (basename(path) === 'manifest.json' || basename(path) === 'index.js') {
      reloadPlugin(path)
    }
  })

  watcher.on('change', (path) => {
    if (basename(path) === 'manifest.json' || basename(path) === 'index.js') {
      reloadPlugin(path)
    }
  })

  watcher.on('unlinkDir', (path) => {
    const pluginName = basename(path)
    logger?.info(`Hot reload: plugin directory ${pluginName} removed`)
  })

  return {
    async stop() {
      await watcher.close()
    }
  }
}
