import { describe, expect, it } from 'bun:test'
import { RuntimeAppState } from './state.js'
import type { RuntimeAppConfig } from './config/index.js'
import {
  renderApprovalsList,
  renderDraftList,
  renderLiveOperationsPane,
  renderLiveOperationsPaneTab,
  renderOperatorHistory,
  renderRuntimeAgentDetail,
  renderRuntimeAgentsList,
  renderSnapshotSummary,
  renderSubAgentDetail,
  summarizeDepartments,
} from './tui-helpers.js'
import { SubAgentRegistry } from '../registry/subAgentRegistry.js'
import { registerAllSubAgentDepartments } from '../agents/subagents/index.js'

function makeConfig(): RuntimeAppConfig {
  return {
    env: 'test',
    host: '127.0.0.1',
    port: 0,
    baseUrl: 'http://127.0.0.1',
    runtimeId: 'runtime-test',
    operatorToken: 'token',
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
      databaseUrl: null,
      artifactsRoot: 'runtime/test/artifacts',
      operationalRoot: 'runtime/test/operational',
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

describe('runtime app tui helpers', () => {
  it('renders dashboard summary from snapshot', () => {
    const state = new RuntimeAppState(makeConfig())
    const summary = renderSnapshotSummary(state.getSnapshot('2026-05-18T10:00:00.000Z'))
    expect(summary).toContain('Runtime')
    expect(summary).toContain('Projects')
    expect(summary).toContain('AI Model')
  })

  it('summarizes registered departments', () => {
    const registry = new SubAgentRegistry()
    registerAllSubAgentDepartments(registry)

    const summaries = summarizeDepartments(registry)
    expect(summaries.length).toBeGreaterThan(0)
    expect(summaries.some(item => item.departmentName === 'marketing')).toBe(true)
    expect(summaries.some(item => item.headCount >= 1)).toBe(true)
  })

  it('renders draft list with empty and populated states', () => {
    expect(renderDraftList([])).toContain('Belum ada draft')
    expect(
      renderDraftList([
        {
          agentType: 'incident-scribe',
          whenToUse: 'Use this agent when incidents happen.',
          systemPrompt: 'You are an incident scribe.',
          location: 'runtime',
          method: 'manual',
          savedAt: '2026-05-18T10:00:00.000Z',
          markdownPath: '/tmp/incident-scribe.md',
        },
      ]),
    ).toContain('incident-scribe')
  })

  it('renders agent and live pane details', () => {
    const state = new RuntimeAppState(makeConfig())
    const snapshot = state.getSnapshot('2026-05-18T10:00:00.000Z')
    const agent = state.shell.app.getRegistry().listAgents()[0]!
    const registry = new SubAgentRegistry()
    registerAllSubAgentDepartments(registry)
    const subAgent = registry.listAll()[0]!

    expect(renderRuntimeAgentsList([agent])).toContain(agent.agent_id)
    expect(renderRuntimeAgentDetail(agent)).toContain(agent.agent_type)
    expect(renderSubAgentDetail(subAgent)).toContain(subAgent.agentId)
    expect(renderApprovalsList(snapshot)).toContain('apr-')
    expect(renderLiveOperationsPane(snapshot)).toContain('Recent Messages')
    expect(renderLiveOperationsPaneTab(snapshot, 'jobs')).toContain('[jobs]')
    expect(
      renderOperatorHistory([
        {
          at: '2026-05-18T11:00:00.000Z',
          input: 'status',
          mode: 'natural',
          ok: true,
          requiresConfirmation: false,
          response: 'All systems ready.',
        },
      ]),
    ).toContain('status')
  })
})
