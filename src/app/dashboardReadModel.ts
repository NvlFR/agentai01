import type {
  AgentRegistryEntry,
  Approval_Request,
  Lifecycle_State,
  ProjectRegistryEntry,
} from '../domain/types.js'
import {
  summarizeAgentStatuses,
  summarizeLifecycleStates,
  type AgentStatusSummary,
  type CompanyOperationalBlocker,
  type CompanySnapshot,
} from './companySnapshot.js'

export type DashboardOperationalIssue =
  | {
      kind: 'agent_status'
      severity: 'medium' | 'high'
      summary: string
      agent_id: string
      project_id?: string
    }
  | {
      kind: 'project_blocker'
      severity: CompanyOperationalBlocker['severity']
      summary: string
      blocker_id: string
      project_id?: string
      owner_agent?: string
    }

export type DashboardProjectCard = {
  project_id: string
  client_id: string
  lifecycle_state: Lifecycle_State
  current_milestone: string
  active_agent_ids: string[]
  updated_at: string
}

export type DashboardApprovalCard = {
  request_id: string
  gate: Approval_Request['gate']
  from_agent: Approval_Request['from_agent']
  project_id?: string
  summary: string
  artifact_ref: string
  timestamp: string
}

export type CompanyDashboardReadModel = {
  generated_at: string
  agent_summary: AgentStatusSummary
  pipeline: {
    total_projects: number
    active_projects: number
    by_lifecycle_state: Record<Lifecycle_State, number>
  }
  approvals: {
    pending_count: number
    items: DashboardApprovalCard[]
  }
  handoffs: {
    awaiting_acknowledgment_count: number
    overdue_acknowledgment_count: number
  }
  delivery: {
    blocker_count: number
    support_ticket_count: number
  }
  kpis: {
    agent_utilization_rate: number
    active_project_count: number
    pending_approval_count: number
    support_ticket_count: number
  }
  refresh: {
    source: 'agent_registry_and_audit_log'
    audit_event_count: number
    communication_event_count: number
  }
  operational_issues: DashboardOperationalIssue[]
  projects: DashboardProjectCard[]
}

export function createCompanyDashboardReadModel(
  snapshot: CompanySnapshot,
): CompanyDashboardReadModel {
  const agentSummary = summarizeAgentStatuses(snapshot.agents)
  const pipelineSummary = summarizeLifecycleStates(snapshot.projects)
  const handoffSummary = summarizeHandoffs(snapshot)
  const issues = [
    ...collectAgentIssues(snapshot.agents),
    ...collectBlockerIssues(snapshot.open_blockers),
  ].sort(compareIssueSeverity)

  return {
    generated_at: snapshot.generated_at,
    agent_summary: agentSummary,
    pipeline: {
      total_projects: snapshot.projects.length,
      active_projects: snapshot.projects.filter(project => project.lifecycle_state !== 'closed')
        .length,
      by_lifecycle_state: pipelineSummary,
    },
    approvals: {
      pending_count: snapshot.pending_approvals.length,
      items: snapshot.pending_approvals.map(approval => ({
        request_id: approval.request_id,
        gate: approval.gate,
        from_agent: approval.from_agent,
        project_id: approval.project_id,
        summary: approval.summary,
        artifact_ref: approval.artifact_ref,
        timestamp: approval.timestamp,
      })),
    },
    handoffs: {
      awaiting_acknowledgment_count: handoffSummary.awaiting,
      overdue_acknowledgment_count: handoffSummary.overdue,
    },
    delivery: {
      blocker_count: snapshot.open_blockers.length,
      support_ticket_count: snapshot.support_ticket_count,
    },
    kpis: {
      agent_utilization_rate: calculateUtilizationRate(snapshot.agents),
      active_project_count: snapshot.projects.filter(project => project.lifecycle_state !== 'closed')
        .length,
      pending_approval_count: snapshot.pending_approvals.length,
      support_ticket_count: snapshot.support_ticket_count,
    },
    refresh: {
      source: 'agent_registry_and_audit_log',
      audit_event_count: snapshot.audit_log.length,
      communication_event_count: snapshot.communication_log.length,
    },
    operational_issues: issues,
    projects: snapshot.projects
      .map(toProjectCard)
      .sort((left, right) => right.updated_at.localeCompare(left.updated_at)),
  }
}

function collectAgentIssues(
  agents: readonly AgentRegistryEntry[],
): DashboardOperationalIssue[] {
  const issues: DashboardOperationalIssue[] = []

  for (const agent of agents) {
    if (agent.status === 'offline') {
      issues.push({
        kind: 'agent_status' as const,
        severity: 'high' as const,
        summary: `${agent.agent_id} is offline`,
        agent_id: agent.agent_id,
        project_id: agent.current_project_id,
      })
      continue
    }

    if (agent.status === 'error' || agent.status === 'stale') {
      issues.push({
        kind: 'agent_status' as const,
        severity: 'medium' as const,
        summary: `${agent.agent_id} is ${agent.status}`,
        agent_id: agent.agent_id,
        project_id: agent.current_project_id,
      })
    }
  }

  return issues
}

function collectBlockerIssues(
  blockers: readonly CompanyOperationalBlocker[],
): DashboardOperationalIssue[] {
  return blockers.map(blocker => ({
    kind: 'project_blocker' as const,
    severity: blocker.severity,
    summary: blocker.summary,
    blocker_id: blocker.blocker_id,
    project_id: blocker.project_id,
    owner_agent: blocker.owner_agent,
  }))
}

function compareIssueSeverity(
  left: DashboardOperationalIssue,
  right: DashboardOperationalIssue,
): number {
  return severityRank(right.severity) - severityRank(left.severity)
}

function severityRank(severity: DashboardOperationalIssue['severity']): number {
  switch (severity) {
    case 'critical':
      return 4
    case 'high':
      return 3
    case 'medium':
      return 2
    case 'low':
      return 1
  }
}

function summarizeHandoffs(snapshot: CompanySnapshot): {
  awaiting: number
  overdue: number
} {
  const handoffs = snapshot.communication_log.filter(
    entry => entry.requires_acknowledgment,
  )

  return {
    awaiting: handoffs.filter(entry => !entry.acknowledged_at).length,
    overdue: handoffs.filter(
      entry =>
        entry.requires_acknowledgment &&
        entry.acknowledged_at !== undefined &&
        entry.acknowledged_within_sla === false,
    ).length,
  }
}

function calculateUtilizationRate(
  agents: readonly AgentRegistryEntry[],
): number {
  if (agents.length === 0) {
    return 0
  }

  const busyAgents = agents.filter(agent => agent.status === 'busy').length
  return Number((busyAgents / agents.length).toFixed(2))
}

function toProjectCard(project: ProjectRegistryEntry): DashboardProjectCard {
  return {
    project_id: project.project_id,
    client_id: project.client_id,
    lifecycle_state: project.lifecycle_state,
    current_milestone: project.current_milestone,
    active_agent_ids: [...project.active_agent_ids],
    updated_at: project.updated_at,
  }
}
