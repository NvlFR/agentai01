import { describe, expect, it } from 'bun:test'

import {
  buildIntegrationReport,
  renderDoctorReport,
  runOperatorCli,
} from './operatorCli.js'

describe('operatorCli', () => {
  it('renders doctor output with chalk-backed status lines', () => {
    const output = renderDoctorReport({
      runtime_app_ready: true,
      telegram_configured: false,
      tavily_configured: true,
      operator_token_configured: true,
      interactive: false,
    })

    expect(output).toContain('Operator doctor')
    expect(output).toContain('AI provider')
    expect(output).toContain('Telegram bot')
  })

  it('runs the doctor command in json mode', async () => {
    const result = await runOperatorCli(['doctor', '--json'], {
      interactive: false,
      env: {
        AI_API_KEY: 'present',
      },
    })

    expect(result.exitCode).toBe(0)
    expect(JSON.parse(result.stdout)).toMatchObject({
      runtime_app_ready: true,
      interactive: false,
    })
  })

  it('protects destructive runtime stop in non-interactive mode', async () => {
    const result = await runOperatorCli(['runtime', 'stop'], {
      interactive: false,
    })

    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('--yes')
  })

  it('allows runtime stop when confirmation succeeds', async () => {
    let stopped = false
    const result = await runOperatorCli(['runtime', 'stop'], {
      interactive: true,
      promptConfirm: async () => true,
      stopRuntime: () => {
        stopped = true
      },
    })

    expect(result.exitCode).toBe(0)
    expect(stopped).toBe(true)
    expect(result.stdout).toContain('Runtime stop confirmed.')
  })

  it('builds integration readiness rows', () => {
    expect(buildIntegrationReport({
      AI_API_KEY: 'key',
      TAVILY_API_KEY: '',
      GITHUB_TOKEN: 'gh',
    })).toEqual([
      { id: 'ai', configured: true },
      { id: 'telegram', configured: false },
      { id: 'tavily', configured: false },
      { id: 'github', configured: true },
      { id: 'slack', configured: false },
    ])
  })
})
