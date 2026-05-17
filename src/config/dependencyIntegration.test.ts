import { describe, expect, it } from 'bun:test'

import { loadDotenvIntoEnv } from './dotenv-loader.js'
import { signTestJwt, verifyJwtToken } from './token-verifier.js'
import { parseLegacyYamlConfig, parseYamlConfig, runtimeYamlConfigSchema } from './yaml-config.js'

describe('config dependency integration', () => {
  it('loads dotenv content into a target env object without clobbering by default', () => {
    const env: Record<string, string | undefined> = {
      APP_ENV: 'test',
    }

    const result = loadDotenvIntoEnv({
      content: 'APP_ENV=prod\nAI_MODEL=gemini-3-flash\n',
      env,
    })

    expect(result.loadedKeys).toEqual(['AI_MODEL'])
    expect(env).toEqual({
      APP_ENV: 'test',
      AI_MODEL: 'gemini-3-flash',
    })
  })

  it('parses modern YAML config with the yaml package', () => {
    const result = parseYamlConfig(
      'runtime:\n  host: 127.0.0.1\n  port: 3000\n',
      runtimeYamlConfigSchema,
    )

    expect(result).toEqual({
      format: 'yaml',
      data: {
        runtime: {
          host: '127.0.0.1',
          port: 3000,
        },
      },
    })
  })

  it('parses legacy-compatible YAML config with js-yaml', () => {
    const result = parseLegacyYamlConfig(
      'runtime:\n  host: localhost\n  port: 4000\n',
      runtimeYamlConfigSchema,
    )

    expect(result.format).toBe('legacy-yaml')
    expect(result.data.runtime.port).toBe(4000)
  })

  it('verifies jose-backed JWT tokens', async () => {
    const token = await signTestJwt({
      secret: 'dependency-secret',
      issuer: 'agentai01',
      audience: 'operator',
      subject: 'owner',
    })

    const verified = await verifyJwtToken({
      token,
      secret: 'dependency-secret',
      issuer: 'agentai01',
      audience: 'operator',
    })

    expect(verified.subject).toBe('owner')
    expect(verified.payload['scope']).toBe('operator')
  })
})
