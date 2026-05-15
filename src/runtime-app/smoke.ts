import { startRuntimeAppServer } from './server.js'
import { loadRuntimeAppConfig, type RuntimeAppConfig } from './config.js'
import {
  createOpenAICompatibleProvider,
  type ProviderLogEntry,
} from './providers/openaiCompatibleProvider.js'
import { RuntimeAppState } from './state.js'
import { createRuntimeOperationalApp } from './orchestration/runtimeApp.js'
import {
  runLeadIntakeToDeliveredScenario,
  runOwnerDirectiveToDashboardScenario,
} from './scenarios/e2e.js'
import { createFileRuntimePersistence } from './storage/fileRuntimeStorage.js'

const config = loadRuntimeAppConfig({
  requireProvider: true,
})
const providerLogs: ProviderLogEntry[] = []
const provider = createOpenAICompatibleProvider({
  baseURL: config.ai.baseUrl,
  apiKey: config.ai.apiKey ?? '',
  model: config.ai.model,
  timeoutMs: config.ai.timeoutMs,
  retryLimit: config.ai.retryLimit,
  logger: entry => providerLogs.push(entry),
})

const persistence = createFileRuntimePersistence({
  operationalRoot: config.storage.operationalRoot,
  artifactRoot: config.storage.artifactsRoot,
})
await persistence.ensureReady()

const runtimeApp = createRuntimeOperationalApp({
  now: '2026-05-14T09:00:00Z',
  workspaceBaseDir: config.storage.artifactsRoot,
})
const ownerDirective = await runOwnerDirectiveToDashboardScenario(
  runtimeApp,
  '2026-05-14T09:00:00Z',
)
const leadDashboard = await runLeadIntakeToDeliveredScenario(
  runtimeApp,
  '2026-05-14T10:00:00Z',
)

const providerResult = await provider.generateText({
  messages: [{ role: 'user', content: 'Reply exactly with: runtime provider ok' }],
  temperature: 0,
  maxTokens: 32,
})

const appConfig: RuntimeAppConfig = {
  ...config,
  host: '127.0.0.1',
  port: 0,
  baseUrl: 'http://127.0.0.1',
  readiness: {
    ready: true,
    reasons: [],
    checklist: ['provider smoke ok', 'scenario completed'],
  },
}

const state = new RuntimeAppState(appConfig)
const server = startRuntimeAppServer(state)
const baseUrl = `http://${server.hostname}:${server.port}`

const health = await fetch(`${baseUrl}/health`).then(response => response.json())
const readyResponse = await fetch(`${baseUrl}/ready`)
const ready = await readyResponse.json()
const dashboard = await fetch(`${baseUrl}/api/dashboard`).then(response => response.json())

server.stop(true)

const summary = {
  timestamp: new Date().toISOString(),
  provider: {
    content: providerResult.content,
    attempts: providerResult.attempts,
    latencyMs: providerResult.latencyMs,
    logs: providerLogs,
  },
  http: {
    healthOk: health.data.ok,
    readyStatusCode: readyResponse.status,
    ready: ready.data.readiness.ready,
    projects: dashboard.data.projects.length,
  },
  scenario: {
    ownerDirective: ownerDirective.directiveResponse,
    deliveredProject: leadDashboard.projects.find(
      project => project.project_id === 'proj-acme-runtime',
    )?.lifecycle_state,
    pendingApprovals: leadDashboard.approvals.pending_count,
    communicationEvents: runtimeApp.events.map(event => event.kind),
    totalProjects: leadDashboard.pipeline.total_projects,
    recoveryStatePath: '',
  },
}

const persistedStatePath = await persistence.operational.saveRuntimeState({
  runtimeId: config.runtimeId,
  savedAt: summary.timestamp,
  state: summary,
})
summary.scenario.recoveryStatePath = persistedStatePath

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)
