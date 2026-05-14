import { describe, expect, it } from 'bun:test'
import { AgentRegistry } from '../../registry/AgentRegistry.js'
import type { OwnerCommand, StrategicDecision } from './models.js'
import { CeoRuntime } from './runtime.js'

function registerFixtureState(registry: AgentRegistry): void {
  registry.registerAgent({
    agent_id: 'ceo-agent',
    agent_type: 'ceo_agent',
    status: 'busy',
    last_activity_timestamp: '2026-05-14T10:00:00Z',
  })
  registry.registerAgent({
    agent_id: 'sales-1',
    agent_type: 'sales_agent',
    status: 'idle',
    current_project_id: 'proj-001',
    last_activity_timestamp: '2026-05-14T10:00:00Z',
  })
  registry.registerAgent({
    agent_id: 'product-1',
    agent_type: 'product_agent',
    status: 'offline',
    current_project_id: 'proj-002',
    last_activity_timestamp: '2026-05-14T09:00:00Z',
  })
  registry.registerAgent({
    agent_id: 'engineering-1',
    agent_type: 'engineering_agent',
    status: 'busy',
    current_project_id: 'proj-002',
    last_activity_timestamp: '2026-05-14T10:00:00Z',
  })
  registry.registerAgent({
    agent_id: 'support-1',
    agent_type: 'support_agent',
    status: 'idle',
    current_project_id: 'proj-002',
    last_activity_timestamp: '2026-05-14T10:00:00Z',
  })
  registry.registerProject({
    project_id: 'proj-001',
    client_id: 'acme',
    lifecycle_state: 'proposal',
    active_agent_ids: ['sales-1'],
    current_milestone: 'proposal_sent',
    updated_at: '2026-05-14T10:00:00Z',
  })
  registry.registerProject({
    project_id: 'proj-002',
    client_id: 'globex',
    lifecycle_state: 'won',
    active_agent_ids: [],
    current_milestone: 'waiting_assignment',
    updated_at: '2026-05-14T10:00:00Z',
  })
}

describe('CeoRuntime', () => {
  it('builds dashboard and report from AgentRegistry state', () => {
    const registry = new AgentRegistry()
    registerFixtureState(registry)
    const runtime = new CeoRuntime(registry)

    const report = runtime.buildReport({
      report_id: 'report-001',
      report_type: 'daily',
      generated_at: '2026-05-14T10:30:00Z',
      period_label: '2026-05-14',
      pending_approvals: [
        runtime.buildStrategicApprovalRequest({
          request_id: 'req-001',
          timestamp: '2026-05-14T10:20:00Z',
          summary: 'Reprioritize delivery squad for Globex',
          recommendation: 'Approve temporary priority swap',
          risks: ['Acme proposal follow-up could slip by one day'],
          artifact_ref: 'runtime/decisions/priority-swap.md',
        }),
      ],
    })

    expect(report.key_metrics['active_projects']).toBe(2)
    expect(report.key_metrics['offline_agents']).toBe(1)
    expect(report.issues_and_risks).toContain(
      '[ACTION REQUIRED] Agent product-1 is offline; last activity 2026-05-14T09:00:00Z',
    )
    expect(report.issues_and_risks).toContain(
      '[ACTION REQUIRED] Project proj-002 has no active agents assigned',
    )
    expect(report.next_actions[0]).toContain('Review pending approvals')
    expect(runtime.serializeCompanyReport(report)).toContain('## Key Metrics')
  })

  it('parses structured and natural owner commands with clarification support', () => {
    const registry = new AgentRegistry()
    const runtime = new CeoRuntime(registry)

    const structured = runtime.parseOwnerCommand(
      'history --last 3',
      'structured',
      '2026-05-14T10:00:00Z',
    )
    const natural = runtime.parseOwnerCommand(
      'tolong buat laporan harian hari ini',
      'natural',
      '2026-05-14T10:01:00Z',
    )
    const ambiguous = runtime.parseOwnerCommand(
      'tolong siapkan laporan',
      'natural',
      '2026-05-14T10:02:00Z',
    )

    expect(structured.kind).toBe('parsed')
    if (structured.kind === 'parsed') {
      expect(structured.command.command_type).toBe('history')
      expect(structured.command.parameters['last']).toBe(3)
    }

    expect(natural.kind).toBe('parsed')
    if (natural.kind === 'parsed') {
      expect(natural.command.command_type).toBe('report')
      expect(natural.command.parameters['type']).toBe('daily')
    }

    expect(ambiguous.kind).toBe('clarification_required')
    if (ambiguous.kind === 'clarification_required') {
      expect(ambiguous.clarification.questions).toHaveLength(3)
    }
  })

  it('creates, acknowledges, validates, and completes a delegated task', () => {
    const registry = new AgentRegistry()
    registerFixtureState(registry)
    const runtime = new CeoRuntime(registry)

    const result = runtime.createDelegationTask({
      task_id: 'task-001',
      target_agent: 'sales_agent',
      instructions: 'Follow up Acme proposal and confirm procurement timeline.',
      priority: 'high',
      success_criteria: ['Client confirms decision timeline', 'Blockers are logged'],
      project_id: 'proj-001',
      context: { lead_id: 'lead-acme-001' },
    }, '2026-05-14T10:05:00Z')

    expect(result.task.status).toBe('delegated')
    expect(result.task.assigned_agent_id).toBe('sales-1')
    expect(result.message?.payload.kind).toBe('delegation_task')

    runtime.acknowledgeDelegationTask('task-001', 'sales-1', '2026-05-14T10:06:00Z')
    expect(runtime.listDelegations(1)[0]?.ack_status).toBe('acknowledged')

    const completion = runtime.completeDelegationTask({
      task_id: 'task-001',
      actor_agent_id: 'sales-1',
      result_summary: 'Client confirms decision timeline and blockers are logged in CRM.',
    }, '2026-05-14T10:07:00Z')

    expect(completion?.valid).toBe(true)
    expect(completion?.task.status).toBe('completed')
    expect(runtime.validateAgentInstructionResponse('task-001', 'sales-1')).toBe(false)
  })

  it('fails validation or escalates when delegation cannot be completed cleanly', () => {
    const registry = new AgentRegistry()
    registerFixtureState(registry)
    const runtime = new CeoRuntime(registry)

    const unavailable = runtime.createDelegationTask({
      task_id: 'task-002',
      target_agent: 'product_agent',
      instructions: 'Start discovery immediately.',
      priority: 'critical',
      success_criteria: ['Discovery kickoff scheduled'],
      project_id: 'proj-001',
    }, '2026-05-14T10:10:00Z')

    expect(unavailable.task.status).toBe('escalated')
    expect(unavailable.message).toBeUndefined()

    const delegated = runtime.createDelegationTask({
      task_id: 'task-003',
      target_agent: 'support_agent',
      instructions: 'Prepare client-facing rollback note.',
      priority: 'medium',
      success_criteria: ['Rollback note approved'],
      project_id: 'proj-002',
    }, '2026-05-14T10:11:00Z')

    expect(delegated.task.assigned_agent_id).toBe('support-1')

    const failedCompletion = runtime.completeDelegationTask({
      task_id: 'task-003',
      actor_agent_id: 'support-1',
      result_summary: 'Draft sent for review.',
    }, '2026-05-14T10:12:00Z')

    expect(failedCompletion?.valid).toBe(false)
    expect(failedCompletion?.task.status).toBe('failed')
  })

  it('stores directives and strategic decisions with newest-first history', () => {
    const registry = new AgentRegistry()
    const runtime = new CeoRuntime(registry)

    const command: OwnerCommand = {
      command_type: 'status',
      parameters: { verbose: true },
      raw_input: 'status --verbose',
      parsed_at: '2026-05-14T10:00:00Z',
    }
    const decision: StrategicDecision = {
      decision_id: 'dec-001',
      timestamp: '2026-05-14T10:05:00Z',
      category: 'project_priority',
      context: 'Two projects need the same delivery bandwidth.',
      options_considered: ['Prioritize Acme', 'Prioritize Globex'],
      chosen_option: 'Prioritize Globex for this week',
      rationale: 'Globex is already contractually committed.',
      expected_impact: ['Reduces delivery risk', 'May delay one proposal follow-up'],
      related_project_ids: ['proj-001', 'proj-002'],
      related_agent_ids: ['sales-1', 'product-1'],
    }

    runtime.recordDirective(command)
    runtime.recordDecision(decision)

    expect(runtime.listDirectiveHistory(1)[0]).toEqual(command)
    expect(runtime.listDecisions(1)[0].decision_id).toBe('dec-001')
    expect(runtime.serializeHistoryResponse(5)).toContain('Directive History')
  })

  it('enforces broadcast permission checks and tracks acknowledgments', () => {
    const registry = new AgentRegistry()
    registerFixtureState(registry)
    const runtime = new CeoRuntime(registry, 'ceo-agent', {
      config: {
        owner_auth: {
          owner_id: 'owner',
          allowed_token_ids: ['token-1'],
          failed_attempt_threshold: 5,
          failed_attempt_window_seconds: 60,
          temporary_lock_minutes: 15,
        },
      },
    })

    const blocked = runtime.createBroadcast({
      broadcast_id: 'broadcast-001',
      content: 'Everyone reprioritize to incident mode.',
      priority: 'critical',
      target_group: 'all',
    })
    expect(blocked.permission.requires_confirmation).toBe(true)
    expect(blocked.broadcast.status).toBe('blocked')

    const broadcast = runtime.createBroadcast({
      broadcast_id: 'broadcast-002',
      content: 'Support and sales align on client communication.',
      priority: 'high',
      target_group: 'client_facing',
      requires_acknowledgment: true,
      timestamp: '2026-05-14T10:15:00Z',
    })

    expect(broadcast.broadcast.target_agent_ids).toEqual(['sales-1', 'support-1'])

    runtime.acknowledgeBroadcast('broadcast-002', 'sales-1', '2026-05-14T10:15:10Z')
    runtime.expireBroadcastAcknowledgments('2026-05-14T10:16:00Z')

    const updated = runtime.listBroadcasts(2).find(entry => entry.broadcast_id === 'broadcast-002')
    expect(updated?.acknowledgments['sales-1']).toBe('acknowledged')
    expect(updated?.acknowledgments['support-1']).toBe('unresponsive')
    expect(updated?.status).toBe('partial')
  })

  it('locks access after repeated failed owner authentication and exposes recovery-aware health', () => {
    const registry = new AgentRegistry()
    registerFixtureState(registry)
    const runtime = new CeoRuntime(registry, 'ceo-agent', {
      config: {
        owner_auth: {
          owner_id: 'owner',
          allowed_token_ids: ['token-1'],
          failed_attempt_threshold: 2,
          failed_attempt_window_seconds: 60,
          temporary_lock_minutes: 15,
        },
      },
      now: '2026-05-14T10:20:00Z',
    })

    const deniedOne = runtime.validateOwnerIdentity({
      actor_id: 'intruder',
      token_id: 'bad-token',
      authenticated: false,
    }, '2026-05-14T10:20:01Z')
    const deniedTwo = runtime.validateOwnerIdentity({
      actor_id: 'intruder',
      token_id: 'bad-token',
      authenticated: false,
    }, '2026-05-14T10:20:20Z')

    expect(deniedOne.allowed).toBe(false)
    expect(deniedTwo.allowed).toBe(false)

    const locked = runtime.validateOwnerIdentity({
      actor_id: 'owner',
      token_id: 'token-1',
      authenticated: true,
    }, '2026-05-14T10:20:30Z')

    expect(locked.allowed).toBe(false)
    expect('locked_until' in locked ? locked.locked_until : undefined).toBeDefined()
    expect(runtime.getHealthStatus('2026-05-14T10:20:30Z').status).toBe('locked')

    const exported = runtime.exportState()
    const recovered = new CeoRuntime(registry, 'ceo-agent', {
      recoveredState: exported,
      now: '2026-05-14T10:21:00Z',
    })

    expect(recovered.getReadinessStatus('2026-05-14T10:21:30Z').recovery_loaded).toBe(true)
    expect(recovered.getQueryEngineConfig().engine).toBe('QueryEngine')
    expect(recovered.getAgentDefinition().agentType).toBe('ceo')
  })

  it('executes authenticated directives and serializes consistent responses', () => {
    const registry = new AgentRegistry()
    registerFixtureState(registry)
    const runtime = new CeoRuntime(registry, 'ceo-agent', {
      config: {
        owner_auth: {
          owner_id: 'owner',
          allowed_token_ids: ['token-1'],
          failed_attempt_threshold: 5,
          failed_attempt_window_seconds: 60,
          temporary_lock_minutes: 15,
        },
      },
    })

    const statusRun = runtime.executeOwnerDirective(
      'status',
      { actor_id: 'owner', token_id: 'token-1', authenticated: true },
      'structured',
      '2026-05-14T10:25:00Z',
    )
    const reportRun = runtime.executeOwnerDirective(
      'report --type daily --period 2026-05-14',
      { actor_id: 'owner', token_id: 'token-1', authenticated: true },
      'structured',
      '2026-05-14T10:26:00Z',
    )

    expect(statusRun.ok).toBe(true)
    expect(statusRun.response).toContain('# Company Status')
    expect(reportRun.ok).toBe(true)
    expect(reportRun.response).toContain('# Company Report')
    expect(runtime.getDirectiveLog(5)[0]?.status).toBe('completed')
  })
})
