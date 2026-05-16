/**
 * runtime-app-bridge.ts
 *
 * Bridge between src/config/ (repo-wide config core) and src/runtime-app/config/
 * (operator shell config).
 *
 * Boundary rule:
 *   - src/config/ MUST NOT import from src/runtime-app/
 *   - src/runtime-app/config/ MAY import from src/config/ to delegate or extend
 *
 * This file lives in src/config/ and exposes a typed adapter that the runtime-app
 * config layer can use to delegate parsing of shared fields to the core config
 * primitives (readString, readInteger, readBoolean, envSource, parseConfig).
 *
 * Usage from src/runtime-app/config/:
 *
 *   import { buildRuntimeAppConfigSource, parseSharedRuntimeFields } from '../../config/runtime-app-bridge.js'
 *
 *   const source = buildRuntimeAppConfigSource(process.env)
 *   const shared = parseSharedRuntimeFields(source)
 */

import {
  envSource,
  parseConfig,
  readBoolean,
  readInteger,
  readString,
  type ConfigParseResult,
} from './index.js'

/**
 * Shared runtime fields that both the config core and the runtime-app config
 * agree on. These are the fields that can be parsed by the generic config
 * primitives without any operator-shell-specific logic.
 */
export type SharedRuntimeFields = {
  /** Runtime environment: development | test | production */
  env: string
  /** HTTP server host */
  host: string
  /** HTTP server port */
  port: number
  /** AI provider base URL */
  aiBaseUrl: string
  /** AI model identifier */
  aiModel: string
  /** AI request timeout in milliseconds */
  aiTimeoutMs: number
  /** AI retry limit */
  aiRetryLimit: number
  /** Whether to log AI provider latency */
  aiLogLatency: boolean
  /** Queue concurrency */
  queueConcurrency: number
  /** Queue retry limit */
  queueRetryLimit: number
}

/**
 * Build a normalized env source from a raw environment record.
 * Strips undefined values so the config readers can work cleanly.
 */
export function buildRuntimeAppConfigSource(
  env: Record<string, string | undefined>,
): Record<string, unknown> {
  return envSource(env)
}

/**
 * Parse the shared runtime fields from an env-like source using the
 * repo-wide config core primitives.
 *
 * This is intentionally a subset of RuntimeAppConfig — the operator-shell-
 * specific fields (operatorToken, telegramToken, storage paths, etc.) are
 * handled by src/runtime-app/config/ directly.
 */
export function parseSharedRuntimeFields(
  source: Record<string, unknown>,
): ConfigParseResult<SharedRuntimeFields> {
  return parseConfig(source, {
    env: readString({ env: 'APP_ENV', defaultValue: 'development', required: false }),
    host: readString({ env: 'APP_HOST', defaultValue: '127.0.0.1', required: false }),
    port: readInteger({ env: 'APP_PORT', defaultValue: 3000, min: 1, max: 65535 }),
    aiBaseUrl: readString({ env: 'AI_BASE_URL', defaultValue: 'http://127.0.0.1:8045/v1', required: false }),
    aiModel: readString({ env: 'AI_MODEL', defaultValue: 'gpt-4.1-mini', required: false }),
    aiTimeoutMs: readInteger({ env: 'AI_TIMEOUT_MS', defaultValue: 30_000, min: 1 }),
    aiRetryLimit: readInteger({ env: 'AI_RETRY_LIMIT', defaultValue: 2, min: 0 }),
    aiLogLatency: readBoolean({ env: 'AI_LOG_LATENCY', defaultValue: true }),
    queueConcurrency: readInteger({ env: 'QUEUE_CONCURRENCY', defaultValue: 1, min: 1 }),
    queueRetryLimit: readInteger({ env: 'QUEUE_RETRY_LIMIT', defaultValue: 3, min: 0 }),
  })
}

/**
 * Validate that a given env record contains the minimum required fields for
 * the runtime to start. Returns a list of missing/invalid field names.
 *
 * This is a lightweight pre-flight check that can be called before the full
 * parseRuntimeAppConfig() to surface obvious misconfigurations early.
 */
export function validateRuntimeEnvPreFlight(
  env: Record<string, string | undefined>,
): { ok: boolean; missing: string[] } {
  const missing: string[] = []

  if (!env['AI_API_KEY']?.trim()) {
    missing.push('AI_API_KEY')
  }

  const port = env['APP_PORT']
  if (port !== undefined) {
    const parsed = Number.parseInt(port, 10)
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
      missing.push('APP_PORT')
    }
  }

  const aiBaseUrl = env['AI_BASE_URL']
  if (aiBaseUrl !== undefined) {
    try {
      const url = new URL(aiBaseUrl)
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        missing.push('AI_BASE_URL')
      }
    } catch {
      missing.push('AI_BASE_URL')
    }
  }

  return { ok: missing.length === 0, missing }
}
