import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  createSecretsAccessor,
  redactSecret,
  redactSensitiveValue,
} from '../../secrets/index.js'

export type RuntimeEnvironment = 'development' | 'test' | 'staging' | 'production'

export type RuntimeAppConfig = {
  env: RuntimeEnvironment
  host: string
  port: number
  baseUrl: string
  runtimeId: string
  operatorToken: string
  ownerToken?: string | null
  observerToken?: string | null
  telegramToken: string | null
  allowedChatIds: string[]
  ai: {
    baseUrl: string
    apiKey: string | null
    model: string
    timeoutMs: number
    retryLimit: number
    logLatency: boolean
  }
  storage: {
    mode: 'memory' | 'sqlite' | 'postgres'
    databaseUrl: string | null
    artifactsRoot: string
    operationalRoot: string
  }
  queue: {
    concurrency: number
    retryLimit: number
  }
  webhook?: {
    telegramSecret: string | null
    whatsappSecret: string | null
  }
  readiness: {
    ready: boolean
    reasons: string[]
    checklist: string[]
  }
}

export type RuntimeAppConfigIssue = {
  field: string
  message: string
}

export type RuntimeAppConfigLoadOptions = {
  cwd?: string
  mode?: RuntimeEnvironment
  env?: Record<string, string | undefined>
  readEnvFiles?: boolean
  requireProvider?: boolean
}

export type RuntimeAppConfigParseResult =
  | {
      ok: true
      config: RuntimeAppConfig
      warnings: string[]
    }
  | {
      ok: false
      errors: RuntimeAppConfigIssue[]
      warnings: string[]
    }

export class RuntimeAppConfigError extends Error {
  readonly errors: RuntimeAppConfigIssue[]
  readonly warnings: string[]

  constructor(
    message: string,
    errors: RuntimeAppConfigIssue[],
    warnings: string[] = [],
  ) {
    super(message)
    this.name = 'RuntimeAppConfigError'
    this.errors = errors
    this.warnings = warnings
  }
}

const DEFAULT_RUNTIME_ID = 'runtime-app'
const DEFAULT_OPERATOR_TOKEN = 'dev-owner-token'
const RUNTIME_READINESS_CHECKLIST = [
  'Bun installed and available on PATH.',
  'APP_PORT is free for the HTTP server.',
  'AI_BASE_URL points to a reachable OpenAI-compatible endpoint.',
  'AI_API_KEY is configured for provider calls.',
  'AI_MODEL matches the model served by the provider.',
  'runtime/artifacts path is writable if you switch from demo mode.',
] as const

export function loadRuntimeAppConfig(
  options: RuntimeAppConfigLoadOptions = {},
): RuntimeAppConfig {
  const result = parseRuntimeAppConfig(options)
  if (!result.ok) {
    throw new RuntimeAppConfigError(
      'Runtime app config validation failed.',
      result.errors,
      result.warnings,
    )
  }

  return result.config
}

export function parseRuntimeAppConfig(
  options: RuntimeAppConfigLoadOptions = {},
): RuntimeAppConfigParseResult {
  const cwd = options.cwd ?? process.cwd()
  const explicitEnv = options.env
  const sourceEnv = explicitEnv ?? process.env
  const modeResult = resolveRuntimeEnvironment(options.mode, sourceEnv)

  if (!modeResult.ok) {
    return {
      ok: false,
      errors: [modeResult.error],
      warnings: [],
    }
  }

  const readEnvFiles =
    options.readEnvFiles ?? (explicitEnv === undefined && modeResult.value !== 'test')
  const mergedEnv = mergeEnvSources({
    cwd,
    mode: modeResult.value,
    sourceEnv,
    readEnvFiles,
  })
  const secrets = createSecretsAccessor(mergedEnv)

  const warnings: string[] = []
  const errors: RuntimeAppConfigIssue[] = []

  const host = readStringValue(mergedEnv['APP_HOST']) ?? '127.0.0.1'
  const port = readIntegerValue({
    field: 'APP_PORT',
    value: mergedEnv['APP_PORT'],
    fallback: 3000,
    warnings,
  })
  const baseUrl = readBaseUrlValue(mergedEnv['APP_BASE_URL'], host, port, errors)
  const runtimeId = readStringValue(mergedEnv['RUNTIME_ID']) ?? DEFAULT_RUNTIME_ID

  const aiBaseUrl = readAiBaseUrlValue(mergedEnv['AI_BASE_URL'], errors)
  const aiApiKeyResult = secrets.getAiApiKey()
  const aiApiKey = aiApiKeyResult.ok ? aiApiKeyResult.value : null
  const aiModel = readStringValue(mergedEnv['AI_MODEL']) ?? 'gpt-4.1-mini'
  const aiTimeoutMs = readIntegerValue({
    field: 'AI_TIMEOUT_MS',
    value: mergedEnv['AI_TIMEOUT_MS'],
    fallback: 30_000,
    warnings,
  })
  const aiRetryLimit = readIntegerValue({
    field: 'AI_RETRY_LIMIT',
    value: mergedEnv['AI_RETRY_LIMIT'],
    fallback: 2,
    warnings,
  })
  const aiLogLatency = readBooleanValue({
    field: 'AI_LOG_LATENCY',
    value: mergedEnv['AI_LOG_LATENCY'],
    fallback: true,
    warnings,
  })

  if (options.requireProvider && !aiApiKey) {
    errors.push({
      field: 'AI_API_KEY',
      message: 'AI_API_KEY is required for provider-backed runtime operations.',
    })
  }

  const env = modeResult.value
  const operatorToken = readOperatorToken(secrets, env, errors, warnings)
  const ownerToken = readStringValue(mergedEnv['OWNER_TOKEN']) ?? null
  const observerToken = readStringValue(mergedEnv['OBSERVER_TOKEN']) ?? null
  const telegramWebhookSecret = readStringValue(mergedEnv['TELEGRAM_WEBHOOK_SECRET']) ?? null
  const whatsappWebhookSecret = readStringValue(mergedEnv['WHATSAPP_WEBHOOK_SECRET']) ?? null
  const artifactsRoot = resolveStoragePath(
    cwd,
    readStringValue(mergedEnv['STORAGE_ARTIFACTS_ROOT']) ??
      readStringValue(mergedEnv['RUNTIME_ARTIFACT_ROOT']) ??
      path.join('runtime', env, 'artifacts'),
  )
  const operationalRoot = resolveStoragePath(
    cwd,
    readStringValue(mergedEnv['RUNTIME_OPERATIONAL_ROOT']) ??
      path.join('runtime', env, 'operational'),
  )

  const queueConcurrency = readIntegerValue({
    field: 'QUEUE_CONCURRENCY',
    value: mergedEnv['QUEUE_CONCURRENCY'],
    fallback: 1,
    warnings,
  })
  const queueRetryLimit = readIntegerValue({
    field: 'QUEUE_RETRY_LIMIT',
    value: mergedEnv['QUEUE_RETRY_LIMIT'],
    fallback: 3,
    warnings,
  })

  const readinessReasons: string[] = []
  if (!aiApiKey) {
    readinessReasons.push('AI_API_KEY is not set.')
  }

  if (errors.length > 0) {
    return {
      ok: false,
      errors,
      warnings,
    }
  }

  return {
    ok: true,
    config: {
      env,
      host,
      port,
      baseUrl,
      runtimeId,
      operatorToken,
      ownerToken,
      observerToken,
      telegramToken: readTelegramToken(secrets),
      allowedChatIds: parseAllowedChatIds(mergedEnv['ID_CHAT']),
      ai: {
        baseUrl: aiBaseUrl,
        apiKey: aiApiKey,
        model: aiModel,
        timeoutMs: aiTimeoutMs,
        retryLimit: aiRetryLimit,
        logLatency: aiLogLatency,
      },
      storage: {
        mode: mergedEnv['DATABASE_URL'] ? 'postgres' : (env === 'test' ? 'memory' : 'sqlite'),
        databaseUrl: mergedEnv['DATABASE_URL'] ?? null,
        artifactsRoot,
        operationalRoot,
      },
      queue: {
        concurrency: queueConcurrency,
        retryLimit: queueRetryLimit,
      },
      webhook: {
        telegramSecret: telegramWebhookSecret,
        whatsappSecret: whatsappWebhookSecret,
      },
      readiness: {
        ready: readinessReasons.length === 0,
        reasons: readinessReasons,
        checklist: [...RUNTIME_READINESS_CHECKLIST],
      },
    },
    warnings,
  }
}

export function serializeRuntimeAppConfig(
  config: RuntimeAppConfig,
): Record<string, unknown> {
  return redactSensitiveValue(config) as Record<string, unknown>
}

export function redactRuntimeConfigSecrets<T>(value: T): T {
  return redactSensitiveValue(value)
}

export function getMaskedConfigSummary(config: RuntimeAppConfig): Record<string, unknown> {
  return serializeRuntimeAppConfig(config)
}

export function maskSecret(value: unknown): string {
  return redactSecret(String(value ?? ''))
}

export const redactSecrets = redactRuntimeConfigSecrets

export async function loadRuntimeConfig(
  options: RuntimeAppConfigLoadOptions = {},
): Promise<RuntimeAppConfig> {
  return loadRuntimeAppConfig({
    ...options,
    requireProvider: options.requireProvider ?? true,
  })
}

export function getSubprocessEnvironment(
  sourceEnv: Record<string, string | undefined> = process.env,
): Record<string, string | undefined> {
  return { ...sourceEnv }
}

function mergeEnvSources(input: {
  cwd: string
  mode: RuntimeEnvironment
  sourceEnv: Record<string, string | undefined>
  readEnvFiles: boolean
}): Record<string, string | undefined> {
  if (!input.readEnvFiles) {
    return { ...input.sourceEnv }
  }

  const baseEnv = loadDotEnvFile(path.join(input.cwd, '.env'))
  const modeEnv = loadDotEnvFile(path.join(input.cwd, `.env.${input.mode}`))
  const localEnv = loadDotEnvFile(path.join(input.cwd, '.env.local'))
  const modeLocalEnv = loadDotEnvFile(path.join(input.cwd, `.env.${input.mode}.local`))

  return {
    ...baseEnv,
    ...modeEnv,
    ...input.sourceEnv,
    ...localEnv,
    ...modeLocalEnv,
  }
}

function loadDotEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) {
    return {}
  }

  return parseDotEnv(readFileSync(filePath, 'utf8'))
}

function parseDotEnv(source: string): Record<string, string> {
  const env: Record<string, string> = {}

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) {
      continue
    }

    const separatorIndex = line.indexOf('=')
    if (separatorIndex <= 0) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    const rawValue = line.slice(separatorIndex + 1).trim()
    if (!key) {
      continue
    }

    env[key] = stripQuotes(stripInlineComment(rawValue))
  }

  return env
}

function stripInlineComment(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value
  }

  const commentIndex = value.indexOf(' #')
  return commentIndex >= 0 ? value.slice(0, commentIndex).trim() : value
}

function stripQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }

  return value
}

function resolveRuntimeEnvironment(
  requestedMode: RuntimeEnvironment | undefined,
  env: Record<string, string | undefined>,
): { ok: true; value: RuntimeEnvironment } | { ok: false; error: RuntimeAppConfigIssue } {
  const candidate = requestedMode ?? env['APP_ENV'] ?? env['RUNTIME_ENV'] ?? env['NODE_ENV'] ?? 'development'
  if (
    candidate === 'development' ||
    candidate === 'test' ||
    candidate === 'staging' ||
    candidate === 'production'
  ) {
    return {
      ok: true,
      value: candidate,
    }
  }

  return {
    ok: false,
    error: {
      field: 'APP_ENV',
      message: `Unsupported runtime environment: ${candidate}`,
    },
  }
}

function readBaseUrlValue(
  value: string | undefined,
  host: string,
  port: number,
  errors: RuntimeAppConfigIssue[],
): string {
  const protocolBase =
    host === '0.0.0.0' ? 'http://127.0.0.1' : `http://${host}`
  const fallback = `${protocolBase}:${port}`
  const resolved = readStringValue(value) ?? fallback

  if (!isValidUrl(resolved)) {
    errors.push({
      field: 'APP_BASE_URL',
      message: `APP_BASE_URL must be a valid absolute URL. Received: ${resolved}`,
    })
  }

  return resolved
}

function readAiBaseUrlValue(
  value: string | undefined,
  errors: RuntimeAppConfigIssue[],
): string {
  const resolved = normalizeBaseUrl(
    readStringValue(value) ?? 'http://127.0.0.1:8045/v1',
  )

  if (!isValidUrl(resolved)) {
    errors.push({
      field: 'AI_BASE_URL',
      message: `AI_BASE_URL must be a valid absolute URL. Received: ${resolved}`,
    })
  }

  return resolved
}

function normalizeBaseUrl(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function readIntegerValue(input: {
  field: string
  value: string | undefined
  fallback: number
  warnings: string[]
}): number {
  const normalized = readStringValue(input.value)
  if (!normalized) {
    return input.fallback
  }

  const parsed = Number.parseInt(normalized, 10)
  if (!Number.isFinite(parsed)) {
    input.warnings.push(
      `${input.field} must be an integer. Falling back to ${input.fallback}.`,
    )
    return input.fallback
  }

  return parsed
}

function readBooleanValue(input: {
  field: string
  value: string | undefined
  fallback: boolean
  warnings: string[]
}): boolean {
  const normalized = readStringValue(input.value)
  if (!normalized) {
    return input.fallback
  }

  const lowered = normalized.toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(lowered)) {
    return true
  }

  if (['0', 'false', 'no', 'off'].includes(lowered)) {
    return false
  }

  input.warnings.push(
    `${input.field} must be a boolean-like value. Falling back to ${String(input.fallback)}.`,
  )
  return input.fallback
}

function readStringValue(value: string | undefined): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

function resolveStoragePath(cwd: string, value: string): string {
  return path.isAbsolute(value) ? value : path.resolve(cwd, value)
}

function parseAllowedChatIds(value: string | undefined): string[] {
  const normalized = readStringValue(value)
  if (!normalized) {
    return []
  }

  return normalized
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0)
}

function readOperatorToken(
  secrets: ReturnType<typeof createSecretsAccessor>,
  env: RuntimeEnvironment,
  errors: RuntimeAppConfigIssue[],
  warnings: string[],
): string {
  const result = secrets.getOperatorToken()
  if (result.ok) {
    return result.value
  }

  if (env === 'production' || env === 'staging') {
    errors.push({
      field: 'OPERATOR_TOKEN',
      message: 'OPERATOR_TOKEN is required in staging and production; no development fallback is allowed.',
    })
    return ''
  }

  warnings.push('OPERATOR_TOKEN is missing. Using development-only fallback token outside staging/production.')
  return DEFAULT_OPERATOR_TOKEN
}

function readTelegramToken(
  secrets: ReturnType<typeof createSecretsAccessor>,
): string | null {
  const result = secrets.getTelegramToken()
  return result.ok ? result.value : null
}
