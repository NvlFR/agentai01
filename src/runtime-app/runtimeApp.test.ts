import { afterEach, describe, expect, test } from 'bun:test'
import { RuntimeAppState } from './state.js'
import { startRuntimeAppServer } from './server.js'
import type { RuntimeAppConfig } from './config.js'

const servers: Array<ReturnType<typeof startRuntimeAppServer>> = []

afterEach(() => {
  while (servers.length > 0) {
    servers.pop()?.stop(true)
  }
})

describe('Runtime app operator server', () => {
  test('serves health, readiness, and html shell', async () => {
    const state = new RuntimeAppState(createConfig())
    const server = startRuntimeAppServer(state)
    servers.push(server)

    const baseUrl = `http://${server.hostname}:${server.port}`
    const health = await fetch(`${baseUrl}/health`).then(response => response.json())
    const readyResponse = await fetch(`${baseUrl}/ready`)
    const ready = await readyResponse.json()
    const html = await fetch(`${baseUrl}/`).then(response => response.text())

    expect(health.data.ok).toBe(true)
    expect(readyResponse.status).toBe(200)
    expect(ready.data.readiness.ready).toBe(true)
    expect(html).toContain('AgentAI 01')
    expect(html).toContain('Dashboard')
    expect(html).toContain('Approvals')
  })

  test('requires confirmation for risky operator actions and mutates state after confirmation', async () => {
    const state = new RuntimeAppState(createConfig())
    const server = startRuntimeAppServer(state)
    servers.push(server)

    const baseUrl = `http://${server.hostname}:${server.port}`
    const approvalAttempt = await fetch(`${baseUrl}/api/approvals/apr-delivery-001/respond`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ decision: 'revise', notes: 'Need one more QA pass.' }),
    })

    expect(approvalAttempt.status).toBe(409)
    const approvalRetry = await fetch(`${baseUrl}/api/approvals/apr-delivery-001/respond`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ decision: 'revise', notes: 'Need one more QA pass.', confirm: true }),
    }).then(response => response.json())

    expect(approvalRetry.ok).toBe(true)
    expect(approvalRetry.snapshot.approvals.some((item: { request_id: string }) => item.request_id === 'apr-delivery-001')).toBe(false)

    const jobAttempt = await fetch(`${baseUrl}/api/jobs/job-retry-001/retry`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(jobAttempt.status).toBe(409)

    const jobRetry = await fetch(`${baseUrl}/api/jobs/job-retry-001/retry`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ confirm: true }),
    }).then(response => response.json())

    expect(jobRetry.ok).toBe(true)
    expect(jobRetry.snapshot.jobs.find((job: { job_id: string }) => job.job_id === 'job-retry-001').status).toBe('completed')
  })

  test('executes real runbook directives through runtime app state', () => {
    const state = new RuntimeAppState(createConfig())

    const result = state.submitDirective({
      input: 'jalankan check',
      mode: 'natural',
    })

    expect(result.ok).toBe(true)
    expect(result.message).toContain('Runbook check berhasil.')
    expect(result.message).toContain('Artifact:')
  }, 35_000)

  test('executes workspace inspection directives through runtime app state', () => {
    const state = new RuntimeAppState(createConfig())

    const result = state.submitDirective({
      input: 'baca file src/runtime-app/state.ts',
      mode: 'natural',
    })

    expect(result.ok).toBe(true)
    expect(result.message).toContain('Berhasil membaca src/runtime-app/state.ts')
    expect(result.message).toContain('Artifact:')
  })

  test('returns the real CEO staffing response instead of a generic directive message', () => {
    const state = new RuntimeAppState(createConfig())

    const result = state.submitDirective({
      input: 'analisa kebutuhan agent',
      mode: 'natural',
    })

    expect(result.ok).toBe(true)
    expect(result.message).toContain('# Workforce Plan')
  })

  test('returns current activity for activity directives', () => {
    const state = new RuntimeAppState(createConfig())

    const result = state.submitDirective({
      input: 'apa yang sedang anda jalankan sekarang?',
      mode: 'natural',
    })

    expect(result.ok).toBe(true)
    expect(result.message).toContain('# Current Activity')
  })

  test('requires confirmation before closing all active projects', () => {
    const state = new RuntimeAppState(createConfig())

    const attempt = state.submitDirective({
      input: 'hapus semua proyek yang ada',
      mode: 'natural',
    })

    expect(attempt.ok).toBe(false)
    expect(attempt.requires_confirmation).toBe(true)
    expect(attempt.message).toContain('menutup semua proyek aktif')

    const confirmed = state.submitDirective({
      input: 'hapus semua proyek yang ada',
      mode: 'natural',
      confirm: true,
    })

    expect(confirmed.ok).toBe(true)
    expect(confirmed.message).toContain('Semua proyek aktif berhasil ditutup.')
    expect(confirmed.snapshot.projects.every(project => project.lifecycle_state === 'closed')).toBe(true)
  })
})

function createConfig(): RuntimeAppConfig {
  return {
    env: 'test',
    host: '127.0.0.1',
    port: 0,
    baseUrl: 'http://127.0.0.1:0',
    runtimeId: 'runtime-test',
    operatorToken: 'test-owner-token',
    telegramToken: 'telegram-test-token',
    allowedChatIds: ['123456'],
    ai: {
      baseUrl: 'http://127.0.0.1:8045/v1',
      apiKey: 'sk-test-123456',
      model: 'gpt-4.1-mini',
      timeoutMs: 30_000,
      retryLimit: 2,
      logLatency: true,
    },
    storage: {
      mode: 'memory',
      artifactsRoot: 'runtime/artifacts',
      operationalRoot: 'runtime/operational',
    },
    queue: {
      concurrency: 1,
      retryLimit: 3,
    },
    readiness: {
      ready: true,
      reasons: [],
      checklist: ['test readiness'],
    },
  }
}
