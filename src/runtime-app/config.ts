import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export type RuntimeEnvironment = 'development' | 'test' | 'production'

export type RuntimeAppConfig = {
  env: RuntimeEnvironment
  host: string
  port: number
  baseUrl: string
  operatorToken: string
  ai: {
    baseUrl: string
    apiKey?: string
    model: string
    timeoutMs: number
  }
  storage: {
    mode: 'memory'
    artifactsRoot: string
  }
  readiness: {
    ready: boolean
    reasons: string[]
    checklist: string[]
  }
}

export function loadRuntimeAppConfig(
  cwd = process.cwd(),
  env = process.env,
): RuntimeAppConfig {
  applyEnvFile(resolve(cwd, '.env.local'), env)

  const nodeEnv = parseEnvironment(env.APP_ENV ?? env.NODE_ENV)
  const port = parsePort(env.APP_PORT, 3000)
  const host = env.APP_HOST ?? '127.0.0.1'
  const protocol = host === '0.0.0.0' ? 'http://127.0.0.1' : `http://${host}`
  const baseUrl = env.APP_BASE_URL ?? `${protocol}:${port}`
  const artifactsRoot = env.STORAGE_ARTIFACTS_ROOT ?? 'runtime/artifacts'
  const readinessReasons: string[] = []

  const aiBaseUrl = env.AI_BASE_URL ?? 'http://127.0.0.1:8045/v1'
  const aiApiKey = env.AI_API_KEY
  const aiModel = env.AI_MODEL ?? 'gpt-4.1-mini'
  const aiTimeoutMs = parseNumber(env.AI_TIMEOUT_MS, 30_000)

  if (!aiApiKey) {
    readinessReasons.push('AI_API_KEY is not set.')
  }

  if (!aiModel) {
    readinessReasons.push('AI_MODEL is not set.')
  }

  return {
    env: nodeEnv,
    host,
    port,
    baseUrl,
    operatorToken: env.OPERATOR_TOKEN ?? 'dev-owner-token',
    ai: {
      baseUrl: aiBaseUrl,
      apiKey: aiApiKey,
      model: aiModel,
      timeoutMs: aiTimeoutMs,
    },
    storage: {
      mode: 'memory',
      artifactsRoot,
    },
    readiness: {
      ready: readinessReasons.length === 0,
      reasons: readinessReasons,
      checklist: [
        'Bun installed and available on PATH.',
        'APP_PORT is free for the HTTP server.',
        'AI_BASE_URL points to a reachable OpenAI-compatible endpoint.',
        'AI_API_KEY is configured for provider calls.',
        'AI_MODEL matches the model served by the provider.',
        'runtime/artifacts path is writable if you switch from demo mode.',
      ],
    },
  }
}

export function redactSecret(value?: string): string {
  if (!value) {
    return '(missing)'
  }

  if (value.length <= 6) {
    return `${value.slice(0, 1)}***${value.slice(-1)}`
  }

  return `${value.slice(0, 3)}***${value.slice(-3)}`
}

function applyEnvFile(path: string, env: NodeJS.ProcessEnv): void {
  if (!existsSync(path)) {
    return
  }

  const lines = readFileSync(path, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex <= 0) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex).trim()
    const rawValue = trimmed.slice(separatorIndex + 1).trim()
    const value = stripQuotes(rawValue)
    env[key] = value
  }
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

function parseEnvironment(value?: string): RuntimeEnvironment {
  if (value === 'production' || value === 'test') {
    return value
  }

  return 'development'
}

function parsePort(value: string | undefined, fallback: number): number {
  return parseNumber(value, fallback)
}

function parseNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}
