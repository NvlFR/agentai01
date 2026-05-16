/**
 * legacy-adapters.ts
 *
 * Compatibility adapters for gradual migration from old patterns to new modules.
 *
 * These adapters wrap old-style patterns and delegate to the new src/ modules,
 * emitting deprecation warnings so callers can migrate incrementally without
 * a big-bang rewrite.
 *
 * Migration path:
 *   Old: inline process.on('SIGINT', ...) in entrypoints
 *   New: createProcessLifecycle() from src/process/
 *
 *   Old: ad-hoc status objects in runtime-app state
 *   New: createStatusRegistry() from src/status/
 *
 *   Old: manual service wiring in entrypoints
 *   New: createBootstrapRegistry() from src/bootstrap/
 *
 *   Old: parseRuntimeAppConfig() called directly in entrypoints
 *   New: parseSharedRuntimeFields() from src/config/runtime-app-bridge
 */

import {
  type BootHealthReport,
  type BootstrapRegistry,
  createBootstrapRegistry,
  type ServiceDefinition,
} from '../bootstrap/index.js'
import {
  type ProcessHealthReport,
  type ProcessLifecycle,
  createProcessLifecycle,
  type ShutdownHook,
} from '../process/index.js'
import {
  type StatusRegistry,
  type StatusSnapshot,
  createStatusRegistry,
} from '../status/index.js'
import { buildDeprecationMessage, createDeprecationTracker, type DeprecationReporter } from './index.js'

// ---------------------------------------------------------------------------
// Default deprecation reporter — uses console.warn so it works without a
// logger dependency (avoids circular imports).
// ---------------------------------------------------------------------------

function defaultReporter(notice: { id: string; deprecated: string; replacement?: string; message: string }): void {
  // eslint-disable-next-line no-console
  console.warn(`[DEPRECATED] ${buildDeprecationMessage(notice)}`)
}

// ---------------------------------------------------------------------------
// Legacy config adapter
// ---------------------------------------------------------------------------

export type LegacyConfigLike = {
  env?: string
  port?: number
  host?: string
  ai?: {
    baseUrl?: string
    model?: string
    timeoutMs?: number
  }
}

/**
 * Wraps a legacy config object and emits a deprecation warning.
 *
 * Use this when you have code that reads config directly from a runtime-app
 * config object and you want to migrate it to use src/config/ primitives.
 *
 * @deprecated Migrate to parseSharedRuntimeFields() from src/config/runtime-app-bridge.
 */
export function legacyConfigAdapter(
  config: LegacyConfigLike,
  reporter: DeprecationReporter = defaultReporter,
): LegacyConfigLike {
  const tracker = createDeprecationTracker(reporter)
  tracker.warnOnce({
    id: 'legacy-config-adapter',
    deprecated: 'legacyConfigAdapter',
    replacement: 'parseSharedRuntimeFields() from src/config/runtime-app-bridge',
    message: 'Migrate config reading to the repo-wide config core.',
  })
  return config
}

// ---------------------------------------------------------------------------
// Legacy shutdown adapter
// ---------------------------------------------------------------------------

export type LegacyShutdownFn = () => void | Promise<void>

/**
 * Wraps a legacy shutdown function (e.g. `server.stop(true)`) into a
 * ProcessLifecycle shutdown hook, emitting a deprecation warning.
 *
 * Use this when you have inline `process.on('SIGINT', ...)` handlers that
 * you want to migrate to the new ProcessLifecycle pattern.
 *
 * @deprecated Migrate to createProcessLifecycle() from src/process/.
 */
export function legacyShutdownAdapter(
  name: string,
  shutdownFn: LegacyShutdownFn,
  reporter: DeprecationReporter = defaultReporter,
): { lifecycle: ProcessLifecycle; hook: ShutdownHook } {
  const tracker = createDeprecationTracker(reporter)
  tracker.warnOnce({
    id: `legacy-shutdown-adapter:${name}`,
    deprecated: `legacyShutdownAdapter(${name})`,
    replacement: 'createProcessLifecycle() from src/process/',
    message: 'Register shutdown hooks via ProcessLifecycle.registerShutdownHook().',
  })

  const lifecycle = createProcessLifecycle()
  const hook: ShutdownHook = {
    name,
    run: shutdownFn,
  }
  lifecycle.registerShutdownHook(hook)
  return { lifecycle, hook }
}

// ---------------------------------------------------------------------------
// Legacy status adapter
// ---------------------------------------------------------------------------

export type LegacyHealthObject = {
  ready?: boolean
  status?: string
  reasons?: string[]
}

/**
 * Converts a legacy health/readiness object into a StatusRegistry update,
 * emitting a deprecation warning.
 *
 * Use this when you have ad-hoc health objects in runtime-app state that
 * you want to migrate to the new StatusRegistry pattern.
 *
 * @deprecated Migrate to createStatusRegistry() from src/status/.
 */
export function legacyStatusAdapter(
  source: string,
  health: LegacyHealthObject,
  reporter: DeprecationReporter = defaultReporter,
): { registry: StatusRegistry; snapshot: StatusSnapshot } {
  const tracker = createDeprecationTracker(reporter)
  tracker.warnOnce({
    id: `legacy-status-adapter:${source}`,
    deprecated: `legacyStatusAdapter(${source})`,
    replacement: 'createStatusRegistry() from src/status/',
    message: 'Publish status via StatusRegistry.update().',
  })

  const registry = createStatusRegistry()
  const level = health.ready === false
    ? 'unhealthy'
    : health.status === 'degraded'
      ? 'degraded'
      : 'healthy'

  registry.update({
    source,
    level,
    message: health.reasons?.join('; ') ?? `${source} status`,
  })

  return { registry, snapshot: registry.snapshot() }
}

// ---------------------------------------------------------------------------
// Legacy bootstrap adapter
// ---------------------------------------------------------------------------

export type LegacyServiceFactory<T> = () => T | Promise<T>
export type LegacyServiceStopper<T> = (instance: T) => void | Promise<void>

/**
 * Wraps a legacy service factory (e.g. `startRuntimeAppServer()`) into a
 * BootstrapRegistry service definition, emitting a deprecation warning.
 *
 * Use this when you have manual service wiring in entrypoints that you want
 * to migrate to the new BootstrapRegistry pattern.
 *
 * @deprecated Migrate to createBootstrapRegistry() from src/bootstrap/.
 */
export function legacyBootstrapAdapter<T>(
  id: string,
  factory: LegacyServiceFactory<T>,
  stopper?: LegacyServiceStopper<T>,
  reporter: DeprecationReporter = defaultReporter,
): { registry: BootstrapRegistry; definition: ServiceDefinition<T> } {
  const tracker = createDeprecationTracker(reporter)
  tracker.warnOnce({
    id: `legacy-bootstrap-adapter:${id}`,
    deprecated: `legacyBootstrapAdapter(${id})`,
    replacement: 'createBootstrapRegistry() from src/bootstrap/',
    message: 'Register services via BootstrapRegistry.register().',
  })

  const registry = createBootstrapRegistry()
  const definition: ServiceDefinition<T> = {
    id,
    start: async () => factory(),
    stop: stopper,
  }
  registry.register(definition)
  return { registry, definition }
}

// ---------------------------------------------------------------------------
// Health report bridge
// ---------------------------------------------------------------------------

/**
 * Converts a ProcessHealthReport to a StatusRegistry snapshot.
 *
 * Useful during migration when you have a ProcessLifecycle health report
 * and want to publish it to a StatusRegistry.
 */
export function bridgeProcessHealthToStatus(
  report: ProcessHealthReport,
  registry: StatusRegistry,
): void {
  for (const check of report.checks) {
    registry.update({
      source: check.name,
      level: check.status,
      message: check.message ?? check.status,
      timestamp: report.checkedAt,
    })
  }
}

/**
 * Converts a BootHealthReport to a StatusRegistry snapshot.
 *
 * Useful during migration when you have a BootstrapRegistry health report
 * and want to publish it to a StatusRegistry.
 */
export function bridgeBootHealthToStatus(
  report: BootHealthReport,
  registry: StatusRegistry,
): void {
  for (const service of report.services) {
    registry.update({
      source: service.serviceId,
      level: service.status,
      message: service.message ?? service.status,
    })
  }
}
