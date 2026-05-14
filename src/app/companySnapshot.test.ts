import { describe, expect, it } from 'bun:test'
import {
  CompanySnapshotBuilder,
  createCompanySnapshotBuilder,
  createCompanyDashboardReadModel,
} from './index.js'

describe('CompanySnapshotBuilder', () => {
  it('hydrates registry data and builds a dashboard-ready snapshot', () => {
    const builder = createCompanySnapshotBuilder({
      agents: [
        {
          agent_id: 'sales-1',
          agent_type: 'sales_agent',
          status: 'busy',
          current_project_id: 'proj-1',
          last_activity_timestamp: '2026-05-14T09:00:00Z',
        },
        {
          agent_id: 'eng-1',
          agent_type: 'engineering_agent',
          status: 'stale',
          current_project_id: 'proj-1',
          last_activity_timestamp: '2026-05-14T09:02:00Z',
        },
      ],
      projects: [
        {
          project_id: 'proj-1',
          client_id: 'acme',
          lifecycle_state: 'implementation',
          active_agent_ids: ['sales-1', 'eng-1'],
          current_milestone: 'build_started',
          updated_at: '2026-05-14T09:05:00Z',
        },
      ],
      pending_approvals: [
        {
          request_id: 'apr-1',
          gate: 'delivery_final',
          from_agent: 'engineering_agent',
          timestamp: '2026-05-14T09:10:00Z',
          project_id: 'proj-1',
          summary: 'MVP siap untuk final approval',
          recommendation: 'Approve untuk serah terima ke klien',
          risks: ['Ada minor polish issue'],
          options: ['approve', 'reject', 'revise'],
          artifact_ref: 'projects/acme/proj-1/release-notes.md',
        },
      ],
      open_blockers: [
        {
          blocker_id: 'blk-1',
          summary: 'Pending QA sign-off dari owner',
          severity: 'high',
          created_at: '2026-05-14T09:12:00Z',
          project_id: 'proj-1',
          owner_agent: 'engineering_agent',
        },
      ],
      support_ticket_count: 2,
    })

    const snapshot = builder.buildSnapshot('2026-05-14T09:15:00Z')

    expect(snapshot.generated_at).toBe('2026-05-14T09:15:00Z')
    expect(snapshot.registry.agents['sales-1']?.status).toBe('busy')
    expect(snapshot.projects).toHaveLength(1)
    expect(snapshot.pending_approvals).toHaveLength(1)
    expect(snapshot.open_blockers).toHaveLength(1)
    expect(snapshot.support_ticket_count).toBe(2)
  })

  it('isolates mutable arrays returned by state and snapshot helpers', () => {
    const builder = new CompanySnapshotBuilder()
    builder.setPendingApprovals([
      {
        request_id: 'apr-1',
        gate: 'proposal_final',
        from_agent: 'sales_agent',
        timestamp: '2026-05-14T09:00:00Z',
        summary: 'Proposal siap',
        recommendation: 'Approve',
        risks: [],
        options: ['approve', 'reject', 'revise'],
        artifact_ref: 'projects/acme/proj-1/proposal.md',
      },
    ])

    const state = builder.getState()
    state.pending_approvals[0]!.risks.push('mutated')

    const snapshot = builder.buildSnapshot()
    expect(snapshot.pending_approvals[0]!.risks).toEqual([])
  })

  it('records approval responses into history and removes them from pending state', () => {
    const builder = new CompanySnapshotBuilder()
    builder.addPendingApproval({
      request_id: 'apr-2',
      gate: 'spec_final',
      from_agent: 'product_agent',
      timestamp: '2026-05-14T09:00:00Z',
      project_id: 'proj-2',
      summary: 'Spec siap direview',
      recommendation: 'Approve',
      risks: ['Scope bisa melebar'],
      options: ['approve', 'reject', 'revise'],
      artifact_ref: 'projects/acme/proj-2/spec.md',
    })

    builder.applyApprovalResponse({
      request_id: 'apr-2',
      gate: 'spec_final',
      timestamp: '2026-05-14T09:10:00Z',
      decision: 'approve',
    })

    const state = builder.getState()
    expect(state.pending_approvals).toHaveLength(0)
    expect(state.approval_history).toHaveLength(2)
  })
})

describe('createCompanyDashboardReadModel', () => {
  it('derives pipeline counts and operational issues from snapshot state', () => {
    const builder = createCompanySnapshotBuilder({
      agents: [
        {
          agent_id: 'sales-1',
          agent_type: 'sales_agent',
          status: 'idle',
          last_activity_timestamp: '2026-05-14T09:00:00Z',
        },
        {
          agent_id: 'eng-1',
          agent_type: 'engineering_agent',
          status: 'error',
          current_project_id: 'proj-1',
          last_activity_timestamp: '2026-05-14T09:01:00Z',
        },
        {
          agent_id: 'pm-1',
          agent_type: 'project_manager_agent',
          status: 'offline',
          current_project_id: 'proj-2',
          last_activity_timestamp: '2026-05-14T09:02:00Z',
        },
      ],
      projects: [
        {
          project_id: 'proj-1',
          client_id: 'acme',
          lifecycle_state: 'implementation',
          active_agent_ids: ['eng-1'],
          current_milestone: 'build_started',
          updated_at: '2026-05-14T09:05:00Z',
        },
        {
          project_id: 'proj-2',
          client_id: 'globex',
          lifecycle_state: 'closed',
          active_agent_ids: ['pm-1'],
          current_milestone: 'support_closed',
          updated_at: '2026-05-14T09:03:00Z',
        },
      ],
      open_blockers: [
        {
          blocker_id: 'blk-critical',
          summary: 'Client blocker membutuhkan keputusan cepat',
          severity: 'critical',
          created_at: '2026-05-14T09:06:00Z',
          project_id: 'proj-1',
        },
      ],
      support_ticket_count: 4,
    })

    const dashboard = createCompanyDashboardReadModel(
      builder.buildSnapshot('2026-05-14T09:10:00Z'),
    )

    expect(dashboard.pipeline.total_projects).toBe(2)
    expect(dashboard.pipeline.active_projects).toBe(1)
    expect(dashboard.pipeline.by_lifecycle_state.implementation).toBe(1)
    expect(dashboard.pipeline.by_lifecycle_state.closed).toBe(1)
    expect(dashboard.agent_summary.error).toBe(1)
    expect(dashboard.agent_summary.offline).toBe(1)
    expect(dashboard.kpis.active_project_count).toBe(1)
    expect(dashboard.delivery.blocker_count).toBe(1)
    expect(dashboard.delivery.support_ticket_count).toBe(4)
    expect(dashboard.refresh.source).toBe('agent_registry_and_audit_log')
    expect(dashboard.operational_issues[0]!.severity).toBe('critical')
    expect(dashboard.operational_issues.some(issue => issue.kind === 'agent_status')).toBe(
      true,
    )
  })

  it('surfaces handoffs awaiting acknowledgment in the dashboard model', () => {
    const builder = createCompanySnapshotBuilder({
      agents: [
        {
          agent_id: 'sales-1',
          agent_type: 'sales_agent',
          status: 'busy',
          current_project_id: 'proj-1',
          last_activity_timestamp: '2026-05-14T09:00:00Z',
        },
        {
          agent_id: 'prod-1',
          agent_type: 'product_agent',
          status: 'busy',
          current_project_id: 'proj-1',
          last_activity_timestamp: '2026-05-14T09:00:01Z',
        },
      ],
      projects: [
        {
          project_id: 'proj-1',
          client_id: 'acme',
          lifecycle_state: 'won',
          active_agent_ids: ['sales-1', 'prod-1'],
          current_milestone: 'deal_won',
          updated_at: '2026-05-14T09:00:05Z',
        },
      ],
    })

    builder.getRegistry().routeMessage({
      from: 'sales_agent',
      to: 'product_agent',
      message_type: 'lead_handoff',
      project_id: 'proj-1',
      timestamp: '2026-05-14T09:00:00Z',
      payload: {
        handoff_id: 'handoff-dashboard',
        lead_id: 'lead-9',
        client_name: 'Acme',
        stakeholder_contacts: ['owner@acme.test'],
        proposal_artifact_ref: 'projects/acme/proj-1/proposal.md',
        initial_scope: 'Launch MVP',
        commercial_assumptions: ['Retainer'],
        initial_risks: ['Scope risk'],
      },
    })

    const dashboard = createCompanyDashboardReadModel(builder.buildSnapshot())
    expect(dashboard.handoffs.awaiting_acknowledgment_count).toBe(1)
  })
})
