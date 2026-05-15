export type {
  RuntimeConfig,
  RuntimeConfigLoadOptions,
  RuntimeEnvironment,
} from './runtimeConfig.js'
export {
  RuntimeConfigError,
  loadRuntimeConfig,
  maskSecret,
  redactRuntimeConfigSecrets,
} from './runtimeConfig.js'

import type { RuntimeConfig } from './runtimeConfig.js'
import { redactRuntimeConfigSecrets } from './runtimeConfig.js'

export const redactSecrets = redactRuntimeConfigSecrets

export function getMaskedConfigSummary(config: RuntimeConfig): Record<string, unknown> {
  return redactRuntimeConfigSecrets(config) as Record<string, unknown>
}
