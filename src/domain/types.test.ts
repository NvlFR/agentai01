/**
 * Unit tests for the Cross-Agent Domain Model (src/domain/types.ts)
 *
 * Covers:
 * - Lifecycle_State completeness
 * - LIFECYCLE_TRANSITIONS validity
 * - isValidTransition() and getValidNextStates()
 * - Approval_Gate, Approval_Request, Approval_Response shapes
 * - Project namespace helpers: buildProjectNamespace, parseProjectNamespace, isWithinProjectContext
 * - isValidAgentMessage() validation
 */

import { describe, expect, it } from 'bun:test'
import {
  LIFECYCLE_STATES,
  LIFECYCLE_TRANSITIONS,
  type Lifecycle_State,
  buildProjectNamespace,
  getValidNextStates,
  isValidAgentMessage,
  isValidTransition,
  isWithinProjectContext,
  parseProjectNamespace,
  type Approval_Gate,
  type Approval_Request,
  type Approval_Response,
  type Agent_Message,
  APPROVAL_GATE_LABELS,
  PROJECT_ISOLATION_RULES,
} from './types.js'

// ---------------------------------------------------------------------------
// 1. Lifecycle_State
// ---------------------------------------------------------------------------

describe('LIFECYCLE_STATES', () => {
  it('contains all 10 required states', () => {
    const required: Lifecycle_State[] = [
      'lead',
      'qualified',
      'proposal',
      'won',
      'discovery',
      'implementation',
      'qa',
      'delivered',
      'support',
      'closed',
    ]
    for (const state of required) {
      expect(LIFECYCLE_STATES).toContain(state)
    }
    expect(LIFECYCLE_STATES).toHaveLength(10)
  })

  it('starts with lead and ends with closed', () => {
    expect(LIFECYCLE_STATES[0]).toBe('lead')
    expect(LIFECYCLE_STATES[LIFECYCLE_STATES.length - 1]).toBe('closed')
  })
})

// ---------------------------------------------------------------------------
// 2. Lifecycle Transition Mapping
// ---------------------------------------------------------------------------

describe('LIFECYCLE_TRANSITIONS', () => {
  it('covers the full linear pipeline', () => {
    const linearPath: Array<[Lifecycle_State, Lifecycle_State]> = [
      ['lead', 'qualified'],
      ['qualified', 'proposal'],
      ['proposal', 'won'],
      ['won', 'discovery'],
      ['discovery', 'implementation'],
      ['implementation', 'qa'],
      ['qa', 'delivered'],
      ['delivered', 'support'],
      ['support', 'closed'],
    ]
    for (const [from, to] of linearPath) {
      const found = LIFECYCLE_TRANSITIONS.some(t => t.from === from && t.to === to)
      expect(found).toBe(true)
    }
  })

  it('allows direct close from delivered (no support needed)', () => {
    const found = LIFECYCLE_TRANSITIONS.some(
      t => t.from === 'delivered' && t.to === 'closed',
    )
    expect(found).toBe(true)
  })

  it('every transition has a primaryOwner', () => {
    for (const t of LIFECYCLE_TRANSITIONS) {
      expect(typeof t.primaryOwner).toBe('string')
      expect(t.primaryOwner.length).toBeGreaterThan(0)
    }
  })
})

// ---------------------------------------------------------------------------
// 3. isValidTransition
// ---------------------------------------------------------------------------

describe('isValidTransition', () => {
  it('returns true for valid sequential transitions', () => {
    expect(isValidTransition('lead', 'qualified')).toBe(true)
    expect(isValidTransition('qualified', 'proposal')).toBe(true)
    expect(isValidTransition('proposal', 'won')).toBe(true)
    expect(isValidTransition('won', 'discovery')).toBe(true)
    expect(isValidTransition('discovery', 'implementation')).toBe(true)
    expect(isValidTransition('implementation', 'qa')).toBe(true)
    expect(isValidTransition('qa', 'delivered')).toBe(true)
    expect(isValidTransition('delivered', 'support')).toBe(true)
    expect(isValidTransition('support', 'closed')).toBe(true)
    expect(isValidTransition('delivered', 'closed')).toBe(true)
  })

  it('returns false for illegal skips', () => {
    expect(isValidTransition('lead', 'delivered')).toBe(false)
    expect(isValidTransition('lead', 'implementation')).toBe(false)
    expect(isValidTransition('proposal', 'discovery')).toBe(false)
    expect(isValidTransition('qa', 'support')).toBe(false)
  })

  it('returns false for backward transitions', () => {
    expect(isValidTransition('qualified', 'lead')).toBe(false)
    expect(isValidTransition('delivered', 'qa')).toBe(false)
    expect(isValidTransition('closed', 'support')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// 4. getValidNextStates
// ---------------------------------------------------------------------------

describe('getValidNextStates', () => {
  it('returns [qualified] for lead', () => {
    // lead → lead (lead_created self-loop) and lead → qualified
    const next = getValidNextStates('lead')
    expect(next).toContain('qualified')
  })

  it('returns [support, closed] for delivered', () => {
    const next = getValidNextStates('delivered')
    expect(next).toContain('support')
    expect(next).toContain('closed')
  })

  it('returns [] for closed (terminal state)', () => {
    const next = getValidNextStates('closed')
    expect(next).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// 5. Approval Gate Models
// ---------------------------------------------------------------------------

describe('Approval_Gate', () => {
  it('APPROVAL_GATE_LABELS covers all four gates', () => {
    const gates: Approval_Gate[] = [
      'proposal_final',
      'spec_final',
      'delivery_final',
      'strategic_decision',
    ]
    for (const gate of gates) {
      expect(APPROVAL_GATE_LABELS[gate]).toBeTruthy()
    }
  })
})

describe('Approval_Request shape', () => {
  it('accepts a valid approval request object', () => {
    const req: Approval_Request = {
      request_id: 'req-001',
      gate: 'proposal_final',
      from_agent: 'sales_agent',
      timestamp: '2026-05-14T09:00:00Z',
      project_id: 'proj-123',
      summary: 'Proposal for Acme Corp ready for review',
      recommendation: 'Approve — scope and pricing are aligned with client expectations',
      risks: ['Client may request scope reduction', 'Timeline is aggressive'],
      options: ['approve', 'reject', 'revise'],
      artifact_ref: 'projects/acme/proj-123/proposal-v2.pdf',
    }
    // TypeScript compile-time check — if this compiles, the shape is correct
    expect(req.gate).toBe('proposal_final')
    expect(req.options).toContain('approve')
  })
})

describe('Approval_Response shape', () => {
  it('accepts a valid approval response object', () => {
    const res: Approval_Response = {
      request_id: 'req-001',
      gate: 'proposal_final',
      timestamp: '2026-05-14T10:00:00Z',
      decision: 'approve',
    }
    expect(res.decision).toBe('approve')
  })

  it('accepts a revise response with notes', () => {
    const res: Approval_Response = {
      request_id: 'req-002',
      gate: 'spec_final',
      timestamp: '2026-05-14T11:00:00Z',
      decision: 'revise',
      notes: 'Please add more detail to the authentication section',
    }
    expect(res.decision).toBe('revise')
    expect(res.notes).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// 6. Project Namespace Helpers
// ---------------------------------------------------------------------------

describe('buildProjectNamespace', () => {
  it('builds the correct namespace path', () => {
    expect(buildProjectNamespace('acme-corp', 'proj-001')).toBe(
      'projects/acme-corp/proj-001/',
    )
  })

  it('handles IDs with hyphens and numbers', () => {
    expect(buildProjectNamespace('client-123', 'p-456-abc')).toBe(
      'projects/client-123/p-456-abc/',
    )
  })
})

describe('parseProjectNamespace', () => {
  it('parses a valid namespace path', () => {
    const result = parseProjectNamespace('projects/acme-corp/proj-001/')
    expect(result).toEqual({ clientId: 'acme-corp', projectId: 'proj-001' })
  })

  it('parses a path without trailing slash', () => {
    const result = parseProjectNamespace('projects/acme-corp/proj-001')
    expect(result).toEqual({ clientId: 'acme-corp', projectId: 'proj-001' })
  })

  it('returns null for invalid paths', () => {
    expect(parseProjectNamespace('invalid/path')).toBeNull()
    expect(parseProjectNamespace('projects/only-client/')).toBeNull()
    expect(parseProjectNamespace('')).toBeNull()
  })
})

describe('isWithinProjectContext', () => {
  it('returns true for artifacts within the project namespace', () => {
    expect(
      isWithinProjectContext(
        'projects/acme/proj-001/spec.md',
        'acme',
        'proj-001',
      ),
    ).toBe(true)

    expect(
      isWithinProjectContext(
        'projects/acme/proj-001/src/main.ts',
        'acme',
        'proj-001',
      ),
    ).toBe(true)
  })

  it('returns false for artifacts in a different project', () => {
    expect(
      isWithinProjectContext(
        'projects/other/proj-999/spec.md',
        'acme',
        'proj-001',
      ),
    ).toBe(false)
  })

  it('returns false for artifacts in a different client namespace', () => {
    expect(
      isWithinProjectContext(
        'projects/rival-corp/proj-001/spec.md',
        'acme',
        'proj-001',
      ),
    ).toBe(false)
  })

  it('returns false for paths outside the projects/ root', () => {
    expect(
      isWithinProjectContext('tmp/spec.md', 'acme', 'proj-001'),
    ).toBe(false)
  })
})

describe('PROJECT_ISOLATION_RULES', () => {
  it('all isolation rules are enabled (true)', () => {
    expect(PROJECT_ISOLATION_RULES.AGENT_SCOPED_TO_ACTIVE_PROJECT).toBe(true)
    expect(PROJECT_ISOLATION_RULES.REGISTRY_VALIDATES_ACCESS).toBe(true)
    expect(PROJECT_ISOLATION_RULES.NO_CREDENTIALS_IN_ARTIFACTS).toBe(true)
    expect(PROJECT_ISOLATION_RULES.DASHBOARD_AGGREGATION_ONLY).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 7. isValidAgentMessage
// ---------------------------------------------------------------------------

describe('isValidAgentMessage', () => {
  const validMsg: Agent_Message = {
    from: 'sales_agent',
    to: 'product_agent',
    message_type: 'lead_handoff',
    project_id: 'proj-123',
    timestamp: '2026-05-14T09:30:00Z',
    payload: { lead_id: 'lead-456' },
  }

  it('returns true for a valid message', () => {
    expect(isValidAgentMessage(validMsg)).toBe(true)
  })

  it('returns false when from is missing', () => {
    const { from: _from, ...rest } = validMsg
    expect(isValidAgentMessage(rest)).toBe(false)
  })

  it('returns false when to is missing', () => {
    const { to: _to, ...rest } = validMsg
    expect(isValidAgentMessage(rest)).toBe(false)
  })

  it('returns false when message_type is missing', () => {
    const { message_type: _mt, ...rest } = validMsg
    expect(isValidAgentMessage(rest)).toBe(false)
  })

  it('returns false when project_id is missing', () => {
    const { project_id: _pid, ...rest } = validMsg
    expect(isValidAgentMessage(rest)).toBe(false)
  })

  it('returns false when timestamp is missing', () => {
    const { timestamp: _ts, ...rest } = validMsg
    expect(isValidAgentMessage(rest)).toBe(false)
  })

  it('returns false when payload is missing', () => {
    const { payload: _p, ...rest } = validMsg
    expect(isValidAgentMessage(rest)).toBe(false)
  })

  it('returns false for null', () => {
    expect(isValidAgentMessage(null)).toBe(false)
  })

  it('returns false for non-object values', () => {
    expect(isValidAgentMessage('string')).toBe(false)
    expect(isValidAgentMessage(42)).toBe(false)
    expect(isValidAgentMessage(undefined)).toBe(false)
  })
})
