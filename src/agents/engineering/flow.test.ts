import { describe, expect, it } from 'bun:test'
import { mkdtemp, readFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { AgentRegistry } from '../../registry/AgentRegistry.js'
import {
  acceptDiscoveryHandoff,
  buildClarificationRequest,
  buildDeliveryApprovalRequest,
  buildUnrecoverableErrorAlert,
  createEngineeringProjectState,
  handleApprovalResponse,
  markReadyForOwnerReview,
  startQaValidation,
  validateDiscoveryHandoffPayload,
  writeQaReport,
} from './flow.js'
import { deliverablePackageTool } from './tools.js'

function registerProjectContext(registry: AgentRegistry): void {
  registry.registerAgent({
    agent_id: 'eng-1',
    agent_type: 'engineering_agent',
    status: 'busy',
    current_project_id: 'proj-eng-1',
    last_activity_timestamp: '2026-05-14T10:00:00Z',
  })
  registry.registerAgent({
    agent_id: 'product-1',
    agent_type: 'product_agent',
    status: 'busy',
    current_project_id: 'proj-eng-1',
    last_activity_timestamp: '2026-05-14T10:00:00Z',
  })
  registry.registerAgent({
    agent_id: 'pm-1',
    agent_type: 'project_manager_agent',
    status: 'busy',
    current_project_id: 'proj-eng-1',
    last_activity_timestamp: '2026-05-14T10:00:00Z',
  })
  registry.registerAgent({
    agent_id: 'support-1',
    agent_type: 'support_agent',
    status: 'idle',
    current_project_id: 'proj-eng-1',
    last_activity_timestamp: '2026-05-14T10:00:00Z',
  })
  registry.registerAgent({
    agent_id: 'ceo-1',
    agent_type: 'ceo_agent',
    status: 'idle',
    current_project_id: 'proj-eng-1',
    last_activity_timestamp: '2026-05-14T10:00:00Z',
  })
  registry.registerProject({
    project_id: 'proj-eng-1',
    client_id: 'client-a',
    lifecycle_state: 'discovery',
    active_agent_ids: ['eng-1', 'product-1', 'pm-1'],
    current_milestone: 'spec_approval_pending',
    updated_at: '2026-05-14T10:00:00Z',
  })
}

function buildValidHandoffMessage() {
  return {
    from: 'product_agent' as const,
    to: 'engineering_agent' as const,
    message_type: 'discovery_handoff' as const,
    project_id: 'proj-eng-1',
    timestamp: '2026-05-14T10:15:00Z',
    payload: {
      spec_final: {
        title: 'Engineering Agent MVP',
        summary: 'Implement engineering orchestration, QA, delivery packaging, and audit flow.',
        capabilities: [
          {
            capability_id: 'cap-1',
            title: 'Handoff intake',
            description: 'Validate discovery handoff and create implementation plan.',
          },
          {
            capability_id: 'cap-2',
            title: 'QA and delivery',
            description: 'Run QA workflow and guard final delivery approval.',
          },
        ],
      },
      acceptance_criteria: [
        'Valid handoff moves project to implementation.',
        'Final delivery requires owner approval.',
      ],
      feature_priorities: ['Safe intake', 'Auditable QA', 'Versioned packaging'],
      tool_list: ['code_read', 'code_write', 'test_run', 'bash_exec', 'deliverable_package'],
      project_constraints: ['Stay inside client workspace', 'Preserve previous deliverables'],
      implementation_risks: ['Incomplete spec details', 'External dependency drift'],
      approval_history: [
        {
          gate: 'spec_final',
          decision: 'approve',
          decided_at: '2026-05-14T09:50:00Z',
          decided_by: 'owner',
        },
      ],
    },
  }
}

describe('engineering flow', () => {
  it('validates discovery handoff payload requirements', () => {
    const result = validateDiscoveryHandoffPayload({
      spec_final: { title: '', summary: '', capabilities: [] },
      acceptance_criteria: [],
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors).toContain('spec_final.title is required')
      expect(result.errors).toContain('tool_list is required')
    }
  })

  it('sends acknowledgment before implementation workflow continues', async () => {
    const registry = new AgentRegistry()
    registerProjectContext(registry)
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'engineering-agent-'))
    const state = createEngineeringProjectState({
      project_id: 'proj-eng-1',
      client_id: 'client-a',
      workspace_root: '',
      now: '2026-05-14T10:10:00Z',
    })

    const result = await acceptDiscoveryHandoff(registry, {
      message: buildValidHandoffMessage(),
      state,
      workspaceBaseDir: tempRoot,
    })

    expect(result.ack.to).toBe('product_agent')
    expect(result.pmUpdate.to).toBe('project_manager_agent')
    expect(result.ack.timestamp).toBe(buildValidHandoffMessage().timestamp)
    expect(result.ack.payload.status).toBe('handoff_received')
    expect(registry.getProject('proj-eng-1')?.lifecycle_state).toBe('implementation')
  })

  it('supports discovery handoff to implementation plan to qa flow', async () => {
    const registry = new AgentRegistry()
    registerProjectContext(registry)
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'engineering-agent-'))
    const initial = createEngineeringProjectState({
      project_id: 'proj-eng-1',
      client_id: 'client-a',
      workspace_root: '',
      now: '2026-05-14T10:10:00Z',
    })

    const accepted = await acceptDiscoveryHandoff(registry, {
      message: buildValidHandoffMessage(),
      state: initial,
      workspaceBaseDir: tempRoot,
    })
    const qaStart = await startQaValidation(
      registry,
      { ...accepted.nextState, active_stage: 'implementation_in_progress' },
      '2026-05-14T11:00:00Z',
    )
    const qaReportPath = await writeQaReport(qaStart.nextState, {
      unitTests: ['handoff validation passes'],
      integrationTests: ['discovery -> implementation -> qa'],
      staticChecks: ['tsc --noEmit'],
      knownLimitations: ['Owner approval response is simulated in tests'],
      deploymentNotes: ['No deployment step required for this fixture'],
    })

    expect(registry.getProject('proj-eng-1')?.lifecycle_state).toBe('qa')
    expect(qaStart.pmUpdate.payload.status).toBe('qa_started')
    expect((await readFile(qaReportPath, 'utf8'))).toContain('# QA Report')
  })

  it('supports ready_for_owner_review to approve to delivered flow', async () => {
    const registry = new AgentRegistry()
    registerProjectContext(registry)
    registry.updateProject('proj-eng-1', {
      lifecycle_state: 'qa',
      current_milestone: 'qa_started',
      updated_at: '2026-05-14T11:00:00Z',
    })
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'engineering-agent-'))
    const state = createEngineeringProjectState({
      project_id: 'proj-eng-1',
      client_id: 'client-a',
      workspace_root: path.join(tempRoot, 'client-a', 'proj-eng-1'),
      now: '2026-05-14T11:05:00Z',
    })
    const ready = await markReadyForOwnerReview(
      { ...state, qa_status: 'passed', active_stage: 'qa_in_progress' },
      '2026-05-14T11:10:00Z',
      '/tmp/deliverable-v1',
    )
    const request = buildDeliveryApprovalRequest(ready.nextState, '2026-05-14T11:10:30Z', {
      implementation_summary: ['Feature complete'],
      qa_summary: ['All tests green'],
      residual_risks: ['Minor docs follow-up'],
      deployment_instructions: ['Run bun test'],
      artifact_ref: '/tmp/deliverable-v1',
    })
    const outcome = await handleApprovalResponse(registry, ready.nextState, request, {
      request_id: request.request_id,
      gate: 'delivery_final',
      timestamp: '2026-05-14T11:12:00Z',
      decision: 'approve',
    })

    expect(outcome.decision).toBe('approve')
    expect(registry.getProject('proj-eng-1')?.lifecycle_state).toBe('delivered')
    if (outcome.decision === 'approve') {
      expect(outcome.support_message.to).toBe('support_agent')
      expect(outcome.manager_message.to).toBe('project_manager_agent')
    }
  })

  it('supports approval revise to create deliverable-v2 without overwriting v1', async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'engineering-agent-'))
    const workspaceRoot = path.join(tempRoot, 'client-a', 'proj-eng-1')
    const packagedV1 = await deliverablePackageTool.call(
      {
        version: 1,
        files: [{ path: 'README.md', content: 'v1' }],
      },
      {
        workspaceRoot,
        activeProjectId: 'proj-eng-1',
      },
    )
    const packagedV2 = await deliverablePackageTool.call(
      {
        version: 2,
        files: [{ path: 'README.md', content: 'v2' }],
      },
      {
        workspaceRoot,
        activeProjectId: 'proj-eng-1',
      },
    )

    expect(packagedV1.versions).toContain('deliverable-v1')
    expect(packagedV2.versions).toEqual(['deliverable-v1', 'deliverable-v2'])
  })

  it('does not move project to delivered without final approval', async () => {
    const registry = new AgentRegistry()
    registerProjectContext(registry)
    registry.updateProject('proj-eng-1', {
      lifecycle_state: 'qa',
      current_milestone: 'qa_started',
      updated_at: '2026-05-14T11:00:00Z',
    })
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'engineering-agent-'))
    const workspaceRoot = path.join(tempRoot, 'client-a', 'proj-eng-1')
    const state = createEngineeringProjectState({
      project_id: 'proj-eng-1',
      client_id: 'client-a',
      workspace_root: workspaceRoot,
      now: '2026-05-14T11:00:00Z',
    })
    const request = buildDeliveryApprovalRequest(state, '2026-05-14T11:10:00Z', {
      implementation_summary: ['Feature complete'],
      qa_summary: ['All tests green'],
      residual_risks: [],
      deployment_instructions: ['Run bun test'],
      artifact_ref: '/tmp/deliverable-v1',
    })
    const outcome = await handleApprovalResponse(registry, state, request, {
      request_id: request.request_id,
      gate: 'delivery_final',
      timestamp: '2026-05-14T11:12:00Z',
      decision: 'revise',
      notes: 'Please add deployment checklist',
    })

    expect(outcome.decision).toBe('revise')
    expect(registry.getProject('proj-eng-1')?.lifecycle_state).toBe('qa')
    expect(outcome.next_state.delivery_version).toBe(2)
  })

  it('builds clarification and recovery alerts helpers', () => {
    const clarification = buildClarificationRequest(
      'proj-eng-1',
      '2026-05-14T10:20:00Z',
      ['Please confirm integration scope.'],
    )
    const alerts = buildUnrecoverableErrorAlert(
      {
        project_id: 'proj-eng-1',
        client_id: 'client-a',
        workspace_root: '/tmp/client-a/proj-eng-1',
        implementation_status: 'blocked',
        qa_status: 'failed',
        delivery_version: 1,
        owner_review_status: 'not_requested',
        active_stage: 'implementation_in_progress',
        last_updated_at: '2026-05-14T10:30:00Z',
      },
      '2026-05-14T10:35:00Z',
      new Error('workspace corruption'),
    )

    expect(clarification.message_type).toBe('clarification_request')
    expect(alerts).toHaveLength(2)
    expect(alerts[0]?.to).toBe('project_manager_agent')
  })
})
