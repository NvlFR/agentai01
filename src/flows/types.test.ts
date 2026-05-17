import { describe, expect, it } from 'bun:test'

import {
  FLOW_STATUSES,
  FLOW_STEP_STATUSES,
  isFlowStatus,
  isFlowStepStatus,
} from './types.js'

describe('flow type runtime helpers', () => {
  it('exports stable flow status catalogs', () => {
    expect(FLOW_STEP_STATUSES).toEqual(['pending', 'running', 'succeeded', 'failed', 'skipped'])
    expect(FLOW_STATUSES).toEqual(['pending', 'running', 'succeeded', 'failed', 'recovering'])
  })

  it('narrows step and run statuses', () => {
    expect(isFlowStepStatus('running')).toBe(true)
    expect(isFlowStepStatus('queued')).toBe(false)
    expect(isFlowStatus('recovering')).toBe(true)
    expect(isFlowStatus(null)).toBe(false)
  })
})
