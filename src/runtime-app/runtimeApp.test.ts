import { afterEach, describe, expect, test } from 'bun:test'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { RuntimeAppState } from './state.js'
import { startRuntimeAppServer } from './server.js'
import type { RuntimeAppConfig } from './config.js'

const servers: Array<ReturnType<typeof startRuntimeAppServer>> = []
const tempDirs: string[] = []

afterEach(async () => {
  while (servers.length > 0) {
    servers.pop()?.stop(true)
  }
  while (tempDirs.length > 0) {
    const tempDir = tempDirs.pop()
    if (tempDir !== undefined) {
      await rm(tempDir, { recursive: true, force: true })
    }
  }
})

describe('Runtime app operator server', () => {
  test('serves health, readiness, and built operator UI', async () => {
    const staticDir = await createBuiltStaticDir()
    const state = new RuntimeAppState(createConfig())
    const server = startRuntimeAppServer(state, { staticDir })
    servers.push(server)

    const baseUrl = `http://${server.hostname}:${server.port}`
    const health = await fetch(`${baseUrl}/health`).then(response => response.json())
    const readyResponse = await fetch(`${baseUrl}/ready`)
    const ready = await readyResponse.json()
    const uiResponse = await fetch(`${baseUrl}/`)
    const html = await uiResponse.text()

    expect(health.data.ok).toBe(true)
    expect(readyResponse.status).toBe(200)
    expect(ready.data.readiness.ready).toBe(true)
    expect(uiResponse.headers.get('content-type')).toBe('text/html; charset=utf-8')
    expect(html).toContain('AgentAI 01 Built UI')
  })

  test('serves static assets and falls back to index for SPA routes without changing API misses', async () => {
    const staticDir = await createBuiltStaticDir()
    const state = new RuntimeAppState(createConfig())
    const server = startRuntimeAppServer(state, { staticDir })
    servers.push(server)

    const baseUrl = `http://${server.hostname}:${server.port}`
    const jsResponse = await fetch(`${baseUrl}/assets/app.js`)
    const cssResponse = await fetch(`${baseUrl}/assets/app.css`)
    const fallbackResponse = await fetch(`${baseUrl}/projects/alpha`)
    const missingApiResponse = await fetch(`${baseUrl}/api/not-found`)

    expect(jsResponse.status).toBe(200)
    expect(jsResponse.headers.get('content-type')).toBe('application/javascript; charset=utf-8')
    expect(await jsResponse.text()).toContain('operator-ui')

    expect(cssResponse.status).toBe(200)
    expect(cssResponse.headers.get('content-type')).toBe('text/css; charset=utf-8')
    expect(await cssResponse.text()).toContain('color')

    expect(fallbackResponse.status).toBe(200)
    expect(fallbackResponse.headers.get('content-type')).toBe('text/html; charset=utf-8')
    expect(await fallbackResponse.text()).toContain('AgentAI 01 Built UI')

    expect(missingApiResponse.status).toBe(404)
    expect(missingApiResponse.headers.get('content-type')).toBe('application/json; charset=utf-8')
    expect(await missingApiResponse.json()).toMatchObject({ ok: false, message: 'Route not found: /api/not-found' })
  })

  test('returns build instructions when operator UI dist index is missing', async () => {
    const staticDir = await createEmptyStaticDir()
    const state = new RuntimeAppState(createConfig())
    const server = startRuntimeAppServer(state, { staticDir })
    servers.push(server)

    const baseUrl = `http://${server.hostname}:${server.port}`
    const response = await fetch(`${baseUrl}/`)
    const body = await response.text()

    expect(response.status).toBe(503)
    expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8')
    expect(body).toContain('npm run ui:build')
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

async function createEmptyStaticDir(): Promise<string> {
  const tempDir = await mkdtemp(join(tmpdir(), 'agentai-runtime-ui-'))
  tempDirs.push(tempDir)
  return tempDir
}

async function createBuiltStaticDir(): Promise<string> {
  const tempDir = await createEmptyStaticDir()
  await mkdir(join(tempDir, 'assets'))
  await writeFile(
    join(tempDir, 'index.html'),
    '<!doctype html><html><head><title>AgentAI 01 Built UI</title><script type="module" src="./assets/app.js"></script><link rel="stylesheet" href="./assets/app.css"></head><body><agent-runtime-shell></agent-runtime-shell></body></html>',
    'utf8',
  )
  await writeFile(join(tempDir, 'assets', 'app.js'), 'console.log("operator-ui")', 'utf8')
  await writeFile(join(tempDir, 'assets', 'app.css'), 'body { color: white; }', 'utf8')
  return tempDir
}
