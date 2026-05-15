import type { RuntimeAppConfig } from '../../src/runtime-app/config/index.js'

export const sampleRuntimeAppConfig: RuntimeAppConfig = {
  env: 'test',
  host: '127.0.0.1',
  port: 3100,
  baseUrl: 'http://127.0.0.1:3100',
  runtimeId: 'runtime-test',
  operatorToken: 'test-operator-token',
  telegramToken: 'test-telegram-token',
  allowedChatIds: ['12345'],
  ai: {
    baseUrl: 'http://127.0.0.1:8045/v1',
    apiKey: 'test-ai-api-key',
    model: 'gpt-4.1-mini',
    timeoutMs: 30_000,
    retryLimit: 1,
    logLatency: false,
  },
  storage: {
    mode: 'memory',
    artifactsRoot: '/tmp/agentai/runtime/test/artifacts',
    operationalRoot: '/tmp/agentai/runtime/test/operational',
  },
  queue: {
    concurrency: 1,
    retryLimit: 2,
  },
  readiness: {
    ready: true,
    reasons: [],
    checklist: ['AI_API_KEY is configured for provider calls.'],
  },
}
