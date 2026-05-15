import type { AgentRegistry } from '../../registry/AgentRegistry.js'
import type { AgentRegistryEntry, AgentType, Approval_Request, ProjectRegistryEntry } from '../../domain/types.js'
import {
  ceoAgentDefinition,
  createCeoQueryEngineConfig,
  createStrategicApprovalRequest,
  defaultCeoRuntimeConfig,
  type BroadcastGroup,
  type BroadcastMessage,
  type CeoAuditLogEntry,
  type CeoHealthSnapshot,
  type CeoPersistentState,
  type CeoReadinessSnapshot,
  type CeoRuntimeConfig,
  type CeoRuntimeLifecycleState,
  type ClarificationPrompt,
  type CommandParseMode,
  type CompanyDashboardSnapshot,
  type CompanyReport,
  type DelegationMessage,
  type DelegationTask,
  type DelegationTaskRecord,
  type DirectiveExecutionStatus,
  type OwnerCommand,
  type ParsedOwnerDirective,
  type PermissionCheck,
  type PriorityLevel,
  type StoredDirective,
  type StrategicDecision,
  type WorkforcePlan,
  type WorkforceRecommendation,
} from './models.js'

type DelegationTaskInput = {
  task_id: string
  target_agent: DelegationTask['target_agent']
  instructions: string
  priority: PriorityLevel
  success_criteria: string[]
  context?: Record<string, unknown>
  deadline?: string
  project_id: string
}

type ReportInput = {
  report_id: string
  report_type: CompanyReport['report_type']
  generated_at: string
  period_label: string
  pending_approvals?: Approval_Request[]
}

type OwnerIdentity = {
  actor_id: string
  token_id?: string
  authenticated: boolean
}

type AuthResult =
  | { allowed: true }
  | { allowed: false; reason: string; locked_until?: string }

type DelegationCompletionInput = {
  task_id: string
  actor_agent_id: string
  result_summary: string
}

type BroadcastInput = {
  broadcast_id: string
  content: string
  priority: PriorityLevel
  target_group?: BroadcastGroup
  target_agent_ids?: string[]
  requires_acknowledgment?: boolean
  timestamp?: string
}

function cloneDecision(decision: StrategicDecision): StrategicDecision {
  return {
    ...decision,
    options_considered: [...decision.options_considered],
    expected_impact: [...decision.expected_impact],
    related_project_ids: [...decision.related_project_ids],
    related_agent_ids: [...decision.related_agent_ids],
  }
}

function cloneDirective(command: OwnerCommand): OwnerCommand {
  return {
    ...command,
    parameters: { ...command.parameters },
  }
}

function cloneStoredDirective(directive: StoredDirective): StoredDirective {
  return {
    ...directive,
    command: directive.command ? cloneDirective(directive.command) : undefined,
  }
}

function cloneDelegation(task: DelegationTaskRecord): DelegationTaskRecord {
  return {
    ...task,
    context: { ...task.context },
    success_criteria: [...task.success_criteria],
    status_history: task.status_history.map(entry => ({ ...entry })),
  }
}

function cloneBroadcast(broadcast: BroadcastMessage): BroadcastMessage {
  return {
    ...broadcast,
    target_agent_ids: [...broadcast.target_agent_ids],
    acknowledgments: { ...broadcast.acknowledgments },
  }
}

function cloneAuditEntry(entry: CeoAuditLogEntry): CeoAuditLogEntry {
  return {
    ...entry,
    parameters: { ...entry.parameters },
  }
}

function isAgentType(value: unknown): value is AgentType {
  return value === 'ceo_agent' ||
    value === 'sales_agent' ||
    value === 'marketing_agent' ||
    value === 'product_agent' ||
    value === 'engineering_agent' ||
    value === 'project_manager_agent' ||
    value === 'support_agent'
}

function requiredAgentsForLifecycle(lifecycleState: ProjectRegistryEntry['lifecycle_state']): AgentType[] {
  switch (lifecycleState) {
    case 'lead':
    case 'qualified':
    case 'proposal':
      return ['sales_agent']
    case 'won':
    case 'discovery':
      return ['product_agent', 'project_manager_agent']
    case 'implementation':
    case 'qa':
      return ['engineering_agent', 'project_manager_agent']
    case 'delivered':
    case 'support':
      return ['support_agent']
    case 'closed':
      return []
  }
}

function dedupeRecommendations(
  recommendations: WorkforceRecommendation[],
): WorkforceRecommendation[] {
  const merged = new Map<string, WorkforceRecommendation>()
  for (const item of recommendations) {
    const key = `${item.recommended_agent_type}:${item.project_id ?? '-'}:${item.reason}`
    const existing = merged.get(key)
    if (!existing) {
      merged.set(key, { ...item })
      continue
    }
    existing.quantity += item.quantity
  }
  return Array.from(merged.values())
}

export class CeoRuntime {
  private readonly decisions: StrategicDecision[] = []
  private readonly delegations: DelegationTaskRecord[] = []
  private readonly directives: StoredDirective[] = []
  private readonly broadcasts: BroadcastMessage[] = []
  private readonly auditLog: CeoAuditLogEntry[] = []
  private readonly failedAuthAttempts: string[] = []

  private config: CeoRuntimeConfig
  private lifecycleState: CeoRuntimeLifecycleState
  private recoveryLoaded = false
  private startedAt: string
  private lastActivityTimestamp: string
  private accessLockUntil?: string

  constructor(
    private readonly registry: AgentRegistry,
    private readonly ceoAgentId = 'ceo-agent',
    options?: {
      config?: Partial<CeoRuntimeConfig>
      recoveredState?: CeoPersistentState
      now?: string
    },
  ) {
    const now = options?.now ?? new Date().toISOString()
    this.startedAt = now
    this.lastActivityTimestamp = now
    this.lifecycleState = options?.recoveredState ? 'recovering' : 'startup'
    this.config = this.mergeConfig(defaultCeoRuntimeConfig, options?.config)

    if (options?.recoveredState) {
      this.loadState(options.recoveredState)
    }

    this.lifecycleState = 'running'
    this.touch(now)
    this.audit('startup', this.ceoAgentId, 'runtime', { recovered: this.recoveryLoaded }, 'ok')
  }

  getAgentDefinition() {
    return ceoAgentDefinition
  }

  getQueryEngineConfig() {
    return createCeoQueryEngineConfig(this.config)
  }

  getRuntimeConfig(): CeoRuntimeConfig {
    return this.mergeConfig(defaultCeoRuntimeConfig, this.config)
  }

  updateRuntimeConfig(updates: Partial<CeoRuntimeConfig>, now = new Date().toISOString()): void {
    this.config = this.mergeConfig(this.config, updates)
    this.touch(now)
    this.audit('config_updated', this.ceoAgentId, 'runtime_config', updates as Record<string, unknown>, 'ok')
  }

  startup(now = new Date().toISOString()): void {
    this.lifecycleState = 'running'
    this.startedAt = now
    this.touch(now)
    this.audit('startup', this.ceoAgentId, 'runtime', { mode: 'manual' }, 'ok')
  }

  shutdown(now = new Date().toISOString()): CeoPersistentState {
    this.lifecycleState = 'shutdown'
    this.touch(now)
    this.audit('shutdown', this.ceoAgentId, 'runtime', {}, 'ok')
    return this.exportState()
  }

  heartbeat(now = new Date().toISOString()): void {
    this.touch(now)
    this.audit('heartbeat', this.ceoAgentId, 'runtime', {}, 'ok')
  }

  parseOwnerCommand(
    rawInput: string,
    mode: CommandParseMode = 'natural',
    parsedAt = new Date().toISOString(),
  ): ParsedOwnerDirective {
    const normalized = rawInput.trim()

    if (mode === 'structured') {
      return this.parseStructuredCommand(normalized, parsedAt)
    }
    return this.parseNaturalCommand(normalized, parsedAt)
  }

  executeOwnerDirective(
    rawInput: string,
    actor: OwnerIdentity,
    mode: CommandParseMode = 'natural',
    now = new Date().toISOString(),
  ): {
    ok: boolean
    directive: StoredDirective
    response: string
    clarification?: ClarificationPrompt
  } {
    const auth = this.validateOwnerIdentity(actor, now)
    if (!auth.allowed) {
      const directive = this.storeDirective({
        directive_id: this.buildDirectiveId(now),
        status: 'rejected',
        received_at: now,
        raw_input: rawInput,
        summary: auth.reason,
      })
      return {
        ok: false,
        directive,
        response: `Access denied: ${auth.reason}`,
      }
    }

    const parsed = this.parseOwnerCommand(rawInput, mode, now)
    if (parsed.kind === 'clarification_required') {
      const directive = this.storeDirective({
        directive_id: this.buildDirectiveId(now),
        status: 'clarification_required',
        received_at: now,
        raw_input: rawInput,
        summary: parsed.clarification.reason,
      })
      return {
        ok: false,
        directive,
        response: this.serializeClarification(parsed.clarification),
        clarification: parsed.clarification,
      }
    }

    const directive = this.recordDirective(parsed.command, 'executing', now)
    const response = this.runOwnerCommand(parsed.command, now)
    this.updateDirectiveStatus(directive.directive_id, 'completed')

    return {
      ok: true,
      directive: this.getDirectiveLog().find(entry => entry.directive_id === directive.directive_id)!,
      response,
    }
  }

  recordDirective(
    command: OwnerCommand,
    status: DirectiveExecutionStatus = 'received',
    receivedAt = command.parsed_at,
  ): StoredDirective {
    return this.storeDirective({
      directive_id: this.buildDirectiveId(receivedAt),
      status,
      received_at: receivedAt,
      raw_input: command.raw_input,
      command: cloneDirective(command),
      summary: `${command.command_type} command accepted`,
    })
  }

  listDirectiveHistory(limit = 10): OwnerCommand[] {
    return this.directives
      .filter(directive => directive.command)
      .slice(0, limit)
      .map(directive => cloneDirective(directive.command!))
  }

  getDirectiveLog(limit = 10): StoredDirective[] {
    return this.directives.slice(0, limit).map(cloneStoredDirective)
  }

  updateDirectiveStatus(directiveId: string, status: DirectiveExecutionStatus): void {
    const directive = this.directives.find(entry => entry.directive_id === directiveId)
    if (!directive) return
    directive.status = status
    this.touch()
    this.audit('directive_status_updated', this.ceoAgentId, directiveId, { status }, 'ok')
  }

  recordDecision(decision: StrategicDecision): void {
    this.decisions.unshift(cloneDecision(decision))
    this.touch(decision.timestamp)
    this.audit('decision_recorded', this.ceoAgentId, decision.decision_id, { category: decision.category }, 'ok')
  }

  listDecisions(limit = 10): StrategicDecision[] {
    return this.decisions.slice(0, limit).map(cloneDecision)
  }

  buildDashboardSnapshot(
    generatedAt: string,
    pendingApprovals: Approval_Request[] = [],
  ): CompanyDashboardSnapshot {
    const agents = this.registry.listAgents()
    const projects = this.registry.listProjects()
    const issues = [
      ...this.collectAgentIssues(agents, generatedAt),
      ...this.collectProjectIssues(projects),
      ...this.collectDelegationIssues(),
    ]

    return {
      generated_at: generatedAt,
      agents,
      projects,
      kpis: {
        active_projects: projects.filter(project => project.lifecycle_state !== 'closed').length,
        active_agents: agents.filter(agent => agent.status === 'busy' || agent.status === 'idle').length,
        offline_agents: agents.filter(agent => agent.status === 'offline').length,
        blocked_projects: projects.filter(project => project.active_agent_ids.length === 0).length,
        busy_agents: agents.filter(agent => agent.status === 'busy').length,
      },
      pending_approvals: pendingApprovals.map(approval => ({
        ...approval,
        risks: [...approval.risks],
        options: [...approval.options],
      })),
      issues,
    }
  }

  createDelegationTask(input: DelegationTaskInput, now = new Date().toISOString()): {
    task: DelegationTaskRecord
    message?: DelegationMessage
  } {
    const assignee = this.selectAgent(input.target_agent, input.project_id)
    const status = assignee ? 'delegated' : 'escalated'
    const task: DelegationTaskRecord = {
      task_id: input.task_id,
      target_agent: input.target_agent,
      project_id: input.project_id,
      assigned_agent_id: assignee?.agent_id,
      instructions: input.instructions,
      priority: input.priority,
      deadline: input.deadline,
      context: { ...(input.context ?? {}) },
      success_criteria: [...input.success_criteria],
      status,
      created_at: now,
      updated_at: now,
      ack_status: assignee ? 'pending' : 'unresponsive',
      status_history: [
        {
          status: 'draft',
          event: 'created',
          timestamp: now,
        },
        {
          status,
          event: assignee ? 'delegated' : 'escalated',
          timestamp: now,
          note: assignee ? `Assigned to ${assignee.agent_id}` : 'No eligible assignee found',
        },
      ],
    }

    this.delegations.unshift(task)
    this.touch(now)
    this.audit('delegation_created', this.ceoAgentId, task.task_id, {
      target_agent: task.target_agent,
      assigned_agent_id: task.assigned_agent_id,
      project_id: task.project_id,
    }, status)

    if (!assignee) {
      return { task: cloneDelegation(task) }
    }

    return {
      task: cloneDelegation(task),
      message: {
        from: 'ceo_agent',
        to: input.target_agent,
        message_type: 'status_update',
        project_id: input.project_id,
        timestamp: now,
        payload: {
          kind: 'delegation_task',
          task: cloneDelegation(task),
        },
      },
    }
  }

  acknowledgeDelegationTask(taskId: string, agentId: string, now = new Date().toISOString()): void {
    const task = this.findDelegation(taskId)
    if (!task || task.assigned_agent_id !== agentId) return
    task.ack_status = 'acknowledged'
    task.updated_at = now
    task.status_history.unshift({
      status: task.status,
      event: 'acknowledged',
      timestamp: now,
      note: `Acknowledged by ${agentId}`,
    })
    this.touch(now)
    this.audit('delegation_acknowledged', agentId, taskId, {}, 'ok')
  }

  addDelegationInstruction(
    taskId: string,
    note: string,
    now = new Date().toISOString(),
  ): DelegationTaskRecord | undefined {
    const task = this.findDelegation(taskId)
    if (!task) return undefined
    task.updated_at = now
    task.status_history.unshift({
      status: task.status,
      event: 'instruction_added',
      timestamp: now,
      note,
    })
    this.touch(now)
    this.audit('delegation_instruction_added', this.ceoAgentId, taskId, { note }, 'ok')
    return cloneDelegation(task)
  }

  redelegateTask(
    taskId: string,
    targetAgent: AgentType,
    now = new Date().toISOString(),
  ): DelegationTaskRecord | undefined {
    const task = this.findDelegation(taskId)
    if (!task) return undefined

    const replacement = this.selectAgent(targetAgent, task.project_id)
    if (!replacement) {
      task.status = 'escalated'
      task.ack_status = 'unresponsive'
      task.updated_at = now
      task.status_history.unshift({
        status: 'escalated',
        event: 'escalated',
        timestamp: now,
        note: `No replacement available for ${targetAgent}`,
      })
      this.touch(now)
      this.audit('delegation_redelegated', this.ceoAgentId, taskId, { targetAgent }, 'escalated')
      return cloneDelegation(task)
    }

    task.target_agent = targetAgent
    task.assigned_agent_id = replacement.agent_id
    task.status = 'delegated'
    task.ack_status = 'pending'
    task.updated_at = now
    task.status_history.unshift({
      status: 'delegated',
      event: 'redelegated',
      timestamp: now,
      note: `Redelegated to ${replacement.agent_id}`,
    })
    this.touch(now)
    this.audit('delegation_redelegated', this.ceoAgentId, taskId, { targetAgent, replacement: replacement.agent_id }, 'ok')
    return cloneDelegation(task)
  }

  completeDelegationTask(
    input: DelegationCompletionInput,
    now = new Date().toISOString(),
  ): { task: DelegationTaskRecord; valid: boolean; missing_criteria: string[] } | undefined {
    const task = this.findDelegation(input.task_id)
    if (!task || task.assigned_agent_id !== input.actor_agent_id) {
      return undefined
    }

    const validation = this.validateDelegationResult(task, input.result_summary)
    task.latest_result_summary = input.result_summary
    task.updated_at = now
    if (validation.valid) {
      task.status = 'completed'
      task.status_history.unshift({
        status: 'completed',
        event: 'completed',
        timestamp: now,
      })
    } else {
      task.status = 'failed'
      task.failure_reason = `Missing success criteria: ${validation.missing_criteria.join(', ')}`
      task.status_history.unshift({
        status: 'failed',
        event: 'failed',
        timestamp: now,
        note: task.failure_reason,
      })
    }

    this.touch(now)
    this.audit(
      'delegation_completed',
      input.actor_agent_id,
      input.task_id,
      { valid: validation.valid, missing_criteria: validation.missing_criteria },
      task.status,
    )

    return {
      task: cloneDelegation(task),
      valid: validation.valid,
      missing_criteria: [...validation.missing_criteria],
    }
  }

  failDelegationTask(
    taskId: string,
    actorAgentId: string,
    reason: string,
    now = new Date().toISOString(),
  ): DelegationTaskRecord | undefined {
    const task = this.findDelegation(taskId)
    if (!task || task.assigned_agent_id !== actorAgentId) return undefined

    task.status = 'failed'
    task.failure_reason = reason
    task.updated_at = now
    task.status_history.unshift({
      status: 'failed',
      event: 'failed',
      timestamp: now,
      note: reason,
    })
    this.touch(now)
    this.audit('delegation_failed', actorAgentId, taskId, { reason }, 'failed')
    return cloneDelegation(task)
  }

  listDelegations(limit = 20): DelegationTaskRecord[] {
    return this.delegations.slice(0, limit).map(cloneDelegation)
  }

  validateAgentInstructionResponse(taskId: string, agentId: string): boolean {
    const task = this.findDelegation(taskId)
    return task?.assigned_agent_id === agentId && task.status === 'delegated'
  }

  buildStrategicApprovalRequest(input: {
    request_id: string
    timestamp: string
    summary: string
    recommendation: string
    risks: string[]
    artifact_ref: string
    project_id?: string
  }): Approval_Request {
    return createStrategicApprovalRequest(input)
  }

  buildReport(input: ReportInput): CompanyReport {
    const snapshot = this.buildDashboardSnapshot(input.generated_at, input.pending_approvals)
    const topDecisions = this.listDecisions(5)
    const activeDelegations = this.delegations.filter(task => task.status === 'delegated').length

    return {
      report_id: input.report_id,
      report_type: input.report_type,
      generated_at: input.generated_at,
      period_label: input.period_label,
      executive_summary: this.buildExecutiveSummary(snapshot, activeDelegations),
      key_metrics: {
        active_projects: snapshot.kpis.active_projects,
        active_agents: snapshot.kpis.active_agents,
        busy_agents: snapshot.kpis.busy_agents,
        offline_agents: snapshot.kpis.offline_agents,
        blocked_projects: snapshot.kpis.blocked_projects,
        pending_approvals: snapshot.pending_approvals.length,
        active_delegations: activeDelegations,
      },
      active_projects: snapshot.projects
        .filter(project => project.lifecycle_state !== 'closed')
        .map(project => ({
          project_id: project.project_id,
          client_id: project.client_id,
          lifecycle_state: project.lifecycle_state,
          active_agents: [...project.active_agent_ids],
          current_milestone: project.current_milestone,
        })),
      decisions_made: topDecisions,
      issues_and_risks: snapshot.issues,
      next_actions: this.buildNextActions(snapshot),
    }
  }

  serializeCompanyReport(report: CompanyReport): string {
    const metrics = Object.entries(report.key_metrics)
      .map(([key, value]) => `- ${key}: ${value}`)
      .join('\n')

    const projects = report.active_projects.length > 0
      ? report.active_projects
          .map(
            project =>
              `- ${project.project_id} (${project.client_id}) - ${project.lifecycle_state} / ${project.current_milestone}`,
          )
          .join('\n')
      : '- None'

    const decisions = report.decisions_made.length > 0
      ? report.decisions_made.map(decision => `- ${decision.decision_id}: ${decision.chosen_option}`).join('\n')
      : '- None'

    const issues = report.issues_and_risks.length > 0
      ? report.issues_and_risks.map(issue => `- ${issue}`).join('\n')
      : '- None'

    const nextActions = report.next_actions.map(action => `- ${action}`).join('\n')

    return [
      '# Company Report',
      '',
      '## Executive Summary',
      report.executive_summary,
      '',
      '## Key Metrics',
      metrics,
      '',
      '## Active Projects',
      projects,
      '',
      '## Decisions Made',
      decisions,
      '',
      '## Issues & Risks',
      issues,
      '',
      '## Next Actions',
      nextActions,
    ].join('\n')
  }

  serializeStatusResponse(snapshot: CompanyDashboardSnapshot): string {
    const issueLines = snapshot.issues.length > 0
      ? snapshot.issues.map(issue => `- ${issue}`).join('\n')
      : '- No active operational issues.'

    return [
      '# Company Status',
      '',
      `Generated: ${snapshot.generated_at}`,
      '',
      '## KPI',
      `- active_projects: ${snapshot.kpis.active_projects}`,
      `- active_agents: ${snapshot.kpis.active_agents}`,
      `- busy_agents: ${snapshot.kpis.busy_agents}`,
      `- offline_agents: ${snapshot.kpis.offline_agents}`,
      `- blocked_projects: ${snapshot.kpis.blocked_projects}`,
      '',
      '## Attention Needed',
      issueLines,
    ].join('\n')
  }

  serializeHistoryResponse(limit = 10): string {
    const lines = this.getDirectiveLog(limit).map(
      directive => `- ${directive.received_at} [${directive.status}] ${directive.raw_input}`,
    )

    return [
      '# Directive History',
      '',
      ...(lines.length > 0 ? lines : ['- No directives recorded.']),
    ].join('\n')
  }

  serializeClarification(clarification: ClarificationPrompt): string {
    return [
      '# Clarification Required',
      '',
      clarification.reason,
      '',
      ...clarification.questions.map((question, index) => `${index + 1}. ${question}`),
    ].join('\n')
  }

  checkBroadcastPermissions(
    input: Pick<BroadcastInput, 'target_group' | 'target_agent_ids' | 'priority'>,
  ): PermissionCheck {
    const explicitTargets = input.target_agent_ids?.length ?? 0
    const wideAudience = input.target_group === 'all' || explicitTargets >= 4
    const strategicPriority = input.priority === 'critical'

    if (wideAudience || strategicPriority) {
      return {
        allowed: false,
        requires_confirmation: true,
        reason: 'Broadcast requires owner confirmation because it is high-impact.',
      }
    }

    return {
      allowed: true,
      requires_confirmation: false,
    }
  }

  createBroadcast(input: BroadcastInput): { broadcast: BroadcastMessage; permission: PermissionCheck } {
    const timestamp = input.timestamp ?? new Date().toISOString()
    const permission = this.checkBroadcastPermissions(input)
    const targetAgentIds = this.resolveBroadcastTargets(input.target_group, input.target_agent_ids)

    const broadcast: BroadcastMessage = {
      broadcast_id: input.broadcast_id,
      sender: 'ceo_agent',
      timestamp,
      priority: input.priority,
      content: input.content,
      target_group: input.target_group,
      target_agent_ids: targetAgentIds,
      requires_acknowledgment: input.requires_acknowledgment ?? true,
      ack_timeout_seconds: this.config.monitoring.broadcast_ack_timeout_seconds,
      status: permission.allowed ? 'pending_ack' : 'blocked',
      acknowledgments: Object.fromEntries(targetAgentIds.map(agentId => [agentId, 'pending'])),
    }

    this.broadcasts.unshift(broadcast)
    this.touch(timestamp)
    this.audit('broadcast_created', this.ceoAgentId, broadcast.broadcast_id, {
      target_group: input.target_group,
      target_agent_ids: targetAgentIds,
      priority: input.priority,
    }, broadcast.status)

    return {
      broadcast: cloneBroadcast(broadcast),
      permission,
    }
  }

  acknowledgeBroadcast(
    broadcastId: string,
    agentId: string,
    now = new Date().toISOString(),
  ): BroadcastMessage | undefined {
    const broadcast = this.broadcasts.find(entry => entry.broadcast_id === broadcastId)
    if (!broadcast || !(agentId in broadcast.acknowledgments)) {
      return undefined
    }

    broadcast.acknowledgments[agentId] = 'acknowledged'
    broadcast.status = this.computeBroadcastStatus(broadcast)
    this.touch(now)
    this.audit('broadcast_acknowledged', agentId, broadcastId, {}, broadcast.status)
    return cloneBroadcast(broadcast)
  }

  expireBroadcastAcknowledgments(now = new Date().toISOString()): void {
    const currentTime = Date.parse(now)
    for (const broadcast of this.broadcasts) {
      if (!broadcast.requires_acknowledgment || broadcast.status === 'completed' || broadcast.status === 'blocked') {
        continue
      }

      const deadline = Date.parse(broadcast.timestamp) + broadcast.ack_timeout_seconds * 1000
      if (currentTime < deadline) continue

      for (const [agentId, status] of Object.entries(broadcast.acknowledgments)) {
        if (status === 'pending') {
          broadcast.acknowledgments[agentId] = 'unresponsive'
        }
      }
      broadcast.status = this.computeBroadcastStatus(broadcast)
      this.audit('broadcast_timeout_processed', this.ceoAgentId, broadcast.broadcast_id, {}, broadcast.status)
    }
    this.touch(now)
  }

  listBroadcasts(limit = 20): BroadcastMessage[] {
    return this.broadcasts.slice(0, limit).map(cloneBroadcast)
  }

  validateOwnerIdentity(identity: OwnerIdentity, now = new Date().toISOString()): AuthResult {
    if (this.isLocked(now)) {
      this.audit('owner_auth_denied', identity.actor_id, 'runtime', {}, 'locked')
      return {
        allowed: false,
        reason: `CEO access is temporarily locked until ${this.accessLockUntil}`,
        locked_until: this.accessLockUntil,
      }
    }

    const tokenAllowed =
      this.config.owner_auth.allowed_token_ids.length === 0 ||
      (identity.token_id !== undefined &&
        this.config.owner_auth.allowed_token_ids.includes(identity.token_id))

    if (
      identity.authenticated &&
      identity.actor_id === this.config.owner_auth.owner_id &&
      tokenAllowed
    ) {
      this.touch(now)
      this.audit('owner_auth_granted', identity.actor_id, 'runtime', {}, 'ok')
      return { allowed: true }
    }

    this.failedAuthAttempts.unshift(now)
    this.pruneFailedAuthAttempts(now)
    if (this.failedAuthAttempts.length >= this.config.owner_auth.failed_attempt_threshold) {
      this.accessLockUntil = new Date(
        Date.parse(now) + this.config.owner_auth.temporary_lock_minutes * 60 * 1000,
      ).toISOString()
      this.audit('owner_auth_locked', identity.actor_id, 'runtime', {}, this.accessLockUntil)
    } else {
      this.audit('owner_auth_denied', identity.actor_id, 'runtime', {}, 'invalid_identity')
    }

    return {
      allowed: false,
      reason: 'Sender is not an authenticated owner.',
      locked_until: this.accessLockUntil,
    }
  }

  getHealthStatus(now = new Date().toISOString()): CeoHealthSnapshot {
    const activeTasks = this.delegations.filter(
      task => task.status === 'draft' || task.status === 'delegated',
    ).length

    let status: CeoHealthSnapshot['status']
    if (this.lifecycleState === 'shutdown') {
      status = 'stopped'
    } else if (this.isLocked(now)) {
      status = 'locked'
    } else if (this.lifecycleState === 'recovering') {
      status = 'recovering'
    } else if (this.hasOperationalDegradation()) {
      status = 'degraded'
    } else if (this.lifecycleState === 'startup') {
      status = 'starting'
    } else {
      status = 'ready'
    }

    return {
      status,
      uptime_seconds: Math.max(0, Math.floor((Date.parse(now) - Date.parse(this.startedAt)) / 1000)),
      active_tasks: activeTasks,
      last_activity_timestamp: this.lastActivityTimestamp,
    }
  }

  getReadinessStatus(now = new Date().toISOString()): CeoReadinessSnapshot {
    const health = this.getHealthStatus(now)
    return {
      ...health,
      ready: health.status === 'ready' || health.status === 'degraded',
      registry_connected: true,
      recovery_loaded: this.recoveryLoaded,
      lock_active: this.isLocked(now),
      monitoring_cadence_minutes: this.getMonitoringCadenceMinutes(),
    }
  }

  exportState(): CeoPersistentState {
    return {
      directives: this.directives.map(cloneStoredDirective),
      decisions: this.decisions.map(cloneDecision),
      delegations: this.delegations.map(cloneDelegation),
      broadcasts: this.broadcasts.map(cloneBroadcast),
      audit_log: this.auditLog.map(cloneAuditEntry),
      config: this.getRuntimeConfig(),
      last_activity_timestamp: this.lastActivityTimestamp,
    }
  }

  getAuditLog(limit = 50): CeoAuditLogEntry[] {
    return this.auditLog.slice(0, limit).map(cloneAuditEntry)
  }

  getMonitoringCadenceMinutes(): number {
    const activeProjects = this.registry
      .listProjects()
      .filter(project => project.lifecycle_state !== 'closed').length

    return activeProjects > 0
      ? this.config.monitoring.active_project_interval_minutes
      : this.config.monitoring.idle_interval_minutes
  }

  private runOwnerCommand(command: OwnerCommand, now: string): string {
    switch (command.command_type) {
      case 'activity':
        return 'Activity command accepted. Runtime application layer should summarize current activity.'
      case 'status':
        return this.serializeStatusResponse(this.buildDashboardSnapshot(now))
      case 'history':
        return this.serializeHistoryResponse(Number(command.parameters['last'] ?? 10))
      case 'report': {
        const report = this.buildReport({
          report_id: `report-${Date.parse(now)}`,
          report_type: (command.parameters['type'] as CompanyReport['report_type']) ?? 'daily',
          generated_at: now,
          period_label: String(command.parameters['period'] ?? now.slice(0, 10)),
        })
        return this.serializeCompanyReport(report)
      }
      case 'decisions':
        return this.listDecisions(5).map(decision => `- ${decision.decision_id}: ${decision.chosen_option}`).join('\n') || '- No decisions recorded.'
      case 'runbook':
        return `Runbook command accepted for action=${String(command.parameters['action'] ?? 'unknown')}. Runtime application layer should execute it.`
      case 'workspace':
        return `Workspace command accepted for action=${String(command.parameters['action'] ?? 'unknown')}. Runtime application layer should execute it.`
      case 'staffing': {
        const action = String(command.parameters['action'] ?? 'assess')
        if (action === 'provision') {
          const agentType = command.parameters['agent_type']
          if (!isAgentType(agentType)) {
            return 'Staffing provision failed: agent_type is missing or invalid.'
          }
          const count = this.normalizeProvisionCount(command.parameters['count'])
          const projectId = this.readOptionalParameterString(command.parameters['project_id'])
          const created = this.provisionAgents({
            agentType,
            count,
            projectId,
          }, now)
          return this.serializeProvisioningResult(created, agentType, projectId, now)
        }

        const projectId = this.readOptionalParameterString(command.parameters['project_id'])
        return this.serializeWorkforcePlan(this.buildWorkforcePlan(now, projectId))
      }
      case 'project_admin':
        return `Project administration command accepted for action=${String(command.parameters['action'] ?? 'unknown')}. Runtime application layer should execute it.`
      case 'delegate':
        return 'Delegation command parsed successfully. Use createDelegationTask to dispatch work.'
    }
  }

  private parseStructuredCommand(rawInput: string, parsedAt: string): ParsedOwnerDirective {
    const [baseCommand, ...rest] = rawInput.split(/\s+/)
    const command = baseCommand?.toLowerCase()
    const tokens = rest

    switch (command) {
      case 'activity':
        return this.buildParsedDirective('structured', {
          command_type: 'activity',
          parameters: {},
          raw_input: rawInput,
          parsed_at: parsedAt,
        })
      case 'status':
        return this.buildParsedDirective('structured', {
          command_type: 'status',
          parameters: {},
          raw_input: rawInput,
          parsed_at: parsedAt,
        })
      case 'history':
        return this.buildParsedDirective('structured', {
          command_type: 'history',
          parameters: { last: this.readNumericFlag(tokens, '--last') ?? 10 },
          raw_input: rawInput,
          parsed_at: parsedAt,
        })
      case 'report': {
        const type = this.readStringFlag(tokens, '--type')
        if (!type) {
          return this.buildClarification('structured', 'Report command is missing a report type.', [
            'Do you want a daily, weekly, project, agent, or kpi report?',
          ])
        }

        return this.buildParsedDirective('structured', {
          command_type: 'report',
          parameters: {
            type,
            period: this.readStringFlag(tokens, '--period'),
          },
          raw_input: rawInput,
          parsed_at: parsedAt,
        })
      }
      case 'decisions':
        return this.buildParsedDirective('structured', {
          command_type: 'decisions',
          parameters: {},
          raw_input: rawInput,
          parsed_at: parsedAt,
        })
      case 'runbook': {
        const action = this.readStringFlag(tokens, '--action')
        if (!action) {
          return this.buildClarification('structured', 'Runbook command is missing an action.', [
            'Please use runbook --action check, runbook --action test, or runbook --action smoke.',
          ])
        }
        return this.buildParsedDirective('structured', {
          command_type: 'runbook',
          parameters: { action },
          raw_input: rawInput,
          parsed_at: parsedAt,
        })
      }
      case 'workspace': {
        const action = this.readStringFlag(tokens, '--action')
        if (!action) {
          return this.buildClarification('structured', 'Workspace command is missing an action.', [
            'Please use workspace --action read_file --path FILE or workspace --action search_code --query QUERY.',
          ])
        }
        return this.buildParsedDirective('structured', {
          command_type: 'workspace',
          parameters: {
            action,
            path: this.readStringFlag(tokens, '--path'),
            query: this.readStringFlag(tokens, '--query'),
            lines: this.readNumericFlag(tokens, '--lines'),
          },
          raw_input: rawInput,
          parsed_at: parsedAt,
        })
      }
      case 'staffing': {
        const action = this.readStringFlag(tokens, '--action') ?? 'assess'
        return this.buildParsedDirective('structured', {
          command_type: 'staffing',
          parameters: {
            action,
            agent_type: this.readStringFlag(tokens, '--type'),
            count: this.readNumericFlag(tokens, '--count') ?? 1,
            project_id: this.readStringFlag(tokens, '--project'),
          },
          raw_input: rawInput,
          parsed_at: parsedAt,
        })
      }
      case 'spawn-agent':
      case 'create-agent':
        return this.buildParsedDirective('structured', {
          command_type: 'staffing',
          parameters: {
            action: 'provision',
            agent_type: this.readStringFlag(tokens, '--type') ?? tokens[0],
            count: this.readNumericFlag(tokens, '--count') ?? 1,
            project_id: this.readStringFlag(tokens, '--project'),
          },
          raw_input: rawInput,
          parsed_at: parsedAt,
        })
      case 'project-admin':
      case 'delete-projects':
        return this.buildParsedDirective('structured', {
          command_type: 'project_admin',
          parameters: {
            action: this.readStringFlag(tokens, '--action') ?? 'close_all_projects',
          },
          raw_input: rawInput,
          parsed_at: parsedAt,
        })
      case 'read-file':
        return this.buildParsedDirective('structured', {
          command_type: 'workspace',
          parameters: {
            action: 'read_file',
            path: this.readStringFlag(tokens, '--path') ?? tokens[0],
          },
          raw_input: rawInput,
          parsed_at: parsedAt,
        })
      case 'search-code':
        return this.buildParsedDirective('structured', {
          command_type: 'workspace',
          parameters: {
            action: 'search_code',
            query: this.readStringFlag(tokens, '--query') ?? tokens[0],
            path: this.readStringFlag(tokens, '--path'),
          },
          raw_input: rawInput,
          parsed_at: parsedAt,
        })
      case 'git-status':
        return this.buildParsedDirective('structured', {
          command_type: 'workspace',
          parameters: {
            action: 'git_status',
          },
          raw_input: rawInput,
          parsed_at: parsedAt,
        })
      case 'git-diff':
        return this.buildParsedDirective('structured', {
          command_type: 'workspace',
          parameters: {
            action: 'git_diff',
            path: this.readStringFlag(tokens, '--path') ?? tokens[0],
          },
          raw_input: rawInput,
          parsed_at: parsedAt,
        })
      case 'read-log':
        return this.buildParsedDirective('structured', {
          command_type: 'workspace',
          parameters: {
            action: 'read_log',
            path: this.readStringFlag(tokens, '--path') ?? tokens[0],
            lines: this.readNumericFlag(tokens, '--lines'),
          },
          raw_input: rawInput,
          parsed_at: parsedAt,
        })
      case 'list-files':
        return this.buildParsedDirective('structured', {
          command_type: 'workspace',
          parameters: {
            action: 'list_files',
            path: this.readStringFlag(tokens, '--path') ?? tokens[0],
          },
          raw_input: rawInput,
          parsed_at: parsedAt,
        })
      case 'check':
      case 'test':
      case 'smoke':
        return this.buildParsedDirective('structured', {
          command_type: 'runbook',
          parameters: { action: command === 'test' ? 'tests' : command },
          raw_input: rawInput,
          parsed_at: parsedAt,
        })
      default:
        return this.buildClarification('structured', 'Command is not recognized.', [
          'Please use status, history --last N, report --type TYPE, staffing --action ACTION, runbook --action ACTION, or workspace --action ACTION.',
        ])
    }
  }

  private parseNaturalCommand(rawInput: string, parsedAt: string): ParsedOwnerDirective {
    const lower = rawInput.toLowerCase()

    if (lower === 'status' || lower.includes('status perusahaan') || lower.includes('company status')) {
      return this.buildParsedDirective('natural', {
        command_type: 'status',
        parameters: {},
        raw_input: rawInput,
        parsed_at: parsedAt,
      })
    }

    if (lower.includes('history') || lower.includes('riwayat')) {
      const numericMatch = lower.match(/(\d+)/)
      return this.buildParsedDirective('natural', {
        command_type: 'history',
        parameters: { last: numericMatch ? Number(numericMatch[1]) : 10 },
        raw_input: rawInput,
        parsed_at: parsedAt,
      })
    }

    if (lower.includes('report') || lower.includes('laporan')) {
      const type = this.inferReportType(lower)
      if (!type) {
        return this.buildClarification('natural', 'The report request is still ambiguous.', [
          'Should I generate a daily, weekly, project, agent, or kpi report?',
          'If this is a project report, which project_id should I use?',
          'If this is an agent report, which agent_id should I use?',
        ])
      }

      return this.buildParsedDirective('natural', {
        command_type: 'report',
        parameters: {
          type,
          period: this.inferPeriod(lower),
        },
        raw_input: rawInput,
        parsed_at: parsedAt,
      })
    }

    if (
      lower.includes('apa yang sedang anda jalankan') ||
      lower.includes('apa yang sedang kamu jalankan') ||
      lower.includes('sedang menjalankan apa') ||
      lower.includes('current activity') ||
      lower.includes('aktivitas sekarang')
    ) {
      return this.buildParsedDirective('natural', {
        command_type: 'activity',
        parameters: {},
        raw_input: rawInput,
        parsed_at: parsedAt,
      })
    }

    if (
      lower.includes('jalankan check') ||
      lower.includes('run check') ||
      lower.includes('typecheck')
    ) {
      return this.buildParsedDirective('natural', {
        command_type: 'runbook',
        parameters: { action: 'check' },
        raw_input: rawInput,
        parsed_at: parsedAt,
      })
    }

    if (
      lower.includes('jalankan test') ||
      lower.includes('run test') ||
      lower.includes('tes proyek') ||
      lower.includes('test project')
    ) {
      return this.buildParsedDirective('natural', {
        command_type: 'runbook',
        parameters: { action: 'tests' },
        raw_input: rawInput,
        parsed_at: parsedAt,
      })
    }

    if (
      lower.includes('jalankan smoke') ||
      lower.includes('run smoke') ||
      lower.includes('smoke test')
    ) {
      return this.buildParsedDirective('natural', {
        command_type: 'runbook',
        parameters: { action: 'smoke' },
        raw_input: rawInput,
        parsed_at: parsedAt,
      })
    }

    const readFileMatch = rawInput.match(/^(?:baca file|read file)\s+(.+)$/i)
    if (readFileMatch?.[1]) {
      return this.buildParsedDirective('natural', {
        command_type: 'workspace',
        parameters: {
          action: 'read_file',
          path: readFileMatch[1].trim(),
        },
        raw_input: rawInput,
        parsed_at: parsedAt,
      })
    }

    const searchCodeMatch = rawInput.match(/^(?:cari kode|search code)\s+(.+)$/i)
    if (searchCodeMatch?.[1]) {
      return this.buildParsedDirective('natural', {
        command_type: 'workspace',
        parameters: {
          action: 'search_code',
          query: searchCodeMatch[1].trim(),
        },
        raw_input: rawInput,
        parsed_at: parsedAt,
      })
    }

    if (lower === 'status git' || lower.includes('git status')) {
      return this.buildParsedDirective('natural', {
        command_type: 'workspace',
        parameters: {
          action: 'git_status',
        },
        raw_input: rawInput,
        parsed_at: parsedAt,
      })
    }

    const gitDiffMatch = rawInput.match(/^(?:diff git|git diff)(?:\s+(.+))?$/i)
    if (gitDiffMatch) {
      return this.buildParsedDirective('natural', {
        command_type: 'workspace',
        parameters: {
          action: 'git_diff',
          path: gitDiffMatch[1]?.trim(),
        },
        raw_input: rawInput,
        parsed_at: parsedAt,
      })
    }

    const readLogMatch = rawInput.match(/^(?:baca log|read log)\s+(.+)$/i)
    if (readLogMatch?.[1]) {
      return this.buildParsedDirective('natural', {
        command_type: 'workspace',
        parameters: {
          action: 'read_log',
          path: readLogMatch[1].trim(),
        },
        raw_input: rawInput,
        parsed_at: parsedAt,
      })
    }

    const listFilesMatch = rawInput.match(/^(?:list file|list files|daftar file)\s*(.*)$/i)
    if (listFilesMatch) {
      return this.buildParsedDirective('natural', {
        command_type: 'workspace',
        parameters: {
          action: 'list_files',
          path: listFilesMatch[1]?.trim() || undefined,
        },
        raw_input: rawInput,
        parsed_at: parsedAt,
      })
    }

    if (
      lower.includes('kebutuhan agent') ||
      lower.includes('kebutuhan tim') ||
      lower.includes('analisa staffing') ||
      lower.includes('analisa tim') ||
      lower.includes('rancang agent')
    ) {
      return this.buildParsedDirective('natural', {
        command_type: 'staffing',
        parameters: {
          action: 'assess',
        },
        raw_input: rawInput,
        parsed_at: parsedAt,
      })
    }

    const createAgentMatch = lower.match(/(?:buat|tambah|create|spawn)\s+(\d+)?\s*agent\s+([a-z_ ]+?)(?:\s+baru)?(?:\s+untuk\s+([a-z0-9-_]+))?$/i)
    if (createAgentMatch) {
      const count = createAgentMatch[1] ? Number(createAgentMatch[1]) : 1
      const agentType = this.inferAgentType(createAgentMatch[2] ?? '')
      if (agentType) {
        return this.buildParsedDirective('natural', {
          command_type: 'staffing',
          parameters: {
            action: 'provision',
            agent_type: agentType,
            count,
            project_id: createAgentMatch[3]?.trim(),
          },
          raw_input: rawInput,
          parsed_at: parsedAt,
        })
      }
    }

    if (
      lower.includes('hapus semua proyek') ||
      lower.includes('hapus seluruh proyek') ||
      lower.includes('delete all projects') ||
      lower.includes('clear all projects')
    ) {
      return this.buildParsedDirective('natural', {
        command_type: 'project_admin',
        parameters: {
          action: 'close_all_projects',
        },
        raw_input: rawInput,
        parsed_at: parsedAt,
      })
    }

    return this.buildClarification('natural', 'Directive intent is ambiguous.', [
      'Do you need a status summary, current activity, directive history, a report, staffing help, a runbook action, or a workspace action like baca file/cari kode/status git?',
    ])
  }

  private buildParsedDirective(mode: CommandParseMode, command: OwnerCommand): ParsedOwnerDirective {
    return {
      kind: 'parsed',
      mode,
      command,
    }
  }

  private buildClarification(
    mode: CommandParseMode,
    reason: string,
    questions: string[],
  ): ParsedOwnerDirective {
    return {
      kind: 'clarification_required',
      mode,
      clarification: {
        reason,
        questions: questions.slice(0, 3),
        max_questions: 3,
      },
    }
  }

  buildWorkforcePlan(
    now = new Date().toISOString(),
    scopedProjectId?: string,
  ): WorkforcePlan {
    const agents = this.registry.listAgents()
    const projects = this.registry
      .listProjects()
      .filter(project => !scopedProjectId || project.project_id === scopedProjectId)

    const blockedProjects = projects
      .filter(project => project.lifecycle_state !== 'closed' && project.active_agent_ids.length === 0)
      .map(project => project.project_id)

    const offlineAgents = agents
      .filter(agent => agent.status === 'offline' || agent.status === 'error')
      .map(agent => agent.agent_id)

    const recommendations: WorkforceRecommendation[] = []

    for (const project of projects) {
      const required = requiredAgentsForLifecycle(project.lifecycle_state)
      for (const agentType of required) {
        const activeMatches = agents.filter(
          agent =>
            agent.agent_type === agentType &&
            agent.status !== 'offline' &&
            agent.status !== 'error' &&
            (agent.current_project_id === undefined || agent.current_project_id === project.project_id),
        )
        if (activeMatches.length === 0) {
          recommendations.push({
            recommended_agent_type: agentType,
            quantity: 1,
            project_id: project.project_id,
            urgency: project.active_agent_ids.length === 0 ? 'critical' : 'high',
            reason: `Project ${project.project_id} (${project.lifecycle_state}) membutuhkan ${agentType} aktif.`,
          })
        }
      }
    }

    for (const agent of agents.filter(item => item.status === 'offline' || item.status === 'error')) {
      recommendations.push({
        recommended_agent_type: agent.agent_type,
        quantity: 1,
        project_id: agent.current_project_id,
        urgency: 'high',
        reason: `Agent ${agent.agent_id} sedang ${agent.status}; perlu pengganti untuk menjaga operasional.`,
      })
    }

    const busyCounts = new Map<AgentType, number>()
    for (const agent of agents) {
      if (agent.status === 'busy') {
        busyCounts.set(agent.agent_type, (busyCounts.get(agent.agent_type) ?? 0) + 1)
      }
    }
    for (const [agentType, count] of busyCounts.entries()) {
      const idleCount = agents.filter(agent => agent.agent_type === agentType && agent.status === 'idle').length
      if (count >= 2 && idleCount === 0) {
        recommendations.push({
          recommended_agent_type: agentType,
          quantity: 1,
          urgency: 'medium',
          reason: `Semua ${agentType} sedang sibuk (${count} busy, 0 idle). Tambahan kapasitas disarankan.`,
        })
      }
    }

    return {
      generated_at: now,
      objective: scopedProjectId
        ? `Analisis kebutuhan agent untuk ${scopedProjectId}`
        : 'Analisis kebutuhan agent lintas organisasi',
      active_projects: projects.filter(project => project.lifecycle_state !== 'closed').length,
      active_agents: agents.filter(agent => agent.status === 'busy' || agent.status === 'idle').length,
      blocked_projects: blockedProjects,
      offline_agents: offlineAgents,
      recommendations: dedupeRecommendations(recommendations),
    }
  }

  provisionAgents(input: {
    agentType: AgentType
    count: number
    projectId?: string
  }, now = new Date().toISOString()): AgentRegistryEntry[] {
    const created: AgentRegistryEntry[] = []
    const count = Math.max(1, Math.min(10, input.count))

    for (let index = 0; index < count; index += 1) {
      const agentId = this.buildProvisionedAgentId(input.agentType)
      const entry: AgentRegistryEntry = {
        agent_id: agentId,
        agent_type: input.agentType,
        status: 'idle',
        current_project_id: input.projectId,
        last_activity_timestamp: now,
      }
      this.registry.registerAgent(entry)
      created.push({ ...entry })
    }

    if (input.projectId) {
      const project = this.registry.getProject(input.projectId)
      if (project) {
        const nextAgentIds = Array.from(new Set([
          ...project.active_agent_ids,
          ...created.map(agent => agent.agent_id),
        ]))
        this.registry.updateProject(input.projectId, {
          active_agent_ids: nextAgentIds,
          updated_at: now,
        })
      }
    }

    this.touch(now)
    this.audit('staffing_provisioned', this.ceoAgentId, input.projectId ?? 'runtime', {
      agent_type: input.agentType,
      count,
      created_agent_ids: created.map(agent => agent.agent_id),
    }, 'ok')

    return created
  }

  serializeWorkforcePlan(plan: WorkforcePlan): string {
    const recommendations = plan.recommendations.length > 0
      ? plan.recommendations.map(
          item =>
            `- ${item.recommended_agent_type} x${item.quantity}${item.project_id ? ` [${item.project_id}]` : ''} (${item.urgency}) -> ${item.reason}`,
        ).join('\n')
      : '- Tidak ada kebutuhan agent baru yang mendesak.'

    const blockedProjects = plan.blocked_projects.length > 0
      ? plan.blocked_projects.map(projectId => `- ${projectId}`).join('\n')
      : '- None'

    const offlineAgents = plan.offline_agents.length > 0
      ? plan.offline_agents.map(agentId => `- ${agentId}`).join('\n')
      : '- None'

    return [
      '# Workforce Plan',
      '',
      `Generated: ${plan.generated_at}`,
      `Objective: ${plan.objective}`,
      '',
      '## Overview',
      `- active_projects: ${plan.active_projects}`,
      `- active_agents: ${plan.active_agents}`,
      '',
      '## Blocked Projects',
      blockedProjects,
      '',
      '## Offline Agents',
      offlineAgents,
      '',
      '## Recommendations',
      recommendations,
    ].join('\n')
  }

  private serializeProvisioningResult(
    created: AgentRegistryEntry[],
    agentType: AgentType,
    projectId: string | undefined,
    now: string,
  ): string {
    const lines = created.map(agent => `- ${agent.agent_id} (${agent.status})${agent.current_project_id ? ` -> ${agent.current_project_id}` : ''}`)
    return [
      '# Staffing Provisioned',
      '',
      `Generated: ${now}`,
      `Agent Type: ${agentType}`,
      `Count: ${created.length}`,
      `Project: ${projectId ?? '-'}`,
      '',
      '## Created Agents',
      ...(lines.length > 0 ? lines : ['- None']),
    ].join('\n')
  }

  private selectAgent(
    targetAgent: DelegationTask['target_agent'],
    projectId: string,
  ): AgentRegistryEntry | undefined {
    return this.registry
      .listAgents()
      .filter(agent => agent.agent_type === targetAgent)
      .find(
        agent =>
          agent.status !== 'offline' &&
          agent.status !== 'error' &&
          (agent.current_project_id === undefined || agent.current_project_id === projectId),
      )
  }

  private validateDelegationResult(
    task: DelegationTaskRecord,
    resultSummary: string,
  ): { valid: boolean; missing_criteria: string[] } {
    const normalized = resultSummary.toLowerCase()
    const missing = task.success_criteria.filter(criteria => {
      const words = criteria
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(word => word.length >= 4)
      return words.length > 0 && !words.every(word => normalized.includes(word))
    })

    return {
      valid: missing.length === 0,
      missing_criteria: missing,
    }
  }

  private collectAgentIssues(agents: AgentRegistryEntry[], now: string): string[] {
    return agents.flatMap(agent => {
      if (agent.status === 'offline') {
        return [
          `[ACTION REQUIRED] Agent ${agent.agent_id} is offline; last activity ${agent.last_activity_timestamp}`,
        ]
      }
      if (agent.status === 'error') {
        return [`[ACTION REQUIRED] Agent ${agent.agent_id} is in error state`]
      }
      if (agent.status === 'stale') {
        return [`Agent ${agent.agent_id} has stale activity heartbeat`]
      }

      const lastSeen = Date.parse(agent.last_activity_timestamp)
      const staleThresholdMs = this.config.monitoring.heartbeat_seconds * 3 * 1000
      if (Number.isFinite(lastSeen) && Date.parse(now) - lastSeen > staleThresholdMs) {
        return [`Agent ${agent.agent_id} heartbeat is older than ${this.config.monitoring.heartbeat_seconds * 3} seconds`]
      }
      return []
    })
  }

  private collectProjectIssues(projects: ProjectRegistryEntry[]): string[] {
    return projects.flatMap(project => {
      if (project.lifecycle_state !== 'closed' && project.active_agent_ids.length === 0) {
        return [`[ACTION REQUIRED] Project ${project.project_id} has no active agents assigned`]
      }
      return []
    })
  }

  private collectDelegationIssues(): string[] {
    return this.delegations.flatMap(task => {
      if (task.status === 'failed') {
        return [`[ACTION REQUIRED] Delegation ${task.task_id} failed: ${task.failure_reason ?? 'unknown reason'}`]
      }
      if (task.status === 'escalated') {
        return [`[ACTION REQUIRED] Delegation ${task.task_id} is escalated and needs owner review`]
      }
      return []
    })
  }

  private buildExecutiveSummary(snapshot: CompanyDashboardSnapshot, activeDelegations: number): string {
    const activeProjects = snapshot.kpis.active_projects
    const offlineAgents = snapshot.kpis.offline_agents
    const pendingApprovals = snapshot.pending_approvals.length
    return `${activeProjects} active project(s), ${activeDelegations} active delegation(s), ${offlineAgents} offline agent(s), and ${pendingApprovals} pending approval(s) as of ${snapshot.generated_at}.`
  }

  private buildNextActions(snapshot: CompanyDashboardSnapshot): string[] {
    const actions: string[] = []

    if (snapshot.pending_approvals.length > 0) {
      actions.push('Review pending approvals to unblock proposal or strategic decisions.')
    }
    if (snapshot.kpis.offline_agents > 0) {
      actions.push('Reassign or recover offline agents before client-facing deadlines slip.')
    }
    if (snapshot.kpis.blocked_projects > 0) {
      actions.push('Assign owners to projects with no active agents.')
    }
    if (this.delegations.some(task => task.status === 'failed')) {
      actions.push('Inspect failed delegations and choose between redelegation or owner escalation.')
    }
    if (actions.length === 0) {
      actions.push('Maintain current execution cadence and monitor the next dashboard refresh.')
    }

    return actions
  }

  private storeDirective(directive: StoredDirective): StoredDirective {
    this.directives.unshift(cloneStoredDirective(directive))
    this.touch(directive.received_at)
    this.audit('directive_recorded', this.ceoAgentId, directive.directive_id, { status: directive.status }, directive.summary)
    return cloneStoredDirective(this.directives[0]!)
  }

  private buildDirectiveId(timestamp: string): string {
    return `directive-${Date.parse(timestamp)}-${this.directives.length + 1}`
  }

  private loadState(state: CeoPersistentState): void {
    this.directives.push(...state.directives.map(cloneStoredDirective))
    this.decisions.push(...state.decisions.map(cloneDecision))
    this.delegations.push(...state.delegations.map(cloneDelegation))
    this.broadcasts.push(...state.broadcasts.map(cloneBroadcast))
    this.auditLog.push(...state.audit_log.map(cloneAuditEntry))
    this.config = this.mergeConfig(defaultCeoRuntimeConfig, state.config)
    this.lastActivityTimestamp = state.last_activity_timestamp
    this.recoveryLoaded = true
  }

  private mergeConfig(base: CeoRuntimeConfig, overrides?: Partial<CeoRuntimeConfig>): CeoRuntimeConfig {
    return {
      ...base,
      ...overrides,
      report_schedule: {
        ...base.report_schedule,
        ...overrides?.report_schedule,
      },
      broadcast_groups: {
        ...base.broadcast_groups,
        ...overrides?.broadcast_groups,
      },
      monitoring: {
        ...base.monitoring,
        ...overrides?.monitoring,
      },
      owner_auth: {
        ...base.owner_auth,
        ...overrides?.owner_auth,
      },
      commands_requiring_confirmation:
        overrides?.commands_requiring_confirmation ?? [...base.commands_requiring_confirmation],
    }
  }

  private resolveBroadcastTargets(
    group?: BroadcastGroup,
    explicitAgentIds?: string[],
  ): string[] {
    if (explicitAgentIds && explicitAgentIds.length > 0) {
      return [...new Set(explicitAgentIds)]
    }

    const agentTypes = group ? this.config.broadcast_groups[group] : []
    return this.registry
      .listAgents()
      .filter(agent => agent.agent_id !== this.ceoAgentId && agentTypes.includes(agent.agent_type))
      .map(agent => agent.agent_id)
  }

  private computeBroadcastStatus(broadcast: BroadcastMessage): BroadcastMessage['status'] {
    const values = Object.values(broadcast.acknowledgments)
    if (values.length === 0) return 'completed'
    if (values.every(status => status === 'acknowledged')) return 'completed'
    if (values.some(status => status === 'acknowledged' || status === 'unresponsive')) return 'partial'
    return 'pending_ack'
  }

  private readNumericFlag(tokens: string[], flag: string): number | undefined {
    const index = tokens.indexOf(flag)
    if (index < 0) return undefined
    const value = Number(tokens[index + 1])
    return Number.isFinite(value) ? value : undefined
  }

  private readStringFlag(tokens: string[], flag: string): string | undefined {
    const index = tokens.indexOf(flag)
    if (index < 0) return undefined
    return tokens[index + 1]
  }

  private inferReportType(input: string): CompanyReport['report_type'] | undefined {
    if (input.includes('daily') || input.includes('harian')) return 'daily'
    if (input.includes('weekly') || input.includes('mingguan')) return 'weekly'
    if (input.includes('kpi')) return 'kpi'
    if (input.includes('project') || input.includes('proyek')) return 'project'
    if (input.includes('agent')) return 'agent'
    return undefined
  }

  private inferPeriod(input: string): string | undefined {
    if (input.includes('today') || input.includes('hari ini')) return 'today'
    if (input.includes('this week') || input.includes('minggu ini')) return 'this-week'
    return undefined
  }

  private inferAgentType(input: string): AgentType | undefined {
    const normalized = input.trim().toLowerCase()
    if (normalized.includes('sales')) return 'sales_agent'
    if (normalized.includes('marketing')) return 'marketing_agent'
    if (normalized.includes('product')) return 'product_agent'
    if (normalized.includes('engineering') || normalized.includes('engineer') || normalized.includes('developer') || normalized.includes('dev')) {
      return 'engineering_agent'
    }
    if (normalized.includes('project manager') || normalized === 'pm' || normalized.includes(' pm ')) {
      return 'project_manager_agent'
    }
    if (normalized.includes('support')) return 'support_agent'
    return undefined
  }

  private readOptionalParameterString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined
    }
    const normalized = value.trim()
    return normalized || undefined
  }

  private normalizeProvisionCount(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.max(1, Math.min(10, Math.floor(value)))
    }
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) {
        return Math.max(1, Math.min(10, Math.floor(parsed)))
      }
    }
    return 1
  }

  private buildProvisionedAgentId(agentType: AgentType): string {
    const prefix = agentType.replace('_agent', '')
    const next = this.registry
      .listAgents()
      .filter(agent => agent.agent_type === agentType)
      .reduce((maxValue, agent) => {
        const match = agent.agent_id.match(/-(\d+)$/)
        const numericSuffix = match ? Number(match[1]) : 0
        return Number.isFinite(numericSuffix) ? Math.max(maxValue, numericSuffix) : maxValue
      }, 0) + 1
    return `${prefix}-${next}`
  }

  private findDelegation(taskId: string): DelegationTaskRecord | undefined {
    return this.delegations.find(task => task.task_id === taskId)
  }

  private hasOperationalDegradation(): boolean {
    return (
      this.registry.listAgents().some(agent => agent.status === 'offline' || agent.status === 'error') ||
      this.delegations.some(task => task.status === 'failed' || task.status === 'escalated')
    )
  }

  private pruneFailedAuthAttempts(now: string): void {
    const cutoff =
      Date.parse(now) - this.config.owner_auth.failed_attempt_window_seconds * 1000
    while (this.failedAuthAttempts.length > 0) {
      const oldest = this.failedAuthAttempts[this.failedAuthAttempts.length - 1]
      if (oldest === undefined || Date.parse(oldest) >= cutoff) {
        break
      }
      this.failedAuthAttempts.pop()
    }
  }

  private isLocked(now: string): boolean {
    return this.accessLockUntil !== undefined && Date.parse(now) < Date.parse(this.accessLockUntil)
  }

  private touch(now = new Date().toISOString()): void {
    this.lastActivityTimestamp = now
  }

  private audit(
    actionType: string,
    actor: string,
    target: string,
    parameters: Record<string, unknown>,
    result: string,
  ): void {
    this.auditLog.unshift({
      timestamp: new Date().toISOString(),
      action_type: actionType,
      actor,
      target,
      parameters: { ...parameters },
      result,
    })
  }
}
