import { describe, expect, it } from 'bun:test'

import { isValidAgentMessage } from '../src/domain/types.js'
import { createTestConfig, createTestMessage } from './helpers/index.js'
import { createMockProvider, createMockSecrets, createMockStorage } from './mocks/index.js'

describe('shared test infrastructure', () => {
  it('createTestConfig returns a valid runtime app config without reading host env', () => {
    const config = createTestConfig()

    expect(config.env).toBe('test')
    expect(config.operatorToken).toBe('test-operator-token')
    expect(config.ai.apiKey).toBe('test-ai-api-key')
    expect(config.readiness.ready).toBe(true)
  })

  it('createTestMessage returns a valid Agent_Message without arguments', () => {
    const message = createTestMessage()

    expect(isValidAgentMessage(message)).toBe(true)
    expect(message.message_type).toBe('status_update')
  })

  it('provides deterministic mocks for provider, storage, and secrets', async () => {
    const provider = createMockProvider({
      content: 'Deterministic output',
    })
    const storage = createMockStorage()
    const secrets = createMockSecrets({
      OPERATOR_TOKEN: 'test-operator-token',
    })

    const response = await provider.generateText({
      messages: [{ role: 'user', content: 'ping' }],
    })
    storage.write('artifacts/output.txt', response.content)

    expect(response.content).toBe('Deterministic output')
    expect(storage.read('artifacts/output.txt')).toBe('Deterministic output')
    expect(secrets.getOperatorToken()).toEqual({
      ok: true,
      key: 'OPERATOR_TOKEN',
      value: 'test-operator-token',
    })
  })
})
