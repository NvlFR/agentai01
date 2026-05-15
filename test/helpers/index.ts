import { isValidAgentMessage, type Agent_Message } from '../../src/domain/types.js'
import type { RuntimeAppConfig } from '../../src/runtime-app/config/index.js'
import {
  sampleAgentMessage,
  sampleRuntimeAppConfig,
} from '../fixtures/index.js'

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends readonly (infer U)[]
    ? readonly U[]
    : T[K] extends Array<infer U>
      ? U[]
      : T[K] extends object
        ? DeepPartial<T[K]>
        : T[K]
}

export function createTestConfig(
  overrides: DeepPartial<RuntimeAppConfig> = {},
): RuntimeAppConfig {
  return {
    ...sampleRuntimeAppConfig,
    ...overrides,
    ai: {
      ...sampleRuntimeAppConfig.ai,
      ...overrides.ai,
    },
    storage: {
      ...sampleRuntimeAppConfig.storage,
      ...overrides.storage,
    },
    queue: {
      ...sampleRuntimeAppConfig.queue,
      ...overrides.queue,
    },
    readiness: {
      ...sampleRuntimeAppConfig.readiness,
      ...overrides.readiness,
    },
    allowedChatIds: overrides.allowedChatIds
      ? [...overrides.allowedChatIds]
      : [...sampleRuntimeAppConfig.allowedChatIds],
  }
}

export function createTestMessage<P extends Record<string, unknown>>(
  overrides: Partial<Agent_Message<P>> = {},
): Agent_Message<P> {
  const message = {
    ...sampleAgentMessage,
    ...overrides,
    payload: {
      ...sampleAgentMessage.payload,
      ...(overrides.payload ?? {}),
    },
  } as Agent_Message<P>

  if (!isValidAgentMessage(message)) {
    throw new Error('createTestMessage must produce a valid Agent_Message.')
  }

  return message
}

export function assertStructuredLogEntry(
  entry: { timestamp?: unknown; level?: unknown; message?: unknown },
): void {
  if (typeof entry.timestamp !== 'string' || typeof entry.level !== 'string' || typeof entry.message !== 'string') {
    throw new Error('Expected a structured log entry with timestamp, level, and message.')
  }
}
