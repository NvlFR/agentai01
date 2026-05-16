import { describe, expect, it } from 'bun:test'

import {
  canHandleCapability,
  createDelegationRequest,
  validateAgentContext,
} from './runtime-contracts.js'

describe('agent runtime contracts', () => {
  it('creates attributable delegation requests', () => {
    const request = createDelegationRequest({
      from_agent_id: 'ceo',
      to_agent_id: 'engineering',
      capability: 'implementation',
      payload: { ticket: 'T-1' },
    })

    expect(request.delegation_id).toStartWith('delegation-')
    expect(request).toMatchObject({
      from_agent_id: 'ceo',
      to_agent_id: 'engineering',
      capability: 'implementation',
    })
  })

  it('validates context and capability checks without hardcoded agents', () => {
    expect(canHandleCapability({ capabilities: ['support'] }, 'support')).toBe(true)
    expect(validateAgentContext({ agent_id: '' })).toEqual({
      ok: false,
      error: ['agent_id is required'],
    })
  })
})
