import type {
  Approval_Response,
  Lifecycle_State,
} from '../../domain/types.js'
import {
  SALES_AGENT_DEFINITION,
  createProposalApprovalRequest,
  makeEmptyScores,
  sumQualificationScores,
  type Lead,
  type LeadHandoffBundle,
  type MarketingLeadHandoffMessage,
  type OutreachDraft,
  type PipelineStage,
  type Proposal,
  type ProposalApprovalCycle,
  type ProposalApprovalInput,
  type QualificationScores,
  type SalesEscalationMessage,
  type SalesFollowUpTask,
  type SalesPersistenceSnapshot,
} from './models.js'

type CreateLeadInput = {
  lead_id: string
  company_name: string
  primary_contact: string
  industry: string
  source: string
  initial_need: string
  timestamp: string
  pain_points?: string[]
  stakeholders?: string[]
}

type BuildProposalInput = {
  lead: Lead
  version: number
  created_at: string
  business_outcomes: string[]
  scope_outline: string[]
  estimated_timeline: string
  price_range: string
  assumptions: string[]
  needs_scoping?: string[]
  commercial_risks?: string[]
}

type HandoffInput = {
  lead: Lead
  proposal: Proposal
  project_id: string
  timestamp: string
}

type OutreachSequenceInput = {
  lead: Lead
  baseTimestamp: string
  industryPointOfView?: string
  valueProposition?: string
  ownerTone?: string
}

type FollowUpTaskInput = {
  task_id: string
  lead_id: string
  sequence_step: SalesFollowUpTask['sequence_step']
  created_at: string
  recommended_send_at: string
}

export { SALES_AGENT_DEFINITION }

export const PIPELINE_TO_LIFECYCLE: Record<PipelineStage, Lifecycle_State> = {
  new: 'lead',
  contacted: 'lead',
  qualified: 'qualified',
  proposal_sent: 'proposal',
  negotiation: 'proposal',
  won: 'won',
  lost: 'lead',
}

export function mapPipelineStageToLifecycle(stage: PipelineStage): Lifecycle_State {
  return PIPELINE_TO_LIFECYCLE[stage]
}

export function createLead(input: CreateLeadInput): Lead {
  return {
    lead_id: input.lead_id,
    company_name: input.company_name,
    primary_contact: input.primary_contact,
    industry: input.industry,
    source: input.source,
    initial_need: input.initial_need,
    pipeline_stage: 'new',
    lifecycle_state: 'lead',
    qualification: {
      scores: makeEmptyScores(),
      total: 0,
      threshold: 12,
      is_low_priority: false,
      reasons: [],
    },
    pain_points: [...(input.pain_points ?? [])],
    stakeholders: [...(input.stakeholders ?? [])],
    conversation_notes: [],
    proposal_refs: [],
    handoff_completed: false,
    timeline: [
      {
        timestamp: input.timestamp,
        type: 'created',
        summary: `Lead created for ${input.company_name}`,
      },
    ],
  }
}

export function createLeadFromMarketingHandoff(
  message: MarketingLeadHandoffMessage,
): Lead {
  const packet = message.payload
  const primaryContact = packet.contact_name?.trim() || packet.contact_email?.trim() || 'Unknown contact'
  const initialNeed = packet.initial_need_summary?.trim() || `Inbound lead from ${packet.source_channel}`

  const lead = createLead({
    lead_id: packet.lead_id,
    company_name: packet.company_name,
    primary_contact: primaryContact,
    industry: packet.segment_id,
    source: `marketing:${packet.source_channel}`,
    initial_need: initialNeed,
    timestamp: packet.captured_at,
    pain_points: [...packet.tags],
    stakeholders: [],
  })

  return {
    ...lead,
    source_context: {
      campaign_id: packet.campaign_id,
      segment_id: packet.segment_id,
      source_channel: packet.source_channel,
      handoff_source: packet.handoff_source,
    },
    timeline: [
      ...lead.timeline,
      {
        timestamp: message.timestamp,
        type: 'marketing_handoff_received',
        summary: `Marketing handoff received from ${packet.campaign_id}`,
        detail: `Segment ${packet.segment_id} via ${packet.source_channel}`,
      },
    ],
  }
}

export function scoreLead(
  lead: Lead,
  scores: QualificationScores,
  timestamp: string,
  threshold = lead.qualification.threshold,
): Lead {
  const total = sumQualificationScores(scores)
  const reasons: string[] = []
  if (scores.budget_fit < 2) reasons.push('Budget fit is still weak')
  if (scores.authority < 2) reasons.push('Buyer authority is unclear')
  if (scores.use_case_relevance < 2) reasons.push('Use case relevance needs validation')
  if (scores.urgency < 2) reasons.push('Urgency is not yet established')

  return {
    ...lead,
    qualification: {
      scores: { ...scores },
      total,
      threshold,
      is_low_priority: total < threshold,
      reasons,
    },
    timeline: [
      ...lead.timeline,
      {
        timestamp,
        type: 'qualification_scored',
        summary: `Qualification scored at ${total}/${threshold}`,
        detail: reasons.join('; ') || 'Lead is above threshold',
      },
    ],
  }
}

export function generateClarificationQuestions(lead: Lead): string[] {
  const questions: string[] = []
  if (!lead.initial_need.trim() || lead.initial_need.length < 24) {
    questions.push('Masalah bisnis apa yang paling mendesak untuk diselesaikan dalam 90 hari ke depan?')
  }
  if (lead.qualification.scores.budget_fit < 2) {
    questions.push('Apakah sudah ada kisaran budget atau sponsor untuk inisiatif ini?')
  }
  if (lead.qualification.scores.authority < 2) {
    questions.push('Siapa pengambil keputusan utama dan siapa champion internal untuk proyek ini?')
  }
  if (lead.pain_points.length === 0) {
    questions.push('Proses mana yang saat ini paling lambat, mahal, atau sering bottleneck?')
  }
  if (lead.stakeholders.length === 0) {
    questions.push('Tim atau stakeholder mana saja yang akan terdampak jika solusi ini diterapkan?')
  }
  return questions
}

export function updatePipelineStage(
  lead: Lead,
  nextStage: PipelineStage,
  timestamp: string,
): Lead {
  return {
    ...lead,
    pipeline_stage: nextStage,
    lifecycle_state: mapPipelineStageToLifecycle(nextStage),
    timeline: [
      ...lead.timeline,
      {
        timestamp,
        type: 'stage_changed',
        summary: `Pipeline moved to ${nextStage}`,
      },
    ],
  }
}

export function requestClarification(
  lead: Lead,
  timestamp: string,
  questions = generateClarificationQuestions(lead),
): Lead {
  return {
    ...lead,
    timeline: [
      ...lead.timeline,
      {
        timestamp,
        type: 'clarification_requested',
        summary: `Requested ${questions.length} clarification questions`,
        detail: questions.join(' | '),
      },
    ],
  }
}

export function buildOutreachSequence(input: OutreachSequenceInput): OutreachDraft[] {
  const tone = input.ownerTone?.trim() || 'consultative'
  const pointOfView = input.industryPointOfView?.trim() || `teams in ${input.lead.industry}`
  const valueProp = input.valueProposition?.trim() || 'deliver AI agent workflows with measurable business outcomes'
  const painPoint = input.lead.pain_points[0] ?? input.lead.initial_need

  return [
    {
      lead_id: input.lead.lead_id,
      step: 'initial_contact',
      recommended_send_at: input.baseTimestamp,
      subject: `Idea for ${input.lead.company_name}'s ${painPoint}`,
      tone,
      body: `Hi ${input.lead.primary_contact}, we help ${pointOfView} ${valueProp}. I noticed ${painPoint} may be slowing execution. Open to a short discovery call?`,
    },
    {
      lead_id: input.lead.lead_id,
      step: 'value_add_follow_up',
      recommended_send_at: shiftIsoTimestamp(input.baseTimestamp, 2),
      subject: `Worth sharing one practical angle for ${input.lead.company_name}`,
      tone,
      body: `Following up with a concrete angle: teams like yours often start by fixing ${painPoint}, then expand into measurable ROI. Happy to share a scoped pilot outline if useful.`,
    },
    {
      lead_id: input.lead.lead_id,
      step: 'close_loop',
      recommended_send_at: shiftIsoTimestamp(input.baseTimestamp, 5),
      subject: `Should I close the loop for now?`,
      tone,
      body: `I will close the loop for now if timing is not right. If ${painPoint} becomes a priority, I can send a tailored AI agent proposal and next-step recommendation.`,
    },
  ]
}

export function recordOutreachDrafts(
  lead: Lead,
  drafts: readonly OutreachDraft[],
  timestamp: string,
): Lead {
  return {
    ...lead,
    timeline: [
      ...lead.timeline,
      ...drafts.map(draft => ({
        timestamp,
        type: 'outreach_drafted' as const,
        summary: `Outreach drafted for ${draft.step}`,
        detail: `${draft.subject} | ${draft.tone}`,
      })),
    ],
  }
}

export function buildProposal(input: BuildProposalInput): Proposal {
  return {
    lead_id: input.lead.lead_id,
    version: input.version,
    artifact_ref: `${input.lead.lead_id}/proposal-v${input.version}.md`,
    summary_of_need: input.lead.initial_need,
    business_outcomes: [...input.business_outcomes],
    scope_outline: [...input.scope_outline],
    estimated_timeline: input.estimated_timeline,
    price_range: input.price_range,
    assumptions: [...input.assumptions],
    needs_scoping: [...(input.needs_scoping ?? [])],
    commercial_risks: [...(input.commercial_risks ?? [])],
    created_at: input.created_at,
  }
}

export function attachProposalToLead(
  lead: Lead,
  proposal: Proposal,
  timestamp: string,
): Lead {
  return {
    ...lead,
    proposal_refs: [...lead.proposal_refs, proposal.artifact_ref],
    timeline: [
      ...lead.timeline,
      {
        timestamp,
        type: 'proposal_created',
        summary: `Proposal v${proposal.version} created`,
        detail: proposal.artifact_ref,
      },
    ],
  }
}

export function sendProposal(
  lead: Lead,
  proposal: Proposal,
  timestamp: string,
): { lead: Lead; proposal: Proposal } {
  const sentProposal: Proposal = {
    ...proposal,
    sent_at: timestamp,
  }
  const stagedLead = updatePipelineStage(lead, 'proposal_sent', timestamp)
  const updatedLead = {
    ...stagedLead,
    timeline: [
      ...stagedLead.timeline,
      {
        timestamp,
        type: 'proposal_sent' as const,
        summary: `Proposal v${proposal.version} sent to client`,
      },
    ],
  }

  return { lead: updatedLead, proposal: sentProposal }
}

export function buildProposalApprovalRequest(input: ProposalApprovalInput) {
  return createProposalApprovalRequest(input)
}

export function createProposalApprovalCycle(
  input: ProposalApprovalInput,
): ProposalApprovalCycle {
  return {
    request: buildProposalApprovalRequest(input),
    status: 'pending',
    history: [],
  }
}

export function applyProposalApprovalResponse(
  cycle: ProposalApprovalCycle,
  response: Approval_Response,
): ProposalApprovalCycle {
  const nextStatus = mapDecisionToApprovalStatus(response.decision)
  return {
    ...cycle,
    status: nextStatus,
    last_response: { ...response },
    history: [...cycle.history, { ...response }],
  }
}

export function recordApprovalCycleOnLead(
  lead: Lead,
  cycle: ProposalApprovalCycle,
  timestamp: string,
): Lead {
  const type =
    cycle.status === 'approved'
      ? 'approval_approved'
      : cycle.status === 'rejected'
        ? 'approval_rejected'
        : cycle.status === 'revise_requested'
          ? 'approval_revision_requested'
          : 'approval_requested'

  const detail =
    cycle.last_response?.notes ??
    cycle.request.recommendation

  return {
    ...lead,
    timeline: [
      ...lead.timeline,
      {
        timestamp,
        type,
        summary: `Proposal approval ${cycle.status}`,
        detail,
      },
    ],
  }
}

export function buildLeadHandoffBundle(input: HandoffInput): LeadHandoffBundle {
  const outstandingScoping = [...input.proposal.needs_scoping]

  return {
    handoff: {
      from: 'sales_agent',
      to: 'product_agent',
      message_type: 'lead_handoff',
      project_id: input.project_id,
      timestamp: input.timestamp,
      payload: {
        lead_id: input.lead.lead_id,
        company_name: input.lead.company_name,
        business_summary: input.lead.initial_need,
        pain_points: [...input.lead.pain_points],
        stakeholders: [...input.lead.stakeholders],
        conversation_notes: [...input.lead.conversation_notes],
        last_proposal_ref: input.proposal.artifact_ref,
        commercial_risks: [...input.proposal.commercial_risks],
        delivery_readiness: {
          qualified: input.lead.qualification.total >= input.lead.qualification.threshold,
          won: input.lead.pipeline_stage === 'won',
          outstanding_scoping: outstandingScoping,
        },
      },
    },
    project_manager_update: {
      from: 'sales_agent',
      to: 'project_manager_agent',
      message_type: 'status_update',
      project_id: input.project_id,
      timestamp: input.timestamp,
      payload: {
        lead_id: input.lead.lead_id,
        status: 'project_created',
        handoff_ref: input.proposal.artifact_ref,
      },
    },
  }
}

export function markHandoffCompleted(lead: Lead, timestamp: string): Lead {
  return {
    ...lead,
    handoff_completed: true,
    timeline: [
      ...lead.timeline,
      {
        timestamp,
        type: 'handoff_completed',
        summary: 'Lead handoff acknowledged by Product Agent',
      },
    ],
  }
}

export function markHandoffFailed(
  lead: Lead,
  timestamp: string,
  error: string,
): Lead {
  return {
    ...lead,
    handoff_completed: false,
    timeline: [
      ...lead.timeline,
      {
        timestamp,
        type: 'handoff_failed',
        summary: 'Lead handoff failed',
        detail: error,
      },
    ],
  }
}

export function buildHandoffFailureEscalation(input: {
  lead: Lead
  project_id: string
  timestamp: string
  error: string
}): SalesEscalationMessage {
  return {
    from: 'sales_agent',
    to: 'ceo_agent',
    message_type: 'risk_alert',
    project_id: input.project_id,
    timestamp: input.timestamp,
    payload: {
      lead_id: input.lead.lead_id,
      project_id: input.project_id,
      error: input.error,
      failed_at: input.timestamp,
      last_proposal_ref: input.lead.proposal_refs.at(-1),
    },
  }
}

export function createFollowUpTask(input: FollowUpTaskInput): SalesFollowUpTask {
  return {
    task_id: input.task_id,
    lead_id: input.lead_id,
    kind: 'follow_up',
    status: 'queued',
    created_at: input.created_at,
    recommended_send_at: input.recommended_send_at,
    sequence_step: input.sequence_step,
  }
}

export function recordFollowUpTask(
  lead: Lead,
  task: SalesFollowUpTask,
  timestamp: string,
): Lead {
  return {
    ...lead,
    timeline: [
      ...lead.timeline,
      {
        timestamp,
        type: 'follow_up_task_created',
        summary: `Follow-up task created for ${task.sequence_step}`,
        detail: `${task.task_id} scheduled ${task.recommended_send_at}`,
      },
    ],
  }
}

export function createSalesSnapshot(input: SalesPersistenceSnapshot): SalesPersistenceSnapshot {
  return {
    leads: input.leads.map(cloneLead),
    proposals: input.proposals.map(cloneProposal),
    approval_cycles: input.approval_cycles.map(cycle => ({
      ...cycle,
      request: {
        ...cycle.request,
        risks: [...cycle.request.risks],
        options: [...cycle.request.options],
      },
      last_response: cycle.last_response ? { ...cycle.last_response } : undefined,
      history: cycle.history.map(item => ({ ...item })),
    })),
    follow_up_tasks: input.follow_up_tasks.map(task => ({ ...task })),
  }
}

export function restoreSalesSnapshot(
  snapshot: SalesPersistenceSnapshot,
): SalesPersistenceSnapshot {
  return createSalesSnapshot(snapshot)
}

function cloneLead(lead: Lead): Lead {
  return {
    ...lead,
    qualification: {
      ...lead.qualification,
      scores: { ...lead.qualification.scores },
      reasons: [...lead.qualification.reasons],
    },
    pain_points: [...lead.pain_points],
    stakeholders: [...lead.stakeholders],
    conversation_notes: [...lead.conversation_notes],
    proposal_refs: [...lead.proposal_refs],
    source_context: lead.source_context ? { ...lead.source_context } : undefined,
    timeline: lead.timeline.map(item => ({ ...item })),
  }
}

function cloneProposal(proposal: Proposal): Proposal {
  return {
    ...proposal,
    business_outcomes: [...proposal.business_outcomes],
    scope_outline: [...proposal.scope_outline],
    assumptions: [...proposal.assumptions],
    needs_scoping: [...proposal.needs_scoping],
    commercial_risks: [...proposal.commercial_risks],
  }
}

function mapDecisionToApprovalStatus(
  decision: Approval_Response['decision'],
): ProposalApprovalCycle['status'] {
  if (decision === 'approve') return 'approved'
  if (decision === 'reject') return 'rejected'
  return 'revise_requested'
}

function shiftIsoTimestamp(timestamp: string, days: number): string {
  const value = new Date(timestamp)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString()
}
