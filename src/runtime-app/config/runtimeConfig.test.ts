import { afterEach, describe, expect, it } from 'bun:test'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import {
  RuntimeConfigError,
  loadRuntimeAppConfig,
  loadRuntimeConfig,
  parseRuntimeAppConfig,
  redactRuntimeConfigSecrets,
} from './runtimeConfig.js'

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })))
})

describe('parseRuntimeAppConfig', () => {
  it('loads mode-aware env files and lets .env.local override explicit env', async () => {
    const cwd = await createTempDir()
    await writeFile(
      path.join(cwd, '.env'),
      [
        'AI_BASE_URL=https://base.example/v1',
        'AI_MODEL=model-from-env',
        'APP_PORT=3010',
      ].join('\n'),
      'utf8',
    )
    await writeFile(path.join(cwd, '.env.production'), 'AI_MODEL=prod-model\n', 'utf8')
    await writeFile(
      path.join(cwd, '.env.local'),
      [
        'AI_API_KEY=local-key',
        'RUNTIME_OPERATIONAL_ROOT=.runtime/ops',
        'ID_CHAT=1001,1002',
      ].join('\n'),
      'utf8',
    )
    await writeFile(path.join(cwd, '.env.production.local'), 'APP_PORT=4010\n', 'utf8')

    const result = parseRuntimeAppConfig({
      cwd,
      mode: 'production',
      env: {
        AI_API_KEY: 'process-env-key',
        OPERATOR_TOKEN: 'operator-token-prod',
      },
      readEnvFiles: true,
    })

    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }

    expect(result.config.env).toBe('production')
    expect(result.config.port).toBe(4010)
    expect(result.config.ai.apiKey).toBe('local-key')
    expect(result.config.ai.model).toBe('prod-model')
    expect(result.config.allowedChatIds).toEqual(['1001', '1002'])
    expect(result.config.storage.operationalRoot).toBe(path.join(cwd, '.runtime/ops'))
    expect(result.config.storage.artifactsRoot).toBe(
      path.join(cwd, 'runtime', 'production', 'artifacts'),
    )
  })

  it('returns warnings and fallback defaults for invalid numeric values', () => {
    const result = parseRuntimeAppConfig({
      mode: 'development',
      env: {
        APP_PORT: 'not-a-number',
        AI_TIMEOUT_MS: 'oops',
        AI_RETRY_LIMIT: 'bad',
        QUEUE_CONCURRENCY: 'nah',
        QUEUE_RETRY_LIMIT: 'nope',
        OPERATOR_TOKEN: 'operator-token-dev',
      },
    })

    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }

    expect(result.config.port).toBe(3000)
    expect(result.config.ai.timeoutMs).toBe(30_000)
    expect(result.config.ai.retryLimit).toBe(2)
    expect(result.config.queue.concurrency).toBe(1)
    expect(result.config.queue.retryLimit).toBe(3)
    expect(result.warnings).toEqual([
      'APP_PORT must be an integer. Falling back to 3000.',
      'AI_TIMEOUT_MS must be an integer. Falling back to 30000.',
      'AI_RETRY_LIMIT must be an integer. Falling back to 2.',
      'QUEUE_CONCURRENCY must be an integer. Falling back to 1.',
      'QUEUE_RETRY_LIMIT must be an integer. Falling back to 3.',
    ])
  })

  it('marks readiness false when AI_API_KEY is missing without reading host env in test mode', () => {
    const result = parseRuntimeAppConfig({
      mode: 'test',
      env: {
        AI_BASE_URL: 'http://127.0.0.1:8045/v1',
        AI_MODEL: 'gpt-4.1-mini',
        OPERATOR_TOKEN: 'operator-token-test',
      },
    })

    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }

    expect(result.config.readiness.ready).toBe(false)
    expect(result.config.readiness.reasons).toEqual(['AI_API_KEY is not set.'])
    expect(result.config.ai.apiKey).toBeNull()
  })

  it('rejects production config without OPERATOR_TOKEN fallback', () => {
    const result = parseRuntimeAppConfig({
      mode: 'production',
      env: {
        AI_BASE_URL: 'http://127.0.0.1:8045/v1',
        AI_MODEL: 'gpt-4.1-mini',
        AI_API_KEY: 'sk-test',
      },
    })

    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }

    expect(result.errors).toContainEqual({
      field: 'OPERATOR_TOKEN',
      message: 'OPERATOR_TOKEN is required in staging and production; no development fallback is allowed.',
    })
  })
})

describe('loadRuntimeConfig', () => {
  it('returns structured errors when provider-backed config is incomplete', async () => {
    const cwd = await createTempDir()

    await expect(
      loadRuntimeConfig({
        cwd,
        mode: 'test',
        env: {
          AI_BASE_URL: 'http://127.0.0.1:8045/v1',
          AI_MODEL: 'gpt-4.1-mini',
        },
      }),
    ).rejects.toMatchObject({
      errors: [
        {
          field: 'AI_API_KEY',
          message: 'AI_API_KEY is required for provider-backed runtime operations.',
        },
      ],
    })
  })

  it('throws structured invalid-field errors for unsupported runtime environment', () => {
    expect(() =>
      loadRuntimeAppConfig({
        env: {
          APP_ENV: 'staging',
          OPERATOR_TOKEN: 'operator-token-staging',
        },
      }),
    ).not.toThrow()

    expect(() =>
      loadRuntimeAppConfig({
        env: {
          APP_ENV: 'qa',
        },
      }),
    ).toThrow(RuntimeConfigError)

    expect(() =>
      loadRuntimeAppConfig({
        env: {
          APP_ENV: 'staging',
          OPERATOR_TOKEN: 'operator-token-staging',
        },
      }),
    ).not.toThrow()

    expect(() =>
      loadRuntimeAppConfig({
        env: {
          APP_ENV: 'qa',
        },
      }),
    ).toThrow('Runtime app config validation failed.')
  })
})

describe('redactRuntimeConfigSecrets', () => {
  it('masks nested secret-like values without changing non-secret fields', () => {
    const redacted = redactRuntimeConfigSecrets({
      ai: {
        apiKey: 'sk-example-secret',
        baseUrl: 'http://127.0.0.1:8045/v1',
      },
      auth: {
        access_token: 'token-value',
      },
    })

    expect(redacted).toEqual({
      ai: {
        apiKey: 'sk-e...****',
        baseUrl: 'http://127.0.0.1:8045/v1',
      },
      auth: {
        access_token: 'toke...****',
      },
    })
  })
})

async function createTempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'runtime-config-'))
  tempDirs.push(dir)
  return dir
}
