import { describe, expect, it } from 'bun:test'
import type { Approval_Response } from '../../domain/types.js'
import { AgentRegistry } from '../../registry/AgentRegistry.js'
import { ProductRuntime } from './runtime.js'

function makeCompleteHandoff() {
  return {
    from: 'sales_agent' as const,
    to: 'product_agent' as const,
    message_type: 'lead_handoff' as const,
    project_id: 'proj-product-1',
    timestamp: '2026-05-14T10:00:00Z',
    payload: {
      business_summary: 'Build an AI intake and delivery assistant for enterprise leads.',
      stakeholders: ['CEO', 'Head of Operations'],
      last_proposal_ref: 'projects/acme/proj-product-1/proposal-v1.md',
      initial_scope: ['Lead intake', 'Discovery workspace', 'Spec approval flow'],
      commercial_assumptions: ['Timeline assumes one stakeholder review cycle.'],
      initial_risks: ['CRM API contract may still change.'],
      conversation_notes: ['Public launch is planned after internal pilot.'],
    },
  }
}

describe('product-agent lead handoff validation', () => {
  it('accepts complete handoff and starts discovery', () => {
    const registry = new AgentRegistry()
    const runtime = new ProductRuntime(registry)

    const result = runtime.receiveLeadHandoff('acme', makeCompleteHandoff())

    expect(result.accepted).toBe(true)
    expect(result.state.lifecycle_state).toBe('discovery')
    expect(result.state.discovery_status).toBe('discovery_in_progress')
    expect(result.outgoing[0]?.message_type).toBe('status_update')
    expect(result.state.artifacts[`${result.state.namespace}clarification-log.json`]).toContain('tujuan bisnis utama')
  })

  it('rejects incomplete handoff and asks for clarification', () => {
    const runtime = new ProductRuntime()
    const handoff = makeCompleteHandoff()
    const incomplete = {
      ...handoff,
      payload: {
        ...handoff.payload,
        initial_scope: undefined,
        commercial_assumptions: undefined,
      },
    }

    const result = runtime.receiveLeadHandoff('acme', incomplete)

    expect(result.accepted).toBe(false)
    expect(result.state.discovery_status).toBe('awaiting_clarification')
    expect(result.outgoing[0]?.message_type).toBe('clarification_request')
    expect(result.outgoing[0]?.payload).toMatchObject({
      missing_fields: ['initial_scope', 'commercial_assumptions'],
    })
  })
})

describe('product-agent spec versioning and approvals', () => {
  it('creates a new spec version when owner requests revise', () => {
    const runtime = new ProductRuntime()
    runtime.receiveLeadHandoff('acme', makeCompleteHandoff())
    runtime.writeSpec({
      project_id: 'proj-product-1',
      timestamp: '2026-05-14T10:30:00Z',
    })

    const response: Approval_Response = {
      request_id: 'approval-1',
      gate: 'spec_final',
      timestamp: '2026-05-14T11:00:00Z',
      decision: 'revise',
      notes: 'Tambahkan batasan teknis yang lebih jelas.',
    }

    const state = runtime.recordApprovalResponse({
      project_id: 'proj-product-1',
      response,
    })

    expect(state.spec_version).toBe(2)
    expect(state.spec_history.map(item => item.version)).toEqual([1, 2])
    expect(state.approval_history[0]?.response.decision).toBe('revise')
  })
})

describe('product-agent integration flows', () => {
  it('supports lead_handoff -> discovery -> approval_request', () => {
    const runtime = new ProductRuntime()
    runtime.receiveLeadHandoff('acme', makeCompleteHandoff())
    const spec = runtime.writeSpec({
      project_id: 'proj-product-1',
      timestamp: '2026-05-14T10:30:00Z',
    })

    const approval = runtime.requestApproval({
      project_id: 'proj-product-1',
      request_id: 'approval-2',
      timestamp: '2026-05-14T11:00:00Z',
      recommendation: 'Approve MVP spec.',
    })

    expect(spec.artifact_ref).toBe('projects/acme/proj-product-1/spec-v1.md')
    expect(approval.approval.gate).toBe('spec_final')
    expect(approval.outgoing[0]?.payload).toMatchObject({
      status: 'approval_pending',
      version: 1,
    })
  })

  it('supports approval approve -> discovery_handoff -> acknowledgment', () => {
    const runtime = new ProductRuntime()
    runtime.receiveLeadHandoff('acme', makeCompleteHandoff())
    runtime.writeSpec({
      project_id: 'proj-product-1',
      timestamp: '2026-05-14T10:30:00Z',
    })
    runtime.recordApprovalResponse({
      project_id: 'proj-product-1',
      response: {
        request_id: 'approval-3',
        gate: 'spec_final',
        timestamp: '2026-05-14T11:00:00Z',
        decision: 'approve',
      },
    })

    const handoff = runtime.createDiscoveryHandoff({
      project_id: 'proj-product-1',
      timestamp: '2026-05-14T11:15:00Z',
    })
    const finalState = runtime.acknowledgeEngineeringHandoff({
      project_id: 'proj-product-1',
      timestamp: '2026-05-14T11:30:00Z',
    })

    expect(handoff.handoff.message_type).toBe('discovery_handoff')
    expect(finalState.handoff_status).toBe('handoff_completed')
    expect(finalState.lifecycle_state).toBe('implementation')
    expect(finalState.discovery_status).toBe('ready_for_implementation')
  })

  it('does not advance to implementation without approval and acknowledgment', () => {
    const runtime = new ProductRuntime()
    runtime.receiveLeadHandoff('acme', makeCompleteHandoff())
    runtime.writeSpec({
      project_id: 'proj-product-1',
      timestamp: '2026-05-14T10:30:00Z',
    })

    expect(() =>
      runtime.createDiscoveryHandoff({
        project_id: 'proj-product-1',
        timestamp: '2026-05-14T11:00:00Z',
      }),
    ).toThrow('before owner approval')

    const state = runtime.getProjectState('proj-product-1')
    expect(state?.lifecycle_state).toBe('discovery')
  })

  it('exposes minimal tool metadata with buildTool style fields', () => {
    const runtime = new ProductRuntime()
    const tools = runtime.listTools()

    expect(tools.map(tool => tool.name)).toEqual([
      'brief_analyze',
      'document_read',
      'spec_write',
      'template_load',
      'message_send',
    ])
    expect(tools.every(tool => Array.isArray(tool.inputSchema))).toBe(true)
    expect(tools.every(tool => tool.checkPermissions({}) === true)).toBe(true)
  })
})
