import type {
  Agent_Message,
  Approval_Request,
  Approval_Response,
  ApprovalDecision,
  Lifecycle_State,
} from '../../domain/types.js'

export type PipelineStage =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal_sent'
  | 'negotiation'
  | 'won'
  | 'lost'

export type QualificationDimension = 'urgency' | 'budget_fit' | 'authority' | 'use_case_relevance'

export type QualificationScores = Record<QualificationDimension, number>

export type SalesToolName =
  | 'lead_capture'
  | 'lead_score'
  | 'proposal_write'
  | 'message_send'
  | 'pipeline_update'

export type SalesAgentDefinition = {
  agentType: 'sales'
  description: string
  systemPrompt: string
  tools: SalesToolName[]
}

export const SALES_AGENT_DEFINITION: SalesAgentDefinition = {
  agentType: 'sales',
  description:
    'Owns lead qualification, outreach, proposal approvals, and won-deal handoff into delivery.',
  systemPrompt:
    'You are the Sales Agent for AI Company. Qualify leads, protect proposal quality with approval gates, preserve timeline history, and hand off won deals to Product and Project Manager with complete commercial context.',
  tools: [
    'lead_capture',
    'lead_score',
    'proposal_write',
    'message_send',
    'pipeline_update',
  ],
}

export type LeadTimelineEntry = {
  timestamp: string
  type:
    | 'created'
    | 'marketing_handoff_received'
    | 'qualification_scored'
    | 'clarification_requested'
    | 'stage_changed'
    | 'outreach_drafted'
    | 'follow_up_task_created'
    | 'proposal_created'
    | 'proposal_sent'
    | 'approval_requested'
    | 'approval_approved'
    | 'approval_rejected'
    | 'approval_revision_requested'
    | 'handoff_completed'
    | 'handoff_failed'
  summary: string
  detail?: string
}

export type Lead = {
  lead_id: string
  company_name: string
  primary_contact: string
  industry: string
  source: string
  initial_need: string
  pipeline_stage: PipelineStage
  lifecycle_state: Lifecycle_State
  qualification: {
    scores: QualificationScores
    total: number
    threshold: number
    is_low_priority: boolean
    reasons: string[]
  }
  pain_points: string[]
  stakeholders: string[]
  conversation_notes: string[]
  proposal_refs: string[]
  handoff_completed: boolean
  source_context?: {
    campaign_id?: string
    segment_id?: string
    source_channel?: string
    handoff_source?: string
  }
  timeline: LeadTimelineEntry[]
}

export type Proposal = {
  lead_id: string
  version: number
  artifact_ref: string
  summary_of_need: string
  business_outcomes: string[]
  scope_outline: string[]
  estimated_timeline: string
  price_range: string
  assumptions: string[]
  needs_scoping: string[]
  commercial_risks: string[]
  created_at: string
  sent_at?: string
}

export type ProposalApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'revise_requested'

export type ProposalApprovalCycle = {
  request: Approval_Request
  status: ProposalApprovalStatus
  last_response?: Approval_Response
  history: Approval_Response[]
}

export type ProposalApprovalInput = {
  request_id: string
  timestamp: string
  proposal: Proposal
  project_id?: string
  change_summary: string
  recommendation?: string
  options?: readonly ApprovalDecision[]
}

export type LeadHandoffPayload = {
  lead_id: string
  company_name: string
  business_summary: string
  pain_points: string[]
  stakeholders: string[]
  conversation_notes: string[]
  last_proposal_ref: string
  commercial_risks: string[]
  delivery_readiness: {
    qualified: boolean
    won: boolean
    outstanding_scoping: string[]
  }
}

export type LeadHandoffMessage = Agent_Message<LeadHandoffPayload> & {
  from: 'sales_agent'
  to: 'product_agent'
  message_type: 'lead_handoff'
}

export type ProjectManagerNotification = Agent_Message<{
  lead_id: string
  status: 'project_created'
  handoff_ref: string
}> & {
  from: 'sales_agent'
  to: 'project_manager_agent'
  message_type: 'status_update'
}

export type LeadHandoffBundle = {
  handoff: LeadHandoffMessage
  project_manager_update: ProjectManagerNotification
}

export type SalesEscalationMessage = Agent_Message<{
  lead_id: string
  project_id: string
  error: string
  failed_at: string
  last_proposal_ref?: string
}> & {
  from: 'sales_agent'
  to: 'ceo_agent'
  message_type: 'risk_alert'
}

export type OutreachStepType =
  | 'initial_contact'
  | 'value_add_follow_up'
  | 'close_loop'

export type OutreachDraft = {
  lead_id: string
  step: OutreachStepType
  recommended_send_at: string
  subject: string
  body: string
  tone: string
}

export type SalesFollowUpTaskStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'

export type SalesFollowUpTask = {
  task_id: string
  lead_id: string
  kind: 'follow_up'
  status: SalesFollowUpTaskStatus
  recommended_send_at: string
  created_at: string
  sequence_step: OutreachStepType
}

export type SalesPersistenceSnapshot = {
  leads: Lead[]
  proposals: Proposal[]
  approval_cycles: ProposalApprovalCycle[]
  follow_up_tasks: SalesFollowUpTask[]
}

export type MarketingLeadIntakePayload = {
  lead_id: string
  company_name: string
  contact_name?: string
  contact_email?: string
  contact_channel: string
  source_channel: string
  campaign_id: string
  segment_id: string
  project_id: string | null
  initial_need_summary?: string
  captured_at: string
  ack_status: string
  tags: string[]
  handoff_source: 'marketing_campaign'
  lifecycle_state_hint: 'lead'
  pending_project_creation: boolean
}

export type MarketingLeadHandoffMessage = Agent_Message<MarketingLeadIntakePayload>

export function makeEmptyScores(): QualificationScores {
  return {
    urgency: 0,
    budget_fit: 0,
    authority: 0,
    use_case_relevance: 0,
  }
}

export function sumQualificationScores(scores: QualificationScores): number {
  return scores.urgency + scores.budget_fit + scores.authority + scores.use_case_relevance
}

export function createProposalApprovalRequest(input: ProposalApprovalInput): Approval_Request {
  const risks = [
    ...input.proposal.commercial_risks,
    ...input.proposal.needs_scoping.map(item => `[NEEDS_SCOPING] ${item}`),
  ]

  return {
    request_id: input.request_id,
    gate: 'proposal_final',
    from_agent: 'sales_agent',
    timestamp: input.timestamp,
    project_id: input.project_id,
    summary: `Proposal v${input.proposal.version} for ${input.proposal.lead_id}. ${input.change_summary}`,
    recommendation:
      input.recommendation ??
      `Approve sending proposal ${input.proposal.artifact_ref} to the client.`,
    risks,
    options: input.options ?? ['approve', 'reject', 'revise'],
    artifact_ref: input.proposal.artifact_ref,
  }
}
