import { describe, expect, it } from 'bun:test'
import { AgentRegistry } from '../../registry/AgentRegistry.js'
import {
  applyApprovalResponseToTimeline,
  applyProjectStatusUpdate,
  acknowledgeHandoff,
  acknowledgeProjectHandoff,
  applyLifecycleUpdate,
  buildProjectStatusSummary,
  createBaselineTimeline,
  createCoordinationTask,
  createHandoffRecord,
  createPendingApproval,
  createProjectHistoryEvent,
  detectInitialTimelineRisk,
  evaluateTimelineHealth,
  evaluateHandoffAlert,
  formatProjectHistoryCommand,
  formatProjectStatusCommand,
  generatePeriodicStatusReport,
  recoverCoordinationTasks,
  resolveLifecycleTransition,
  type PendingApproval,
  type ProjectBlocker,
} from './index.js'

describe('project-manager baseline timeline', () => {
  it('creates the required baseline milestones in order', () => {
    const timeline = createBaselineTimeline(
      'proj-123',
      '2026-05-14T09:00:00Z',
      { deliveryTargetAt: '2026-05-27T09:00:00Z' },
    )

    expect(timeline.baseline_version).toBe(1)
    expect(timeline.milestones.map(milestone => milestone.milestone_id)).toEqual([
      'project_created',
      'lead_handoff_sent',
      'discovery_started',
      'spec_approval_pending',
      'discovery_handoff_sent',
      'implementation_started',
      'qa_started',
      'delivery_approval_pending',
      'delivered',
    ])
  })

  it('tracks handoff acknowledgment state', () => {
    const handoff = createHandoffRecord(
      'proj-123',
      'lead_handoff',
      '2026-05-14T09:00:00Z',
    )
    const acknowledged = acknowledgeHandoff(handoff, '2026-05-14T12:00:00Z')

    expect(handoff.ack_status).toBe('pending')
    expect(acknowledged.ack_status).toBe('acknowledged')
    expect(acknowledged.acked_at).toBe('2026-05-14T12:00:00Z')
  })

  it('flags unrealistic delivery targets as an initial risk', () => {
    const timeline = createBaselineTimeline('proj-123', '2026-05-14T09:00:00Z', {
      deliveryTargetAt: '2026-05-18T09:00:00Z',
    })

    const risk = detectInitialTimelineRisk(timeline, '2026-05-14T09:00:00Z')

    expect(risk?.trigger).toBe('unrealistic_deadline')
  })
})

describe('project-manager lifecycle helper', () => {
  it('applies a legal lifecycle transition into the registry', () => {
    const registry = new AgentRegistry()
    registry.registerProject({
      project_id: 'proj-123',
      client_id: 'acme',
      lifecycle_state: 'won',
      active_agent_ids: ['pm-1', 'prod-1'],
      current_milestone: 'project_created',
      updated_at: '2026-05-14T09:00:00Z',
    })

    const result = applyLifecycleUpdate(registry, {
      project_id: 'proj-123',
      event: 'discovery_started',
      actor: 'product_agent',
      timestamp: '2026-05-14T10:00:00Z',
      milestone: 'discovery_started',
    })

    expect(result.previous_state).toBe('won')
    expect(result.next_state).toBe('discovery')
    expect(registry.getProject('proj-123')?.lifecycle_state).toBe('discovery')
    expect(registry.getProject('proj-123')?.current_milestone).toBe('discovery_started')
  })

  it('rejects illegal actor ownership for lifecycle events', () => {
    expect(() =>
      resolveLifecycleTransition('won', 'discovery_started', 'engineering_agent'),
    ).toThrow('must be triggered by product_agent')
  })

  it('rejects missing lifecycle transitions', () => {
    expect(() =>
      resolveLifecycleTransition('discovery', 'delivery_approved', 'engineering_agent'),
    ).toThrow('No lifecycle transition found')
  })

  it('updates milestone status and records timeline history', () => {
    const timeline = createBaselineTimeline('proj-123', '2026-05-14T09:00:00Z')
    const result = applyProjectStatusUpdate(timeline, {
      project_id: 'proj-123',
      actor: 'product_agent',
      milestone_id: 'discovery_started',
      status: 'in_progress',
      timestamp: '2026-05-14T10:00:00Z',
      notes: 'Discovery workshop started.',
    })

    expect(
      result.timeline.milestones.find(milestone => milestone.milestone_id === 'discovery_started')
        ?.status,
    ).toBe('in_progress')
    expect(result.history_event.event_type).toBe('status_update')
  })
})

describe('project-manager health evaluation', () => {
  it('marks overdue work and blockers as risks', () => {
    const timeline = createBaselineTimeline('proj-123', '2026-05-14T09:00:00Z', {
      deliveryTargetAt: '2026-05-15T09:00:00Z',
    })
    timeline.milestones[2]!.status = 'in_progress'

    const blockers: ProjectBlocker[] = [
      {
        blocker_id: 'blk-1',
        project_id: 'proj-123',
        severity: 'high',
        affected_agents: ['product_agent', 'engineering_agent'],
        root_cause: 'Spec approval is still pending',
        recommended_action: 'Escalate to owner for approval.',
        opened_at: '2026-05-15T10:00:00Z',
      },
    ]
    const approvals: PendingApproval[] = [
      {
        gate: 'spec_final',
        project_id: 'proj-123',
        requested_by: 'product_agent',
        requested_at: '2026-05-14T17:00:00Z',
        status: 'pending',
      },
    ]

    const snapshot = evaluateTimelineHealth(
      timeline,
      blockers,
      approvals,
      '2026-05-20T09:00:00Z',
    )

    expect(snapshot.open_blockers).toBe(1)
    expect(snapshot.pending_approvals).toEqual(['spec_final'])
    expect(snapshot.milestone_status).toBe('blocked')
    expect(snapshot.risks.length).toBeGreaterThan(0)
  })

  it('creates blocker and reminder when a handoff misses SLA', () => {
    const handoff = createHandoffRecord(
      'proj-123',
      'discovery_handoff',
      '2026-05-14T09:00:00Z',
      4,
    )

    const alert = evaluateHandoffAlert(handoff, '2026-05-14T15:30:00Z')

    expect(alert.handoff.ack_status).toBe('breached')
    expect(alert.blocker?.severity).toBe('high')
    expect(alert.reminder_message?.to).toBe('engineering_agent')
  })

  it('tracks approval responses and marks owner action in status reports', () => {
    const timeline = createBaselineTimeline('proj-123', '2026-05-14T09:00:00Z')
    const pendingApproval = createPendingApproval(
      'spec_final',
      'proj-123',
      'product_agent',
      '2026-05-14T12:00:00Z',
    )
    const snapshot = evaluateTimelineHealth(
      timeline,
      [],
      [pendingApproval],
      '2026-05-14T13:00:00Z',
    )
    const summary = buildProjectStatusSummary({
      project_id: 'proj-123',
      lifecycle_state: 'discovery',
      current_milestone: 'spec_approval_pending',
      snapshot,
      blockers: [],
      approvals: [pendingApproval],
    })

    expect(formatProjectStatusCommand(summary)).toContain('[ACTION REQUIRED]')

    const approved = applyApprovalResponseToTimeline(
      timeline,
      pendingApproval,
      'approve',
      '2026-05-14T15:00:00Z',
    )
    expect(approved.approval.status).toBe('approved')
    expect(approved.history_event.event_type).toBe('approval_responded')
  })

  it('formats project history and recovers coordination tasks after restart', () => {
    const timeline = createBaselineTimeline('proj-123', '2026-05-14T09:00:00Z')
    const handoff = createHandoffRecord(
      'proj-123',
      'lead_handoff',
      '2026-05-14T09:00:00Z',
    )
    const acknowledged = acknowledgeProjectHandoff(
      timeline,
      handoff,
      '2026-05-14T10:00:00Z',
    )
    const history = [
      createProjectHistoryEvent({
        project_id: 'proj-123',
        event_type: 'timeline_created',
        actor: 'project_manager_agent',
        summary: 'Baseline timeline created.',
        created_at: '2026-05-14T09:00:00Z',
      }),
      acknowledged.history_event,
    ]

    expect(formatProjectHistoryCommand('proj-123', history)).toEqual([
      '2026-05-14T09:00:00Z [timeline_created] Baseline timeline created.',
      '2026-05-14T10:00:00Z [handoff_acknowledged] lead_handoff acknowledged by product_agent.',
    ])

    const task = createCoordinationTask({
      project_id: 'proj-123',
      task_type: 'handoff_sla_check',
      created_at: '2026-05-14T09:00:00Z',
    })
    const recovered = recoverCoordinationTasks(
      [{ ...task, status: 'running', updated_at: '2026-05-14T09:30:00Z' }],
      '2026-05-14T11:00:00Z',
    )
    expect(recovered[0]?.status).toBe('queued')
  })

  it('builds a periodic report snapshot', () => {
    const timeline = createBaselineTimeline('proj-123', '2026-05-14T09:00:00Z')
    const pendingApproval = createPendingApproval(
      'delivery_final',
      'proj-123',
      'engineering_agent',
      '2026-05-16T12:00:00Z',
    )
    const summary = buildProjectStatusSummary({
      project_id: 'proj-123',
      lifecycle_state: 'qa',
      current_milestone: 'delivery_approval_pending',
      snapshot: evaluateTimelineHealth(
        timeline,
        [],
        [pendingApproval],
        '2026-05-16T12:10:00Z',
      ),
      blockers: [],
      approvals: [pendingApproval],
    })

    const report = generatePeriodicStatusReport(summary, '2026-05-16T12:15:00Z')
    expect(report.headline).toContain('[ACTION REQUIRED]')
    expect(report.pending_approvals).toEqual(['delivery_final'])
  })
})
