import { describe, expect, it } from 'bun:test'

import {
  TASK_REGISTRY_ERROR_CODES,
  TASK_RESULT_STATUSES,
  TASK_STATES,
  isTaskRegistryErrorCode,
  isTaskResultStatus,
  isTaskState,
} from './types.js'

describe('task type runtime helpers', () => {
  it('exports task catalogs used by the runtime', () => {
    expect(TASK_STATES).toEqual(['pending', 'ready', 'running', 'succeeded', 'failed', 'blocked', 'cancelled'])
    expect(TASK_RESULT_STATUSES).toEqual(['succeeded', 'failed', 'cancelled'])
    expect(TASK_REGISTRY_ERROR_CODES).toEqual([
      'cycle',
      'duplicate',
      'invalid-transition',
      'missing-dependency',
      'not-found',
    ])
  })

  it('narrows task enum-like values', () => {
    expect(isTaskState('blocked')).toBe(true)
    expect(isTaskState('paused')).toBe(false)
    expect(isTaskResultStatus('failed')).toBe(true)
    expect(isTaskResultStatus('ready')).toBe(false)
    expect(isTaskRegistryErrorCode('duplicate')).toBe(true)
    expect(isTaskRegistryErrorCode('timeout')).toBe(false)
  })
})
