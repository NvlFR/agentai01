export type LifecycleState =
  | 'lead'
  | 'qualified'
  | 'proposal'
  | 'won'
  | 'discovery'
  | 'implementation'
  | 'qa'
  | 'delivered'
  | 'support'
  | 'closed'

export type LifecycleEvent =
  | 'lead_created'
  | 'lead_qualified'
  | 'proposal_sent'
  | 'deal_won'
  | 'discovery_started'
  | 'build_started'
  | 'final_validation_started'
  | 'delivery_approved'
  | 'post_delivery_issue'
  | 'support_closed'

export type AgentType =
  | 'ceo_agent'
  | 'sales_agent'
  | 'marketing_agent'
  | 'product_agent'
  | 'engineering_agent'
  | 'project_manager_agent'
  | 'support_agent'

export type AgentStatus = 'idle' | 'busy' | 'offline' | 'error' | 'stale'

export type ApprovalGate =
  | 'proposal_final'
  | 'spec_final'
  | 'delivery_final'
  | 'strategic_decision'

export type ApprovalDecision = 'approve' | 'reject' | 'revise'

export interface ApprovalRequest {
  request_id: string
  gate: ApprovalGate
  from_agent: AgentType
  timestamp: string
  project_id?: string
  summary: string
  recommendation: string
  risks: string[]
  options: readonly ApprovalDecision[]
  artifact_ref: string
}

export interface ApprovalResponse {
  request_id: string
  gate: ApprovalGate
  timestamp: string
  decision: ApprovalDecision
  notes?: string
}

export interface AgentRegistryEntry {
  agent_id: string
  agent_type: AgentType
  status: AgentStatus
  current_project_id?: string
  last_activity_timestamp: string
}

export interface ProjectRegistryEntry {
  project_id: string
  client_id: string
  lifecycle_state: LifecycleState
  active_agent_ids: string[]
  current_milestone: string
  updated_at: string
}

export type MessageType =
  | 'lead_handoff'
  | 'discovery_handoff'
  | 'implementation_handoff'
  | 'status_update'
  | 'clarification_request'
  | 'clarification_response'
  | 'approval_request'
  | 'approval_response'
  | 'ticket_escalation'
  | 'risk_alert'

export interface AgentMessage<Payload = Record<string, unknown>> {
  from: AgentType
  to: AgentType
  message_type: MessageType
  project_id: string
  timestamp: string
  payload: Payload
}

export interface ProjectStateSnapshot extends ProjectRegistryEntry {
  recorded_at: string
}

export interface AuditLogEntry {
  timestamp: string
  event:
    | 'access_denied'
    | 'agent_registered'
    | 'project_registered'
    | 'state_updated'
    | 'message_routed'
    | 'message_rejected'
    | 'handoff_acknowledged'
    | 'approval_recorded'
    | 'lifecycle_transition'
    | 'lifecycle_transition_rejected'
  agent_id?: string
  project_id?: string
  detail: string
}

export interface CommunicationLogEntry {
  log_id: string
  recorded_at: string
  message: AgentMessage
  status: 'routed' | 'rejected'
  rejection_reason?: string
  requires_acknowledgment: boolean
  acknowledged_at?: string
  acknowledged_within_sla?: boolean
}

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
      severity: 'low' | 'medium' | 'high' | 'critical'
      summary: string
      blocker_id: string
      project_id?: string
      owner_agent?: string
    }

export interface DashboardProjectCard {
  project_id: string
  client_id: string
  lifecycle_state: LifecycleState
  current_milestone: string
  active_agent_ids: string[]
  updated_at: string
}

export interface DashboardApprovalCard {
  request_id: string
  gate: ApprovalGate
  from_agent: AgentType
  project_id?: string
  summary: string
  artifact_ref: string
  timestamp: string
}

export interface AgentStatusSummary {
  idle: number
  busy: number
  offline: number
  error: number
  stale: number
}

export interface CompanyDashboardReadModel {
  generated_at: string
  agent_summary: AgentStatusSummary
  pipeline: {
    total_projects: number
    active_projects: number
    by_lifecycle_state: Record<LifecycleState, number>
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

export type RuntimeJobKind =
  | 'message_dispatch'
  | 'handoff_retry'
  | 'approval_followup'
  | 'sla_scan'
  | 'heartbeat_scan'
  | 'report_generate'

export type RuntimeJobStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'retrying'

export interface RuntimeJob {
  job_id: string
  kind: RuntimeJobKind
  status: RuntimeJobStatus
  attempts: number
  max_attempts: number
  detail: string
  project_id?: string
  worker_id?: string
  scheduled_at: string
  started_at?: string
  finished_at?: string
  error?: string
}

export interface OperatorAuditEntry {
  timestamp: string
  action: string
  actor: string
  target: string
  detail: string
}

export interface ProjectDetailSnapshot {
  project: DashboardProjectCard
  history: ProjectStateSnapshot[]
  approvals: ApprovalRequest[]
  messages: CommunicationLogEntry[]
  jobs: RuntimeJob[]
}

export interface CeoHealthSnapshot {
  status: 'starting' | 'ready' | 'degraded' | 'recovering' | 'locked' | 'stopped'
  uptime_seconds: number
  active_tasks: number
  last_activity_timestamp: string
}

export interface CeoReadinessSnapshot extends CeoHealthSnapshot {
  ready: boolean
  registry_connected: boolean
  recovery_loaded: boolean
  lock_active: boolean
  monitoring_cadence_minutes: number
  reasons: string[]
  checklist: string[]
}

export type RuntimeMode = 'local' | 'worker' | 'dry-run'
export type RuntimeWorkerState = 'ready' | 'busy' | 'offline'
export type OrchestratorShellStatus =
  | 'idle'
  | 'booting'
  | 'running'
  | 'degraded'
  | 'stopped'

export interface RuntimeWorkerDescriptor {
  worker_id: string
  agent_id: string
  agent_type: AgentType
  status: RuntimeWorkerState
  project_id?: string
}

export interface RuntimeSnapshotInfo {
  runtime_id: string
  mode: RuntimeMode
  shell_status: OrchestratorShellStatus
  workers: RuntimeWorkerDescriptor[]
  started_at: string
}

export type RuntimeEnvironment = 'development' | 'test' | 'production'

export interface RuntimeEnvironmentSnapshot {
  env: RuntimeEnvironment
  port: number
  ai_base_url: string
  ai_model: string
  ai_api_key_masked: string
}

export type ExtensionKind =
  | 'skill_registry'
  | 'tts_provider'
  | 'image_provider'
  | 'video_provider'
  | 'search_tool'
  | 'operator_tool'
  | 'qa_tool'
  | 'authoring_tool'

export type ExtensionRiskProfile = 'low' | 'medium' | 'high'
export type ExtensionAvailability = 'enabled' | 'disabled' | 'misconfigured'

export interface ExtensionValidationIssue {
  field: string
  message: string
}

export interface ExtensionSnapshot {
  id: string
  kind: ExtensionKind
  description: string
  defaultEnabled: boolean
  enabled: boolean
  status: ExtensionAvailability
  riskProfile: ExtensionRiskProfile
  requiredEnv: string[]
  optionalEnv: string[]
  issues: ExtensionValidationIssue[]
  config: Record<string, unknown>
}

export interface RuntimeAppSnapshot {
  generated_at: string
  dashboard: CompanyDashboardReadModel
  approvals: ApprovalRequest[]
  jobs: RuntimeJob[]
  messages: CommunicationLogEntry[]
  audit: OperatorAuditEntry[]
  projects: DashboardProjectCard[]
  project_details: ProjectDetailSnapshot[]
  health: CeoHealthSnapshot
  readiness: CeoReadinessSnapshot
  runtime: RuntimeSnapshotInfo
  environment: RuntimeEnvironmentSnapshot
  extensions: ExtensionSnapshot[]
}

export interface DirectiveSubmission {
  input: string
  mode?: 'natural' | 'structured'
  confirm?: boolean
}

export interface ApprovalResponseSubmission {
  decision: ApprovalDecision
  notes?: string
  confirm?: boolean
}

export interface ActionResult {
  ok: boolean
  message: string
  requires_confirmation?: boolean
  artifactPath?: string
  snapshot: RuntimeAppSnapshot
}
