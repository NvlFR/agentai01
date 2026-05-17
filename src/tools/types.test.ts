import { describe, expect, it } from 'bun:test'

import {
  TOOL_AVAILABILITY_SIGNAL_KINDS,
  TOOL_ERROR_CODES,
  TOOL_EXECUTOR_KINDS,
  TOOL_OWNER_KINDS,
  isToolAvailabilitySignalKind,
  isToolErrorCode,
  isToolExecutorKind,
  isToolOwnerKind,
} from './types.js'

describe('tool type runtime helpers', () => {
  it('exports stable tool catalogs', () => {
    expect(TOOL_OWNER_KINDS).toEqual(['core', 'plugin', 'channel', 'mcp'])
    expect(TOOL_EXECUTOR_KINDS).toEqual(['core', 'plugin', 'channel', 'mcp'])
    expect(TOOL_AVAILABILITY_SIGNAL_KINDS).toEqual(['always', 'auth', 'env', 'plugin-enabled', 'context', 'config'])
    expect(TOOL_ERROR_CODES).toEqual(['availability_failed', 'execution_failed', 'invalid_input', 'not_found', 'timeout'])
  })

  it('narrows tool enum-like values', () => {
    expect(isToolOwnerKind('plugin')).toBe(true)
    expect(isToolOwnerKind('agent')).toBe(false)
    expect(isToolExecutorKind('channel')).toBe(true)
    expect(isToolExecutorKind('worker')).toBe(false)
    expect(isToolAvailabilitySignalKind('context')).toBe(true)
    expect(isToolAvailabilitySignalKind('secret')).toBe(false)
    expect(isToolErrorCode('timeout')).toBe(true)
    expect(isToolErrorCode('bad_request')).toBe(false)
  })
})
