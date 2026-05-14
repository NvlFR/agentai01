import type {
  AgentType,
  Agent_Message,
  AgentRegistryEntry,
  Approval_Request,
  ApprovalDecision,
  Approval_Gate,
  ProjectRegistryEntry,
} from '../../domain/types.js'

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low'

export type CommandParseMode = 'structured' | 'natural'

export type DirectiveExecutionStatus =
  | 'received'
  | 'clarification_required'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'rejected'

export type OwnerCommandType =
  | 'status'
  | 'history'
  | 'report'
  | 'decisions'
  | 'delegate'

export type OwnerCommand = {
  command_type: OwnerCommandType
  parameters: Record<string, unknown>
  raw_input: string
  parsed_at: string
}

export type ClarificationPrompt = {
  reason: string
  questions: string[]
  max_questions: 3
}

export type ParsedOwnerDirective =
  | {
      kind: 'parsed'
      mode: CommandParseMode
      command: OwnerCommand
    }
  | {
      kind: 'clarification_required'
      mode: CommandParseMode
      clarification: ClarificationPrompt
    }

export type StoredDirective = {
  directive_id: string
  status: DirectiveExecutionStatus
  received_at: string
  command?: OwnerCommand
  raw_input: string
  summary: string
}

export type StrategicPlanStep = {
  step_id: string
  objective: string
  target_agent?: AgentType
  depends_on: string[]
  success_criteria: string[]
  estimated_minutes: number
}

export type StrategicPlan = {
  directive_id: string
  objective: string
  involved_agents: AgentType[]
  execution_order: StrategicPlanStep[]
  estimated_completion_minutes: number
  risks: string[]
  needs_owner_approval: boolean
}

export type DelegationTaskStatus =
  | 'draft'
  | 'delegated'
  | 'completed'
  | 'failed'
  | 'escalated'

export type DelegationTask = {
  task_id: string
  target_agent: AgentType
  project_id: string
  assigned_agent_id?: string
  instructions: string
  priority: PriorityLevel
  deadline?: string
  context: Record<string, unknown>
  success_criteria: string[]
  status: DelegationTaskStatus
}

export type DelegationTaskEvent =
  | 'created'
  | 'delegated'
  | 'acknowledged'
  | 'instruction_added'
  | 'redelegated'
  | 'completed'
  | 'failed'
  | 'escalated'

export type DelegationTaskRecord = DelegationTask & {
  created_at: string
  updated_at: string
  ack_status: 'pending' | 'acknowledged' | 'unresponsive'
  latest_result_summary?: string
  failure_reason?: string
  status_history: Array<{
    status: DelegationTaskStatus
    event: DelegationTaskEvent
    timestamp: string
    note?: string
  }>
}

export type DelegationEnvelope = {
  kind: 'delegation_task'
  task: DelegationTaskRecord
}

export type DelegationMessage = Agent_Message<DelegationEnvelope> & {
  from: 'ceo_agent'
  message_type: 'status_update'
}

export type StrategicDecisionCategory =
  | 'resource_allocation'
  | 'project_priority'
  | 'client_escalation'
  | 'agent_management'
  | 'strategic_direction'

export type StrategicDecision = {
  decision_id: string
  timestamp: string
  category: StrategicDecisionCategory
  context: string
  options_considered: string[]
  chosen_option: string
  rationale: string
  expected_impact: string[]
  related_project_ids: string[]
  related_agent_ids: string[]
  supersedes_decision_id?: string
}

export type CompanyReportType = 'daily' | 'weekly' | 'project' | 'agent' | 'kpi'

export type CompanyDashboardSnapshot = {
  generated_at: string
  agents: AgentRegistryEntry[]
  projects: ProjectRegistryEntry[]
  kpis: {
    active_projects: number
    active_agents: number
    offline_agents: number
    blocked_projects: number
    busy_agents: number
  }
  pending_approvals: Approval_Request[]
  issues: string[]
}

export type CompanyReport = {
  report_id: string
  report_type: CompanyReportType
  generated_at: string
  period_label: string
  executive_summary: string
  key_metrics: Record<string, number | string>
  active_projects: Array<{
    project_id: string
    client_id: string
    lifecycle_state: ProjectRegistryEntry['lifecycle_state']
    active_agents: string[]
    current_milestone: string
  }>
  decisions_made: StrategicDecision[]
  issues_and_risks: string[]
  next_actions: string[]
}

export type HealthStatus = 'starting' | 'ready' | 'degraded' | 'recovering' | 'stopped' | 'locked'

export type CeoHealthSnapshot = {
  status: HealthStatus
  uptime_seconds: number
  active_tasks: number
  last_activity_timestamp: string
}

export type CeoReadinessSnapshot = CeoHealthSnapshot & {
  ready: boolean
  registry_connected: boolean
  recovery_loaded: boolean
  lock_active: boolean
  monitoring_cadence_minutes: number
}

export type BroadcastGroup = 'all' | 'delivery_team' | 'client_facing'

export type BroadcastStatus = 'pending_ack' | 'completed' | 'partial' | 'blocked'

export type BroadcastMessage = {
  broadcast_id: string
  sender: 'ceo_agent'
  timestamp: string
  priority: PriorityLevel
  content: string
  target_group?: BroadcastGroup
  target_agent_ids: string[]
  requires_acknowledgment: boolean
  ack_timeout_seconds: number
  status: BroadcastStatus
  acknowledgments: Record<string, 'pending' | 'acknowledged' | 'unresponsive'>
}

export type CeoAuditLogEntry = {
  timestamp: string
  action_type: string
  actor: string
  target: string
  parameters: Record<string, unknown>
  result: string
}

export type CeoRuntimeConfig = {
  report_schedule: {
    daily_time_utc: string
  }
  kpi_alert_threshold: number
  broadcast_groups: Record<BroadcastGroup, AgentType[]>
  commands_requiring_confirmation: OwnerCommandType[]
  monitoring: {
    active_project_interval_minutes: number
    idle_interval_minutes: number
    heartbeat_seconds: number
    broadcast_ack_timeout_seconds: number
  }
  owner_auth: {
    owner_id: string
    allowed_token_ids: string[]
    failed_attempt_threshold: number
    failed_attempt_window_seconds: number
    temporary_lock_minutes: number
  }
}

export type CeoRuntimeLifecycleState = 'startup' | 'running' | 'recovering' | 'shutdown'

export type CeoPersistentState = {
  directives: StoredDirective[]
  decisions: StrategicDecision[]
  delegations: DelegationTaskRecord[]
  broadcasts: BroadcastMessage[]
  audit_log: CeoAuditLogEntry[]
  config: CeoRuntimeConfig
  last_activity_timestamp: string
}

export type PermissionCheck = {
  allowed: boolean
  reason?: string
  requires_confirmation: boolean
}

export type CeoAgentDefinition = {
  agentType: 'ceo'
  description: string
  tools: string[]
  systemPrompt: string
}

export type CeoQueryEngineConfig = {
  engine: 'QueryEngine'
  max_clarification_questions: number
  response_format: 'markdown'
  heartbeat_seconds: number
}

export const ceoAgentDefinition: CeoAgentDefinition = {
  agentType: 'ceo',
  description: 'Strategic orchestrator for AI Company operations and owner directives.',
  tools: [
    'agent_delegate',
    'company_dashboard',
    'decision_make',
    'report_generate',
    'priority_set',
    'message_broadcast',
  ],
  systemPrompt:
    'Coordinate the company, delegate work, monitor dashboard health, protect owner intent, and escalate only when needed.',
}

export const defaultCeoRuntimeConfig: CeoRuntimeConfig = {
  report_schedule: {
    daily_time_utc: '09:00',
  },
  kpi_alert_threshold: 0.2,
  broadcast_groups: {
    all: [
      'sales_agent',
      'marketing_agent',
      'product_agent',
      'engineering_agent',
      'project_manager_agent',
      'support_agent',
    ],
    delivery_team: ['product_agent', 'engineering_agent'],
    client_facing: ['sales_agent', 'support_agent'],
  },
  commands_requiring_confirmation: ['delegate'],
  monitoring: {
    active_project_interval_minutes: 5,
    idle_interval_minutes: 30,
    heartbeat_seconds: 60,
    broadcast_ack_timeout_seconds: 30,
  },
  owner_auth: {
    owner_id: 'owner',
    allowed_token_ids: [],
    failed_attempt_threshold: 5,
    failed_attempt_window_seconds: 60,
    temporary_lock_minutes: 15,
  },
}

export function createCeoQueryEngineConfig(
  config: CeoRuntimeConfig = defaultCeoRuntimeConfig,
): CeoQueryEngineConfig {
  return {
    engine: 'QueryEngine',
    max_clarification_questions: 3,
    response_format: 'markdown',
    heartbeat_seconds: config.monitoring.heartbeat_seconds,
  }
}

export type StrategicApprovalRequestInput = {
  request_id: string
  timestamp: string
  summary: string
  recommendation: string
  risks: string[]
  artifact_ref: string
  project_id?: string
  gate?: Approval_Gate
  options?: readonly ApprovalDecision[]
}

export function createStrategicApprovalRequest(
  input: StrategicApprovalRequestInput,
): Approval_Request {
  return {
    request_id: input.request_id,
    gate: input.gate ?? 'strategic_decision',
    from_agent: 'ceo_agent',
    timestamp: input.timestamp,
    project_id: input.project_id,
    summary: input.summary,
    recommendation: input.recommendation,
    risks: [...input.risks],
    options: input.options ?? ['approve', 'reject', 'revise'],
    artifact_ref: input.artifact_ref,
  }
}
