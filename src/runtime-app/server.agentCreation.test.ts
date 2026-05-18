import { afterEach, describe, expect, it } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { RuntimeAppState } from './state.js'
import { startRuntimeAppServer } from './server.js'
import type { RuntimeAppConfig } from './config/index.js'

const tempDirs: string[] = []

afterEach(async () => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop()
    if (dir) {
      await rm(dir, { recursive: true, force: true })
    }
  }
})

async function makeTempDir() {
  const dir = await mkdtemp(path.join(tmpdir(), 'runtime-server-agent-'))
  tempDirs.push(dir)
  return dir
}

function makeConfig(root: string): RuntimeAppConfig {
  return {
    env: 'test',
    host: '127.0.0.1',
    port: 0,
    baseUrl: 'http://127.0.0.1',
    runtimeId: 'runtime-test',
    operatorToken: 'token-test',
    telegramToken: null,
    allowedChatIds: [],
    ai: {
      baseUrl: 'http://127.0.0.1:8045/v1',
      apiKey: null,
      model: 'gpt-4.1-mini',
      timeoutMs: 5_000,
      retryLimit: 0,
      logLatency: false,
    },
    storage: {
      mode: 'memory',
      artifactsRoot: path.join(root, 'artifacts'),
      operationalRoot: path.join(root, 'operational'),
    },
    queue: {
      concurrency: 1,
      retryLimit: 1,
    },
    readiness: {
      ready: false,
      reasons: ['AI_API_KEY is not set.'],
      checklist: [],
    },
  }
}

describe('runtime app agent creation routes', () => {
  it('serves schema and persists validated drafts', async () => {
    const root = await makeTempDir()
    const uniqueAgentType = `incident-scribe-${path.basename(root).slice(-6).toLowerCase()}`
    const server = startRuntimeAppServer(new RuntimeAppState(makeConfig(root)))
    const baseUrl = `http://${server.hostname}:${server.port}`

    try {
      const schemaResponse = await fetch(`${baseUrl}/api/agents/wizard/schema`)
      const schemaPayload = await schemaResponse.json() as any
      expect(schemaResponse.status).toBe(200)
      expect(schemaPayload.data.steps.map((step: { id: string }) => step.id)).toContain('confirm')

      const draft = {
        location: 'runtime',
        method: 'manual',
        agentType: uniqueAgentType,
        whenToUse: 'Use this agent when the team needs a concise incident timeline and postmortem notes.',
        systemPrompt:
          'You are an incident scribe. Capture the timeline, decisions, impact, and follow-up actions with strong factual discipline.',
        selectedTools: ['slack', 'notion'],
      }

      const validateResponse = await fetch(`${baseUrl}/api/agents/wizard/validate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ draft }),
      })
      const validatePayload = await validateResponse.json() as any
      expect(validateResponse.status).toBe(200)
      expect(validatePayload.result.isValid).toBe(true)

      const saveResponse = await fetch(`${baseUrl}/api/agents/wizard/save`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ draft }),
      })
      const savePayload = await saveResponse.json() as any
      expect(saveResponse.status).toBe(201)
      expect(savePayload.artifact.agentType).toBe(uniqueAgentType)

      const listResponse = await fetch(`${baseUrl}/api/agents/drafts?location=runtime`)
      const listPayload = await listResponse.json() as any
      expect(listPayload.items).toHaveLength(1)
      expect(listPayload.items[0]?.agentType).toBe(uniqueAgentType)
    } finally {
      server.stop(true)
    }
  })
})
