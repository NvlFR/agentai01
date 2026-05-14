import type {
  AgentType,
  ApprovalDecision,
  Approval_Gate,
  Agent_Message,
  Lifecycle_State,
} from '../../domain/types.js'

export type MilestoneStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'at_risk'
  | 'awaiting_ack'
  | 'blocked'

export type ProjectRiskSeverity = 'low' | 'medium' | 'high' | 'critical'

export type ProjectRiskTrigger =
  | 'unrealistic_deadline'
  | 'overdue_milestone'
  | 'stalled_blocker'
  | 'stalled_approval'
  | 'handoff_sla_breach'

export type HandoffType = 'lead_handoff' | 'discovery_handoff'

export type HandoffAckStatus = 'pending' | 'acknowledged' | 'breached'

export type ProjectMilestone = {
  milestone_id: string
  project_id: string
  owner_agent: AgentType
  title: string
  lifecycle_state: Lifecycle_State
  status: MilestoneStatus
  due_at: string
  depends_on: string[]
  approval_gate?: Approval_Gate
  started_at?: string
  completed_at?: string
  notes?: string
}

export type ProjectTimeline = {
  project_id: string
  baseline_version: number
  created_at: string
  updated_at: string
  milestones: ProjectMilestone[]
}

export type HandoffRecord = {
  handoff_id: string
  project_id: string
  handoff_type: HandoffType
  from_agent: AgentType
  to_agent: AgentType
  sent_at: string
  ack_status: HandoffAckStatus
  acked_at?: string
  ack_sla_hours: number
}

export type PendingApproval = {
  gate: Approval_Gate
  project_id: string
  requested_by: AgentType
  requested_at: string
  status: 'pending' | 'approved' | 'rejected' | 'revise_requested'
  last_response_at?: string
}

export type ProjectBlocker = {
  blocker_id: string
  project_id: string
  severity: ProjectRiskSeverity
  affected_agents: AgentType[]
  root_cause: string
  recommended_action: string
  opened_at: string
  resolved_at?: string
  resolution_notes?: string
}

export type ProjectRisk = {
  risk_id: string
  project_id: string
  severity: ProjectRiskSeverity
  trigger: ProjectRiskTrigger
  summary: string
  recommended_action: string
  created_at: string
  related_milestone_id?: string
  related_blocker_id?: string
}

export type TimelineHealthSnapshot = {
  active_milestone?: ProjectMilestone
  completion_percentage: number
  open_blockers: number
  pending_approvals: Approval_Gate[]
  milestone_status: MilestoneStatus | 'on_track'
  risks: ProjectRisk[]
}

export type ProjectHistoryEventType =
  | 'timeline_created'
  | 'status_update'
  | 'lifecycle_transition'
  | 'handoff_sent'
  | 'handoff_acknowledged'
  | 'handoff_reminder'
  | 'approval_requested'
  | 'approval_responded'
  | 'blocker_opened'
  | 'blocker_resolved'
  | 'risk_alert'
  | 'report_generated'

export type ProjectHistoryEvent = {
  event_id: string
  project_id: string
  event_type: ProjectHistoryEventType
  actor: AgentType | 'owner' | 'system'
  summary: string
  created_at: string
  metadata?: Record<string, string | number | boolean | null | undefined>
}

export type CoordinationTaskType =
  | 'status_reminder'
  | 'handoff_sla_check'
  | 'approval_followup'
  | 'blocker_escalation'
  | 'periodic_report'

export type CoordinationTaskStatus =
  | 'queued'
  | 'running'
  | 'waiting_external'
  | 'completed'
  | 'failed'

export type CoordinationTask = {
  task_id: string
  project_id: string
  task_type: CoordinationTaskType
  status: CoordinationTaskStatus
  created_at: string
  updated_at: string
  run_after: string
  related_milestone_id?: string
  related_handoff_id?: string
  related_approval_gate?: Approval_Gate
  notes?: string
}

export type ProjectStatusSummary = {
  project_id: string
  lifecycle_state: Lifecycle_State
  current_milestone: string
  milestone_status: MilestoneStatus | 'on_track'
  completion_percentage: number
  blockers: ProjectBlocker[]
  pending_approvals: PendingApproval[]
  risks: ProjectRisk[]
  next_step: string
  requires_action: boolean
  active_handoffs: HandoffRecord[]
}

export type PeriodicStatusReport = {
  project_id: string
  headline: string
  generated_at: string
  summary: string
  next_step: string
  lifecycle_state: Lifecycle_State
  current_milestone: string
  blockers: string[]
  pending_approvals: Approval_Gate[]
  risks: string[]
}

export type ProjectManagerMessage = Agent_Message<{
  summary: string
  project_status?: ProjectStatusSummary
  blocker_id?: string
  risk_id?: string
}>

const DEFAULT_HANDOFF_SLA_HOURS = 24
const DEFAULT_BLOCKER_ESCALATION_HOURS = 24
const DEFAULT_APPROVAL_ESCALATION_HOURS = 24

function addDays(timestamp: string, days: number): string {
  const date = new Date(timestamp)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString()
}

export function createBaselineTimeline(
  projectId: string,
  createdAt: string,
  options: {
    deliveryTargetAt?: string
    discoveryDays?: number
    implementationDays?: number
    qaDays?: number
  } = {},
): ProjectTimeline {
  const discoveryDays = options.discoveryDays ?? 3
  const implementationDays = options.implementationDays ?? 7
  const qaDays = options.qaDays ?? 2

  const discoveryDue = addDays(createdAt, discoveryDays)
  const implementationDue = addDays(discoveryDue, implementationDays)
  const qaDue = addDays(implementationDue, qaDays)
  const deliveryDue = options.deliveryTargetAt ?? addDays(qaDue, 1)

  return {
    project_id: projectId,
    baseline_version: 1,
    created_at: createdAt,
    updated_at: createdAt,
    milestones: [
      {
        milestone_id: 'project_created',
        project_id: projectId,
        owner_agent: 'project_manager_agent',
        title: 'Project created',
        lifecycle_state: 'won',
        status: 'completed',
        due_at: createdAt,
        depends_on: [],
        completed_at: createdAt,
      },
      {
        milestone_id: 'lead_handoff_sent',
        project_id: projectId,
        owner_agent: 'sales_agent',
        title: 'Lead handoff sent',
        lifecycle_state: 'won',
        status: 'awaiting_ack',
        due_at: createdAt,
        depends_on: ['project_created'],
      },
      {
        milestone_id: 'discovery_started',
        project_id: projectId,
        owner_agent: 'product_agent',
        title: 'Discovery started',
        lifecycle_state: 'discovery',
        status: 'pending',
        due_at: discoveryDue,
        depends_on: ['lead_handoff_sent'],
      },
      {
        milestone_id: 'spec_approval_pending',
        project_id: projectId,
        owner_agent: 'product_agent',
        title: 'Spec approval pending',
        lifecycle_state: 'discovery',
        status: 'pending',
        due_at: discoveryDue,
        depends_on: ['discovery_started'],
        approval_gate: 'spec_final',
      },
      {
        milestone_id: 'discovery_handoff_sent',
        project_id: projectId,
        owner_agent: 'product_agent',
        title: 'Discovery handoff sent',
        lifecycle_state: 'discovery',
        status: 'awaiting_ack',
        due_at: discoveryDue,
        depends_on: ['spec_approval_pending'],
      },
      {
        milestone_id: 'implementation_started',
        project_id: projectId,
        owner_agent: 'engineering_agent',
        title: 'Implementation started',
        lifecycle_state: 'implementation',
        status: 'pending',
        due_at: implementationDue,
        depends_on: ['discovery_handoff_sent'],
      },
      {
        milestone_id: 'qa_started',
        project_id: projectId,
        owner_agent: 'engineering_agent',
        title: 'QA started',
        lifecycle_state: 'qa',
        status: 'pending',
        due_at: qaDue,
        depends_on: ['implementation_started'],
      },
      {
        milestone_id: 'delivery_approval_pending',
        project_id: projectId,
        owner_agent: 'engineering_agent',
        title: 'Delivery approval pending',
        lifecycle_state: 'qa',
        status: 'pending',
        due_at: deliveryDue,
        depends_on: ['qa_started'],
        approval_gate: 'delivery_final',
      },
      {
        milestone_id: 'delivered',
        project_id: projectId,
        owner_agent: 'engineering_agent',
        title: 'Delivered',
        lifecycle_state: 'delivered',
        status: 'pending',
        due_at: deliveryDue,
        depends_on: ['delivery_approval_pending'],
      },
    ],
  }
}

export function detectInitialTimelineRisk(
  timeline: ProjectTimeline,
  createdAt: string,
): ProjectRisk | null {
  const deliveryMilestone = timeline.milestones.find(
    milestone => milestone.milestone_id === 'delivered',
  )
  if (!deliveryMilestone) {
    return null
  }

  const deliveryMs = new Date(deliveryMilestone.due_at).getTime()
  const createdMs = new Date(createdAt).getTime()
  const minimumWindowDays = 13
  const minimumWindowMs = minimumWindowDays * 24 * 60 * 60 * 1000

  if (deliveryMs - createdMs >= minimumWindowMs) {
    return null
  }

  return {
    risk_id: `${timeline.project_id}:unrealistic_deadline:${createdAt}`,
    project_id: timeline.project_id,
    severity: 'high',
    trigger: 'unrealistic_deadline',
    summary: 'Requested delivery target is tighter than the baseline delivery window.',
    recommended_action:
      'Rebaseline the plan or negotiate scope before execution starts.',
    created_at: createdAt,
    related_milestone_id: deliveryMilestone.milestone_id,
  }
}

export function createHandoffRecord(
  projectId: string,
  handoffType: HandoffType,
  sentAt: string,
  ackSlaHours = DEFAULT_HANDOFF_SLA_HOURS,
): HandoffRecord {
  return {
    handoff_id: `${projectId}:${handoffType}:${sentAt}`,
    project_id: projectId,
    handoff_type: handoffType,
    from_agent:
      handoffType === 'lead_handoff' ? 'sales_agent' : 'product_agent',
    to_agent:
      handoffType === 'lead_handoff' ? 'product_agent' : 'engineering_agent',
    sent_at: sentAt,
    ack_status: 'pending',
    ack_sla_hours: ackSlaHours,
  }
}

export function acknowledgeHandoff(
  record: HandoffRecord,
  ackedAt: string,
): HandoffRecord {
  return {
    ...record,
    ack_status: 'acknowledged',
    acked_at: ackedAt,
  }
}

export function evaluateHandoffAlert(
  record: HandoffRecord,
  now: string,
): {
  handoff: HandoffRecord
  blocker?: ProjectBlocker
  risk?: ProjectRisk
  reminder_message?: ProjectManagerMessage
} {
  const elapsedHours =
    (new Date(now).getTime() - new Date(record.sent_at).getTime()) /
    (1000 * 60 * 60)
  if (record.ack_status !== 'pending' || elapsedHours <= record.ack_sla_hours) {
    return { handoff: record }
  }

  const breached: HandoffRecord = {
    ...record,
    ack_status: 'breached',
  }

  return {
    handoff: breached,
    blocker: {
      blocker_id: `${record.handoff_id}:blocker`,
      project_id: record.project_id,
      severity: 'high',
      affected_agents: [record.from_agent, record.to_agent],
      root_cause: `${record.handoff_type} has not been acknowledged within SLA.`,
      recommended_action: 'Send reminder and escalate if the dependency remains blocked.',
      opened_at: now,
    },
    risk: {
      risk_id: `${record.handoff_id}:risk`,
      project_id: record.project_id,
      severity: 'high',
      trigger: 'handoff_sla_breach',
      summary: `${record.handoff_type} is at risk because acknowledgment missed SLA.`,
      recommended_action:
        'Follow up with the receiving agent and re-evaluate the dependent milestone.',
      created_at: now,
    },
    reminder_message: {
      from: 'project_manager_agent',
      to: record.to_agent,
      message_type: 'status_update',
      project_id: record.project_id,
      timestamp: now,
      payload: {
        summary: `Reminder: acknowledge ${record.handoff_type} for ${record.project_id}.`,
      },
    },
  }
}

export function createPendingApproval(
  gate: Approval_Gate,
  projectId: string,
  requestedBy: AgentType,
  requestedAt: string,
): PendingApproval {
  return {
    gate,
    project_id: projectId,
    requested_by: requestedBy,
    requested_at: requestedAt,
    status: 'pending',
  }
}

export function applyApprovalResponse(
  approval: PendingApproval,
  decision: ApprovalDecision,
  respondedAt: string,
): PendingApproval {
  return {
    ...approval,
    status:
      decision === 'approve'
        ? 'approved'
        : decision === 'reject'
          ? 'rejected'
          : 'revise_requested',
    last_response_at: respondedAt,
  }
}

export function evaluateApprovalEscalation(
  approval: PendingApproval,
  now: string,
  thresholdHours = DEFAULT_APPROVAL_ESCALATION_HOURS,
): ProjectRisk | null {
  if (approval.status !== 'pending') {
    return null
  }

  const ageHours =
    (new Date(now).getTime() - new Date(approval.requested_at).getTime()) /
    (1000 * 60 * 60)
  if (ageHours <= thresholdHours) {
    return null
  }

  return {
    risk_id: `${approval.project_id}:${approval.gate}:approval:${now}`,
    project_id: approval.project_id,
    severity: 'high',
    trigger: 'stalled_approval',
    summary: `Approval gate ${approval.gate} is still pending beyond the configured threshold.`,
    recommended_action: 'Escalate to the owner or CEO for a decision.',
    created_at: now,
  }
}

export function openProjectBlocker(input: {
  project_id: string
  severity: ProjectRiskSeverity
  affected_agents: AgentType[]
  root_cause: string
  recommended_action: string
  opened_at: string
}): ProjectBlocker {
  return {
    blocker_id: `${input.project_id}:blocker:${input.opened_at}`,
    project_id: input.project_id,
    severity: input.severity,
    affected_agents: input.affected_agents,
    root_cause: input.root_cause,
    recommended_action: input.recommended_action,
    opened_at: input.opened_at,
  }
}

export function resolveProjectBlocker(
  blocker: ProjectBlocker,
  resolvedAt: string,
  resolutionNotes: string,
): ProjectBlocker {
  return {
    ...blocker,
    resolved_at: resolvedAt,
    resolution_notes: resolutionNotes,
  }
}

export function evaluateBlockerEscalation(
  blocker: ProjectBlocker,
  now: string,
  thresholdHours = DEFAULT_BLOCKER_ESCALATION_HOURS,
): ProjectRisk | null {
  if (blocker.resolved_at) {
    return null
  }

  const ageHours =
    (new Date(now).getTime() - new Date(blocker.opened_at).getTime()) /
    (1000 * 60 * 60)
  if (ageHours <= thresholdHours) {
    return null
  }

  return {
    risk_id: `${blocker.project_id}:${blocker.blocker_id}:stalled:${now}`,
    project_id: blocker.project_id,
    severity: blocker.severity,
    trigger: 'stalled_blocker',
    summary: `Blocker ${blocker.blocker_id} remains unresolved.`,
    recommended_action: blocker.recommended_action,
    created_at: now,
    related_blocker_id: blocker.blocker_id,
  }
}

export function createCoordinationTask(input: {
  project_id: string
  task_type: CoordinationTaskType
  created_at: string
  run_after?: string
  related_milestone_id?: string
  related_handoff_id?: string
  related_approval_gate?: Approval_Gate
  notes?: string
}): CoordinationTask {
  return {
    task_id: `${input.project_id}:${input.task_type}:${input.created_at}`,
    project_id: input.project_id,
    task_type: input.task_type,
    status: 'queued',
    created_at: input.created_at,
    updated_at: input.created_at,
    run_after: input.run_after ?? input.created_at,
    related_milestone_id: input.related_milestone_id,
    related_handoff_id: input.related_handoff_id,
    related_approval_gate: input.related_approval_gate,
    notes: input.notes,
  }
}

export function updateCoordinationTask(
  task: CoordinationTask,
  status: CoordinationTaskStatus,
  updatedAt: string,
  notes?: string,
): CoordinationTask {
  return {
    ...task,
    status,
    updated_at: updatedAt,
    notes: notes ?? task.notes,
  }
}

export function recoverCoordinationTasks(
  tasks: CoordinationTask[],
  now: string,
): CoordinationTask[] {
  return tasks.map(task =>
    task.status === 'running'
      ? {
          ...task,
          status: 'queued',
          updated_at: now,
          notes: task.notes ?? 'Recovered after restart.',
        }
      : { ...task },
  )
}

export function createProjectHistoryEvent(
  input: Omit<ProjectHistoryEvent, 'event_id'>,
): ProjectHistoryEvent {
  return {
    ...input,
    event_id: `${input.project_id}:${input.event_type}:${input.created_at}`,
  }
}

export function buildProjectStatusSummary(input: {
  project_id: string
  lifecycle_state: Lifecycle_State
  current_milestone: string
  snapshot: TimelineHealthSnapshot
  blockers: ProjectBlocker[]
  approvals: PendingApproval[]
  handoffs?: HandoffRecord[]
}): ProjectStatusSummary {
  const pendingApprovals = input.approvals.filter(
    approval => approval.status === 'pending',
  )
  const openBlockers = input.blockers.filter(blocker => !blocker.resolved_at)
  const activeHandoffs = (input.handoffs ?? []).filter(
    handoff => handoff.ack_status === 'pending' || handoff.ack_status === 'breached',
  )
  const nextStep = pendingApprovals.length > 0
    ? `Wait for owner approval on ${pendingApprovals[0]!.gate}.`
    : activeHandoffs.length > 0
      ? `Chase ${activeHandoffs[0]!.handoff_type} acknowledgment from ${activeHandoffs[0]!.to_agent}.`
      : openBlockers.length > 0
        ? openBlockers[0]!.recommended_action
        : input.snapshot.active_milestone
          ? `Advance milestone ${input.snapshot.active_milestone.milestone_id}.`
          : 'Confirm the next lifecycle update from the delivery team.'

  return {
    project_id: input.project_id,
    lifecycle_state: input.lifecycle_state,
    current_milestone: input.current_milestone,
    milestone_status: input.snapshot.milestone_status,
    completion_percentage: input.snapshot.completion_percentage,
    blockers: openBlockers,
    pending_approvals: pendingApprovals,
    risks: input.snapshot.risks,
    next_step: nextStep,
    requires_action: pendingApprovals.length > 0 || openBlockers.length > 0,
    active_handoffs: activeHandoffs,
  }
}

export function formatProjectStatusCommand(summary: ProjectStatusSummary): string {
  const prefix = summary.requires_action ? '[ACTION REQUIRED] ' : ''
  const blockerText =
    summary.blockers.length === 0
      ? 'none'
      : summary.blockers.map(blocker => blocker.root_cause).join('; ')
  const riskText =
    summary.risks.length === 0
      ? 'none'
      : summary.risks.map(risk => risk.summary).join('; ')
  const approvalText =
    summary.pending_approvals.length === 0
      ? 'none'
      : summary.pending_approvals.map(approval => approval.gate).join(', ')

  return `${prefix}phase=${summary.lifecycle_state}; milestone=${summary.current_milestone}; status=${summary.milestone_status}; blockers=${blockerText}; risks=${riskText}; approvals=${approvalText}; next=${summary.next_step}`
}

export function formatProjectHistoryCommand(
  projectId: string,
  history: ProjectHistoryEvent[],
): string[] {
  return history
    .filter(event => event.project_id === projectId)
    .sort((left, right) => left.created_at.localeCompare(right.created_at))
    .map(event => `${event.created_at} [${event.event_type}] ${event.summary}`)
}

export function generatePeriodicStatusReport(
  summary: ProjectStatusSummary,
  generatedAt: string,
): PeriodicStatusReport {
  return {
    project_id: summary.project_id,
    headline: `${summary.requires_action ? '[ACTION REQUIRED] ' : ''}Project ${summary.project_id} is ${summary.milestone_status}`,
    generated_at: generatedAt,
    summary: `Lifecycle ${summary.lifecycle_state} at milestone ${summary.current_milestone} with ${summary.completion_percentage}% completion.`,
    next_step: summary.next_step,
    lifecycle_state: summary.lifecycle_state,
    current_milestone: summary.current_milestone,
    blockers: summary.blockers.map(blocker => blocker.root_cause),
    pending_approvals: summary.pending_approvals.map(approval => approval.gate),
    risks: summary.risks.map(risk => risk.summary),
  }
}

export function evaluateTimelineHealth(
  timeline: ProjectTimeline,
  blockers: ProjectBlocker[],
  approvals: PendingApproval[],
  now: string,
): TimelineHealthSnapshot {
  const activeMilestone = timeline.milestones.find(
    milestone =>
      milestone.status === 'in_progress' || milestone.status === 'awaiting_ack',
  )
  const completedCount = timeline.milestones.filter(
    milestone => milestone.status === 'completed',
  ).length
  const openBlockers = blockers.filter(blocker => !blocker.resolved_at)
  const risks: ProjectRisk[] = []
  const nowMs = new Date(now).getTime()

  for (const milestone of timeline.milestones) {
    if (
      milestone.status !== 'completed' &&
      new Date(milestone.due_at).getTime() < nowMs
    ) {
      risks.push({
        risk_id: `${timeline.project_id}:${milestone.milestone_id}:overdue`,
        project_id: timeline.project_id,
        severity: 'high',
        trigger: 'overdue_milestone',
        summary: `Milestone ${milestone.milestone_id} is overdue`,
        recommended_action:
          'Review dependencies, owner status, and rebaseline the timeline.',
        created_at: now,
        related_milestone_id: milestone.milestone_id,
      })
    }
  }

  for (const blocker of openBlockers) {
    if (blocker.severity === 'high' || blocker.severity === 'critical') {
      risks.push({
        risk_id: `${timeline.project_id}:${blocker.blocker_id}:blocked`,
        project_id: timeline.project_id,
        severity: blocker.severity,
        trigger: 'stalled_blocker',
        summary: `Open blocker ${blocker.blocker_id} is impacting delivery`,
        recommended_action: blocker.recommended_action,
        created_at: now,
        related_blocker_id: blocker.blocker_id,
      })
    }
  }

  return {
    active_milestone: activeMilestone,
    completion_percentage:
      timeline.milestones.length === 0
        ? 0
        : Math.round((completedCount / timeline.milestones.length) * 100),
    open_blockers: openBlockers.length,
    pending_approvals: approvals
      .filter(approval => approval.status === 'pending')
      .map(approval => approval.gate),
    milestone_status:
      openBlockers.length > 0
        ? 'blocked'
        : risks.length > 0
          ? 'at_risk'
          : activeMilestone?.status ?? 'on_track',
    risks,
  }
}
