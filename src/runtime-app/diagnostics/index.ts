// src/runtime-app/diagnostics/index.ts
// Re-exports for diagnostics layer.

export { createLogger, rootLogger } from './logger.js'
export type { Logger } from './logger.js'

export { createHealthState } from './health.js'
export type { HealthState, HealthStatus } from './health.js'

export { DiagnosticsManager, globalDiagnostics } from './diagnosticsCore.js'
export type { DiagnosticsBackend, MetricType } from './diagnosticsCore.js'
