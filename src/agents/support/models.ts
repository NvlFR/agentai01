import type { Agent_Message, AgentType, Lifecycle_State } from '../../domain/types.js'

export type SupportTicketCategory =
  | 'question'
  | 'bug'
  | 'incident'
  | 'change_request'

export type SupportTicketPriority = 'low' | 'medium' | 'high' | 'critical'

export type SupportTicketStatus =
  | 'open'
  | 'triaged'
  | 'waiting_clarification'
  | 'needs_escalation'
  | 'resolved'
  | 'closed'

export type SupportTaskType =
  | 'ticket_triage'
  | 'knowledge_resolution'
  | 'ticket_escalation'
  | 'risk_review'
  | 'support_report'

export type SupportTaskStatus =
  | 'queued'
  | 'running'
  | 'waiting_external_agent'
  | 'waiting_client'
  | 'completed'
  | 'failed'

export type SupportTicketInput = {
  project_id: string
  client_contact: string
  summary: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  business_impact?: 'low' | 'medium' | 'high' | 'critical'
  occurred_at?: string
  requested_outcome?: string
  reproduction_steps?: string[]
}

export type SupportTicket = {
  ticket_id: string
  project_id: string
  client_contact: string
  summary: string
  category: SupportTicketCategory
  priority: SupportTicketPriority
  status: SupportTicketStatus
  occurred_at?: string
  created_at: string
  updated_at: string
  requested_outcome?: string
  lifecycle_context: Extract<Lifecycle_State, 'delivered' | 'support' | 'closed'>
}

export type SupportTicketHistoryEntry = {
  ticket_id: string
  from_status?: SupportTicketStatus
  to_status: SupportTicketStatus
  actor: 'support' | 'client' | 'engineering' | 'project_manager'
  note: string
  created_at: string
}

export type ResolutionNote = {
  ticket_id: string
  actor: 'support' | 'engineering' | 'project_manager'
  note: string
  note_type: 'diagnosis' | 'workaround' | 'resolution' | 'client_update'
  created_at: string
}

export type TicketEscalationPayload = {
  ticket_id: string
  project_id: string
  summary: string
  category: SupportTicketCategory
  business_impact: string
  reproduction_steps?: string[]
  attempted_actions: string[]
  conversation_history: string[]
  requested_outcome: string
}

export type SupportEscalationTarget =
  | 'engineering_agent'
  | 'project_manager_agent'

export type SupportEscalationRecord = {
  escalation_id: string
  ticket_id: string
  project_id: string
  target: SupportEscalationTarget
  created_at: string
  acknowledged_at?: string
  status: 'pending' | 'acknowledged' | 'resolved' | 'timed_out'
}

export type RiskAlertTrigger =
  | 'repeat_incident'
  | 'cross_project_pattern'
  | 'sla_breach'
  | 'unresolved_escalation'

export type SupportRiskAlert = {
  alert_id: string
  project_id: string
  severity: 'medium' | 'high' | 'critical'
  trigger: RiskAlertTrigger
  summary: string
  recommended_action: string
  created_at: string
}

export type SupportEscalationMessage = Agent_Message<TicketEscalationPayload>

export type SupportRiskAlertMessage = Agent_Message<SupportRiskAlert>

export type KnowledgeDocumentType =
  | 'delivery_note'
  | 'runbook'
  | 'faq'
  | 'support_history'

export type KnowledgeDocument = {
  document_id: string
  project_id: string
  type: KnowledgeDocumentType
  title: string
  content: string
  tags: string[]
  updated_at: string
}

export type KnownIssueMatch = {
  document: KnowledgeDocument
  matched_terms: string[]
  workaround?: string
}

export type ClientFacingUpdate = {
  ticket_id: string
  summary: string
  detail: string
  next_step?: string
  created_at: string
}

export type SupportTask = {
  task_id: string
  ticket_id: string
  project_id: string
  task_type: SupportTaskType
  status: SupportTaskStatus
  created_at: string
  updated_at: string
  notes?: string
}

export type SupportMetrics = {
  open_tickets: number
  unresolved_high_priority: number
  escalations: number
  risk_alerts: number
  sla_breaches: number
}

export type SupportReport = {
  generated_at: string
  project_id?: string
  ticket_count: number
  by_category: Record<SupportTicketCategory, number>
  first_response_hours: number
  average_resolution_hours: number
  action_required: string[]
  history: string[]
}
