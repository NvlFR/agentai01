import type {
  AgentRegistryEntry,
  AgentRegistryState,
  AgentStatus,
  AgentType,
  Approval_Response,
  Approval_Request,
  Lifecycle_State,
  ProjectRegistryEntry,
} from '../domain/types.js'
import type { AuditLogEntry, CommunicationLogEntry } from '../registry/AgentRegistry.js'
import { AgentRegistry } from '../registry/AgentRegistry.js'

export type BlockerSeverity = 'low' | 'medium' | 'high' | 'critical'

export type CompanyOperationalBlocker = {
  blocker_id: string
  summary: string
  severity: BlockerSeverity
  created_at: string
  project_id?: string
  owner_agent?: AgentType
}

export type CompanySnapshotSeed = {
  agents?: AgentRegistryEntry[]
  projects?: ProjectRegistryEntry[]
  pending_approvals?: Approval_Request[]
  open_blockers?: CompanyOperationalBlocker[]
  support_ticket_count?: number
}

export type CompanySnapshotState = {
  pending_approvals: Approval_Request[]
  approval_history: Array<Approval_Request | Approval_Response>
  open_blockers: CompanyOperationalBlocker[]
  support_ticket_count: number
}

export type CompanySnapshot = {
  generated_at: string
  registry: AgentRegistryState
  agents: AgentRegistryEntry[]
  projects: ProjectRegistryEntry[]
  pending_approvals: Approval_Request[]
  approval_history: Array<Approval_Request | Approval_Response>
  open_blockers: CompanyOperationalBlocker[]
  support_ticket_count: number
  audit_log: AuditLogEntry[]
  communication_log: CommunicationLogEntry[]
}

export type AgentStatusSummary = Record<AgentStatus, number>

export class CompanySnapshotBuilder {
  private readonly registry: AgentRegistry
  private pendingApprovals: Approval_Request[] = []
  private approvalHistory: Array<Approval_Request | Approval_Response> = []
  private openBlockers: CompanyOperationalBlocker[] = []
  private supportTicketCount = 0

  constructor(registry: AgentRegistry = new AgentRegistry()) {
    this.registry = registry
  }

  hydrate(seed: CompanySnapshotSeed = {}): this {
    for (const agent of seed.agents ?? []) {
      this.registry.registerAgent(agent)
    }

    for (const project of seed.projects ?? []) {
      this.registry.registerProject(project)
    }

    this.pendingApprovals = cloneApprovals(seed.pending_approvals ?? [])
    this.approvalHistory = cloneApprovalTimeline(seed.pending_approvals ?? [])
    this.openBlockers = cloneBlockers(seed.open_blockers ?? [])
    this.supportTicketCount = seed.support_ticket_count ?? 0

    return this
  }

  getRegistry(): AgentRegistry {
    return this.registry
  }

  getState(): CompanySnapshotState {
    return {
      pending_approvals: cloneApprovals(this.pendingApprovals),
      approval_history: cloneApprovalTimeline(this.approvalHistory),
      open_blockers: cloneBlockers(this.openBlockers),
      support_ticket_count: this.supportTicketCount,
    }
  }

  registerAgent(entry: AgentRegistryEntry): void {
    this.registry.registerAgent(entry)
  }

  updateAgent(
    agentId: string,
    updates: Partial<Omit<AgentRegistryEntry, 'agent_id'>>,
  ): void {
    this.registry.updateAgent(agentId, updates)
  }

  registerProject(entry: ProjectRegistryEntry): void {
    this.registry.registerProject(entry)
  }

  updateProject(
    projectId: string,
    updates: Partial<Omit<ProjectRegistryEntry, 'project_id'>>,
  ): void {
    this.registry.updateProject(projectId, updates)
  }

  setPendingApprovals(approvals: Approval_Request[]): void {
    this.pendingApprovals = cloneApprovals(approvals)
  }

  addPendingApproval(approval: Approval_Request): void {
    this.pendingApprovals = [...this.pendingApprovals, cloneApproval(approval)]
    this.approvalHistory = [...this.approvalHistory, cloneApproval(approval)]
  }

  resolvePendingApproval(requestId: string): void {
    this.pendingApprovals = this.pendingApprovals.filter(
      approval => approval.request_id !== requestId,
    )
  }

  applyApprovalResponse(response: Approval_Response): void {
    this.resolvePendingApproval(response.request_id)
    this.approvalHistory = [...this.approvalHistory, cloneApprovalResponse(response)]
    this.registry.recordApprovalResponse(response)
  }

  setOpenBlockers(blockers: CompanyOperationalBlocker[]): void {
    this.openBlockers = cloneBlockers(blockers)
  }

  addBlocker(blocker: CompanyOperationalBlocker): void {
    if (this.openBlockers.some(item => item.blocker_id === blocker.blocker_id)) {
      return
    }

    this.openBlockers = [...this.openBlockers, cloneBlocker(blocker)]
  }

  clearBlocker(blockerId: string): void {
    this.openBlockers = this.openBlockers.filter(
      blocker => blocker.blocker_id !== blockerId,
    )
  }

  setSupportTicketCount(count: number): void {
    this.supportTicketCount = count
  }

  buildSnapshot(generatedAt: string = new Date().toISOString()): CompanySnapshot {
    const registry = this.registry.getState()
    return {
      generated_at: generatedAt,
      registry,
      agents: Object.values(registry.agents).map(agent => ({ ...agent })),
      projects: Object.values(registry.projects).map(project => ({
        ...project,
        active_agent_ids: [...project.active_agent_ids],
      })),
      pending_approvals: cloneApprovals(this.pendingApprovals),
      approval_history: cloneApprovalTimeline(this.approvalHistory),
      open_blockers: cloneBlockers(this.openBlockers),
      support_ticket_count: this.supportTicketCount,
      audit_log: this.registry.getAuditLog(),
      communication_log: this.registry.getCommunicationLog(),
    }
  }
}

export function createCompanySnapshotBuilder(
  seed: CompanySnapshotSeed = {},
  registry: AgentRegistry = new AgentRegistry(),
): CompanySnapshotBuilder {
  return new CompanySnapshotBuilder(registry).hydrate(seed)
}

export function summarizeAgentStatuses(
  agents: readonly AgentRegistryEntry[],
): AgentStatusSummary {
  const summary: AgentStatusSummary = {
    idle: 0,
    busy: 0,
    offline: 0,
    error: 0,
    stale: 0,
  }

  for (const agent of agents) {
    summary[agent.status] += 1
  }

  return summary
}

export function summarizeLifecycleStates(
  projects: readonly ProjectRegistryEntry[],
): Record<Lifecycle_State, number> {
  const summary = {
    lead: 0,
    qualified: 0,
    proposal: 0,
    won: 0,
    discovery: 0,
    implementation: 0,
    qa: 0,
    delivered: 0,
    support: 0,
    closed: 0,
  } satisfies Record<Lifecycle_State, number>

  for (const project of projects) {
    summary[project.lifecycle_state] += 1
  }

  return summary
}

function cloneApprovals(approvals: readonly Approval_Request[]): Approval_Request[] {
  return approvals.map(cloneApproval)
}

function cloneApproval(approval: Approval_Request): Approval_Request {
  return {
    ...approval,
    risks: [...approval.risks],
    options: [...approval.options],
  }
}

function cloneApprovalResponse(
  response: Approval_Response,
): Approval_Response {
  return { ...response }
}

function cloneApprovalTimeline(
  entries: ReadonlyArray<Approval_Request | Approval_Response>,
): Array<Approval_Request | Approval_Response> {
  return entries.map(entry =>
    'decision' in entry ? cloneApprovalResponse(entry) : cloneApproval(entry),
  )
}

function cloneBlockers(
  blockers: readonly CompanyOperationalBlocker[],
): CompanyOperationalBlocker[] {
  return blockers.map(cloneBlocker)
}

function cloneBlocker(
  blocker: CompanyOperationalBlocker,
): CompanyOperationalBlocker {
  return { ...blocker }
}
