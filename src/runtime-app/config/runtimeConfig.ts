import { access, readFile } from 'node:fs/promises'
import path from 'node:path'

export type RuntimeEnvironment = 'development' | 'test' | 'production'

export type RuntimeConfig = {
  app: {
    env: RuntimeEnvironment
    port: number
    runtimeId: string
  }
  provider: {
    baseURL: string
    apiKey: string
    model: string
    timeoutMs: number
    retryLimit: number
    logLatency: boolean
  }
  storage: {
    operationalRoot: string
    artifactRoot: string
  }
  queue: {
    concurrency: number
    retryLimit: number
  }
}

export type RuntimeConfigLoadOptions = {
  cwd?: string
  mode?: RuntimeEnvironment
  env?: Record<string, string | undefined>
}

export class RuntimeConfigError extends Error {
  readonly issues: string[]

  constructor(message: string, issues: string[]) {
    super(message)
    this.name = 'RuntimeConfigError'
    this.issues = issues
  }
}

const SECRET_KEY_PATTERN = /(secret|token|password|key)/i
const DEFAULT_RUNTIME_ID = 'runtime-app'

export async function loadRuntimeConfig(
  options: RuntimeConfigLoadOptions = {},
): Promise<RuntimeConfig> {
  const cwd = options.cwd ?? process.cwd()
  const processEnv = options.env ?? process.env
  const mode = resolveRuntimeEnvironment(options.mode, processEnv)
  const fileEnv = await loadEnvFiles(cwd, mode)
  const mergedEnv = { ...fileEnv, ...processEnv }

  const requiredKeys = ['AI_BASE_URL', 'AI_API_KEY', 'AI_MODEL'] as const
  const issues = requiredKeys
    .filter(key => !mergedEnv[key] || mergedEnv[key]?.trim().length === 0)
    .map(key => `Missing required environment variable: ${key}`)

  if (issues.length > 0) {
    throw new RuntimeConfigError('Runtime config validation failed.', issues)
  }

  return {
    app: {
      env: mode,
      port: parseInteger(mergedEnv['APP_PORT'], 3000, 'APP_PORT'),
      runtimeId: mergedEnv['RUNTIME_ID']?.trim() || DEFAULT_RUNTIME_ID,
    },
    provider: {
      baseURL: normalizeBaseURL(mergedEnv['AI_BASE_URL'] as string),
      apiKey: (mergedEnv['AI_API_KEY'] as string).trim(),
      model: (mergedEnv['AI_MODEL'] as string).trim(),
      timeoutMs: parseInteger(mergedEnv['AI_TIMEOUT_MS'], 30_000, 'AI_TIMEOUT_MS'),
      retryLimit: parseInteger(mergedEnv['AI_RETRY_LIMIT'], 2, 'AI_RETRY_LIMIT'),
      logLatency: parseBoolean(mergedEnv['AI_LOG_LATENCY'], true),
    },
    storage: {
      operationalRoot: resolveStoragePath(
        cwd,
        mergedEnv['RUNTIME_OPERATIONAL_ROOT'],
        path.join(cwd, 'runtime', mode, 'operational'),
      ),
      artifactRoot: resolveStoragePath(
        cwd,
        mergedEnv['RUNTIME_ARTIFACT_ROOT'],
        path.join(cwd, 'runtime', mode, 'artifacts'),
      ),
    },
    queue: {
      concurrency: parseInteger(mergedEnv['QUEUE_CONCURRENCY'], 1, 'QUEUE_CONCURRENCY'),
      retryLimit: parseInteger(mergedEnv['QUEUE_RETRY_LIMIT'], 3, 'QUEUE_RETRY_LIMIT'),
    },
  }
}

export function redactRuntimeConfigSecrets<T>(value: T): T {
  return redactValue(value, []) as T
}

async function loadEnvFiles(
  cwd: string,
  mode: RuntimeEnvironment,
): Promise<Record<string, string>> {
  const fileNames = ['.env', `.env.${mode}`, '.env.local', `.env.${mode}.local`]
  const env: Record<string, string> = {}

  for (const fileName of fileNames) {
    const filePath = path.join(cwd, fileName)
    if (!(await exists(filePath))) {
      continue
    }

    Object.assign(env, parseDotEnv(await readFile(filePath, 'utf8')))
  }

  return env
}

function parseDotEnv(source: string): Record<string, string> {
  const env: Record<string, string> = {}

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) {
      continue
    }

    const separatorIndex = line.indexOf('=')
    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    if (!key) {
      continue
    }

    let value = line.slice(separatorIndex + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    } else {
      const commentIndex = value.indexOf(' #')
      if (commentIndex >= 0) {
        value = value.slice(0, commentIndex).trim()
      }
    }

    env[key] = value
  }

  return env
}

function resolveRuntimeEnvironment(
  requestedMode: RuntimeEnvironment | undefined,
  env: Record<string, string | undefined>,
): RuntimeEnvironment {
  const candidate = requestedMode ?? env['RUNTIME_ENV'] ?? env['NODE_ENV'] ?? 'development'
  if (candidate === 'development' || candidate === 'test' || candidate === 'production') {
    return candidate
  }

  throw new RuntimeConfigError('Runtime config validation failed.', [
    `Unsupported runtime environment: ${candidate}`,
  ])
}

function normalizeBaseURL(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

function parseInteger(
  value: string | undefined,
  fallback: number,
  key: string,
): number {
  if (value === undefined || value.trim().length === 0) {
    return fallback
  }

  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) {
    throw new RuntimeConfigError('Runtime config validation failed.', [
      `Environment variable ${key} must be an integer.`,
    ])
  }

  return parsed
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value.trim().length === 0) {
    return fallback
  }

  return !['0', 'false', 'no', 'off'].includes(value.trim().toLowerCase())
}

function resolveStoragePath(cwd: string, value: string | undefined, fallback: string): string {
  if (!value || value.trim().length === 0) {
    return fallback
  }

  return path.isAbsolute(value) ? value : path.resolve(cwd, value)
}

function redactValue(value: unknown, parentKeys: string[]): unknown {
  if (Array.isArray(value)) {
    return value.map(item => redactValue(item, parentKeys))
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => {
        const nextPath = [...parentKeys, key]
        if (SECRET_KEY_PATTERN.test(key)) {
          return [key, maskSecret(entryValue)]
        }

        return [key, redactValue(entryValue, nextPath)]
      }),
    )
  }

  if (typeof value === 'string' && parentKeys.some(key => SECRET_KEY_PATTERN.test(key))) {
    return maskSecret(value)
  }

  return value
}

export function maskSecret(value: unknown): string {
  const normalized = String(value ?? '')
  if (normalized.length <= 4) {
    return '****'
  }

  return `${normalized.slice(0, 2)}***${normalized.slice(-2)}`
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}
