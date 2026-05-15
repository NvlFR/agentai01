import { afterEach, describe, expect, it } from 'bun:test'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import {
  RuntimeConfigError,
  loadRuntimeConfig,
  redactRuntimeConfigSecrets,
} from './runtimeConfig.js'

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })))
})

describe('loadRuntimeConfig', () => {
  it('loads mode-aware env files with local overrides', async () => {
    const cwd = await createTempDir()
    await writeFile(
      path.join(cwd, '.env'),
      [
        'AI_BASE_URL=https://base.example/v1',
        'AI_API_KEY=base-key',
        'AI_MODEL=model-from-env',
        'APP_PORT=3010',
      ].join('\n'),
      'utf8',
    )
    await writeFile(path.join(cwd, '.env.production'), 'AI_MODEL=prod-model\n', 'utf8')
    await writeFile(
      path.join(cwd, '.env.local'),
      ['AI_API_KEY=local-key', 'RUNTIME_OPERATIONAL_ROOT=.runtime/ops'].join('\n'),
      'utf8',
    )
    await writeFile(path.join(cwd, '.env.production.local'), 'APP_PORT=4010\n', 'utf8')

    const config = await loadRuntimeConfig({
      cwd,
      mode: 'production',
      env: {},
    })

    expect(config.app.env).toBe('production')
    expect(config.app.port).toBe(4010)
    expect(config.provider.apiKey).toBe('local-key')
    expect(config.provider.model).toBe('prod-model')
    expect(config.storage.operationalRoot).toBe(path.join(cwd, '.runtime/ops'))
    expect(config.storage.artifactRoot).toBe(
      path.join(cwd, 'runtime', 'production', 'artifacts'),
    )
  })

  it('fails fast when required env variables are missing', async () => {
    const cwd = await createTempDir()

    const result = loadRuntimeConfig({
      cwd,
      mode: 'test',
      env: {
        AI_BASE_URL: 'http://127.0.0.1:8045/v1',
      },
    })

    await expect(result).rejects.toBeInstanceOf(RuntimeConfigError)
    await expect(result).rejects.toMatchObject({
      issues: [
        'Missing required environment variable: AI_API_KEY',
        'Missing required environment variable: AI_MODEL',
      ],
    })
  })
})

describe('redactRuntimeConfigSecrets', () => {
  it('masks nested secret-like values without changing non-secret fields', () => {
    const redacted = redactRuntimeConfigSecrets({
      provider: {
        apiKey: 'sk-example-secret',
        baseURL: 'http://127.0.0.1:8045/v1',
      },
      nested: {
        access_token: 'token-value',
      },
    })

    expect(redacted).toEqual({
      provider: {
        apiKey: 'sk***et',
        baseURL: 'http://127.0.0.1:8045/v1',
      },
      nested: {
        access_token: 'to***ue',
      },
    })
  })
})

async function createTempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'runtime-config-'))
  tempDirs.push(dir)
  return dir
}
