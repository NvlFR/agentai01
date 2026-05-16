import { err, ok, type Result } from '../shared/index.js'
import type { PluginFactory, PluginKind, RuntimePlugin } from '../plugin-sdk/index.js'

export type PluginManifest = {
  readonly id: string
  readonly name: string
  readonly version: string
  readonly kind: PluginKind
  readonly capabilities?: readonly string[]
}

export type PluginLifecycleState = 'registered' | 'activated' | 'deactivated' | 'failed'

export type PluginRegistryEntry = {
  readonly manifest: PluginManifest
  readonly factory: PluginFactory
  readonly state: PluginLifecycleState
  readonly instance?: RuntimePlugin
  readonly error?: string
}

export type PluginRegistryErrorCode =
  | 'duplicate'
  | 'invalid-manifest'
  | 'kind-mismatch'
  | 'not-found'
  | 'activation-failed'

export type PluginRegistryError = {
  readonly code: PluginRegistryErrorCode
  readonly message: string
  readonly plugin_id?: string
}

export class PluginRegistry {
  readonly #entries = new Map<string, PluginRegistryEntry>()

  register(manifest: PluginManifest, factory: PluginFactory): Result<PluginRegistryEntry, PluginRegistryError> {
    const validation = validatePluginManifest(manifest)
    if (!validation.ok) {
      return validation
    }

    if (this.#entries.has(manifest.id)) {
      return err(error('duplicate', `Plugin "${manifest.id}" is already registered.`, manifest.id))
    }

    const entry: PluginRegistryEntry = { manifest, factory, state: 'registered' }
    this.#entries.set(manifest.id, entry)
    return ok(entry)
  }

  async activate(pluginId: string): Promise<Result<PluginRegistryEntry, PluginRegistryError>> {
    const entry = this.#entries.get(pluginId)
    if (!entry) {
      return err(error('not-found', `Plugin "${pluginId}" is not registered.`, pluginId))
    }

    try {
      const instance = await entry.factory({ plugin_id: pluginId })
      if (instance.kind !== entry.manifest.kind) {
        return err(error('kind-mismatch', `Plugin "${pluginId}" returned kind "${instance.kind}" but manifest declares "${entry.manifest.kind}".`, pluginId))
      }

      const activated: PluginRegistryEntry = { ...entry, state: 'activated', instance, error: undefined }
      this.#entries.set(pluginId, activated)
      return ok(activated)
    } catch (caught) {
      const failed: PluginRegistryEntry = {
        ...entry,
        state: 'failed',
        error: caught instanceof Error ? caught.message : String(caught),
      }
      this.#entries.set(pluginId, failed)
      return err(error('activation-failed', failed.error ?? 'Plugin activation failed.', pluginId))
    }
  }

  deactivate(pluginId: string): Result<PluginRegistryEntry, PluginRegistryError> {
    const entry = this.#entries.get(pluginId)
    if (!entry) {
      return err(error('not-found', `Plugin "${pluginId}" is not registered.`, pluginId))
    }

    const deactivated: PluginRegistryEntry = { ...entry, state: 'deactivated', instance: undefined }
    this.#entries.set(pluginId, deactivated)
    return ok(deactivated)
  }

  get(pluginId: string): Result<PluginRegistryEntry, PluginRegistryError> {
    const entry = this.#entries.get(pluginId)
    return entry ? ok(entry) : err(error('not-found', `Plugin "${pluginId}" is not registered.`, pluginId))
  }

  list(): readonly PluginRegistryEntry[] {
    return [...this.#entries.values()]
  }
}

export function validatePluginManifest(
  manifest: PluginManifest,
): Result<PluginManifest, PluginRegistryError> {
  if (!manifest.id.trim()) {
    return err(error('invalid-manifest', 'Plugin manifest id is required.'))
  }

  if (!manifest.name.trim()) {
    return err(error('invalid-manifest', 'Plugin manifest name is required.', manifest.id))
  }

  if (!manifest.version.trim()) {
    return err(error('invalid-manifest', 'Plugin manifest version is required.', manifest.id))
  }

  return ok(manifest)
}

function error(
  code: PluginRegistryErrorCode,
  message: string,
  pluginId?: string,
): PluginRegistryError {
  return pluginId ? { code, message, plugin_id: pluginId } : { code, message }
}
