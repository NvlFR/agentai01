import { err, ok, type Result } from '../../shared/index.js'
import type { PluginRegistry } from '../../plugins/index.js'

export function createPluginOpsService(registry: PluginRegistry) {
  return {
    async activate(pluginId: string): Promise<Result<string, string>> {
      const result = await registry.activate(pluginId)
      return result.ok ? ok(result.value.state) : err(result.error.message)
    },
    listInstalled(): readonly string[] {
      return registry.list().map(entry => entry.manifest.id)
    },
  }
}
