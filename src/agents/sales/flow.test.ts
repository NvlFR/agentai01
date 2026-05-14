import { describe, expect, it } from 'bun:test'
import { buildSalesLeadHandoffMessage } from '../marketing/models.js'
import {
  SALES_AGENT_DEFINITION,
  applyProposalApprovalResponse,
  attachProposalToLead,
  buildHandoffFailureEscalation,
  buildOutreachSequence,
  buildLeadHandoffBundle,
  buildProposal,
  buildProposalApprovalRequest,
  createFollowUpTask,
  createLeadFromMarketingHandoff,
  createProposalApprovalCycle,
  createLead,
  createSalesSnapshot,
  generateClarificationQuestions,
  mapPipelineStageToLifecycle,
  markHandoffCompleted,
  markHandoffFailed,
  recordApprovalCycleOnLead,
  recordFollowUpTask,
  recordOutreachDrafts,
  requestClarification,
  restoreSalesSnapshot,
  scoreLead,
  sendProposal,
  updatePipelineStage,
} from './flow.js'

describe('sales flow', () => {
  it('exposes a sales agent definition with required tools', () => {
    expect(SALES_AGENT_DEFINITION.agentType).toBe('sales')
    expect(SALES_AGENT_DEFINITION.tools).toEqual([
      'lead_capture',
      'lead_score',
      'proposal_write',
      'message_send',
      'pipeline_update',
    ])
  })

  it('maps pipeline stages to shared lifecycle states', () => {
    expect(mapPipelineStageToLifecycle('new')).toBe('lead')
    expect(mapPipelineStageToLifecycle('contacted')).toBe('lead')
    expect(mapPipelineStageToLifecycle('qualified')).toBe('qualified')
    expect(mapPipelineStageToLifecycle('proposal_sent')).toBe('proposal')
    expect(mapPipelineStageToLifecycle('negotiation')).toBe('proposal')
    expect(mapPipelineStageToLifecycle('won')).toBe('won')
  })

  it('creates a lead from marketing handoff and generates clarification/outreach helpers', () => {
    const handoff = buildSalesLeadHandoffMessage({
      lead_id: 'lead-mkt-001',
      company_name: 'Orbit AI',
      contact_name: 'Maya',
      contact_channel: 'website_form',
      source_channel: 'website',
      campaign_id: 'cmp-growth',
      segment_id: 'ops-leaders',
      project_id: null,
      initial_need_summary: 'Need faster inbound lead qualification',
      captured_at: '2026-05-14T08:00:00Z',
      ack_status: 'pending_sales_ack',
      tags: ['inbound', 'roi'],
    }, {
      routingProjectId: 'routing-growth',
      timestamp: '2026-05-14T08:01:00Z',
    })

    const lead = createLeadFromMarketingHandoff(handoff)
    const questions = generateClarificationQuestions(lead)
    const clarificationRequested = requestClarification(lead, '2026-05-14T08:03:00Z', questions)
    const drafts = buildOutreachSequence({
      lead,
      baseTimestamp: '2026-05-14T08:05:00Z',
      industryPointOfView: 'operations leaders',
      valueProposition: 'ship AI workflows without heavy process drag',
      ownerTone: 'direct but helpful',
    })
    const withDrafts = recordOutreachDrafts(clarificationRequested, drafts, '2026-05-14T08:05:00Z')
    const task = createFollowUpTask({
      task_id: 'task-001',
      lead_id: lead.lead_id,
      sequence_step: 'value_add_follow_up',
      created_at: '2026-05-14T08:05:00Z',
      recommended_send_at: drafts[1]!.recommended_send_at,
    })
    const withTask = recordFollowUpTask(withDrafts, task, '2026-05-14T08:05:00Z')

    expect(lead.source_context?.campaign_id).toBe('cmp-growth')
    expect(lead.timeline.at(-1)?.type).toBe('marketing_handoff_received')
    expect(questions.length).toBeGreaterThan(0)
    expect(drafts.map(draft => draft.step)).toEqual([
      'initial_contact',
      'value_add_follow_up',
      'close_loop',
    ])
    expect(drafts[0]?.body).toContain('operations leaders')
    expect(withTask.timeline.at(-1)?.type).toBe('follow_up_task_created')
  })

  it('creates, scores, and qualifies a lead with timeline history', () => {
    const lead = createLead({
      lead_id: 'lead-001',
      company_name: 'Acme Corp',
      primary_contact: 'Jane Doe',
      industry: 'Manufacturing',
      source: 'referral',
      initial_need: 'Automate support triage',
      timestamp: '2026-05-14T09:00:00Z',
      pain_points: ['Slow ticket routing'],
      stakeholders: ['COO', 'Support Lead'],
    })

    const scored = scoreLead(
      lead,
      {
        urgency: 3,
        budget_fit: 3,
        authority: 4,
        use_case_relevance: 4,
      },
      '2026-05-14T09:15:00Z',
    )
    const qualified = updatePipelineStage(scored, 'qualified', '2026-05-14T09:30:00Z')

    expect(scored.qualification.total).toBe(14)
    expect(scored.qualification.is_low_priority).toBe(false)
    expect(qualified.lifecycle_state).toBe('qualified')
    expect(qualified.timeline.at(-1)?.summary).toContain('qualified')
  })

  it('builds proposal, approval request, and proposal_sent transition', () => {
    const lead = updatePipelineStage(
      scoreLead(
        createLead({
          lead_id: 'lead-002',
          company_name: 'Globex',
          primary_contact: 'John Roe',
          industry: 'Finance',
          source: 'inbound',
          initial_need: 'Internal knowledge assistant',
          timestamp: '2026-05-14T09:00:00Z',
        }),
        {
          urgency: 4,
          budget_fit: 3,
          authority: 3,
          use_case_relevance: 4,
        },
        '2026-05-14T09:05:00Z',
      ),
      'qualified',
      '2026-05-14T09:10:00Z',
    )

    const proposal = buildProposal({
      lead,
      version: 2,
      created_at: '2026-05-14T09:20:00Z',
      business_outcomes: ['Reduce search time', 'Improve internal response quality'],
      scope_outline: ['Pilot with 3 teams', 'RAG workflow', 'Analytics dashboard'],
      estimated_timeline: '4-6 weeks',
      price_range: '$18k-$25k',
      assumptions: ['Client provides source docs', 'Single-sign-on is available'],
      needs_scoping: ['Security review depth'],
      commercial_risks: ['Procurement may require quarter-end approval'],
    })

    const withProposal = attachProposalToLead(lead, proposal, '2026-05-14T09:21:00Z')
    const approvalInput = {
      request_id: 'req-002',
      timestamp: '2026-05-14T09:25:00Z',
      proposal,
      project_id: 'proj-002',
      change_summary: 'Updated pricing and delivery phases.',
    }
    const approval = buildProposalApprovalRequest(approvalInput)
    const cycle = createProposalApprovalCycle(approvalInput)
    const revisedCycle = applyProposalApprovalResponse(cycle, {
      request_id: 'req-002',
      gate: 'proposal_final',
      timestamp: '2026-05-14T09:27:00Z',
      decision: 'revise',
      notes: 'Clarify rollout assumptions first.',
    })
    const revisedLead = recordApprovalCycleOnLead(withProposal, revisedCycle, '2026-05-14T09:27:00Z')
    const sent = sendProposal(withProposal, proposal, '2026-05-14T09:30:00Z')

    expect(proposal.artifact_ref).toBe('lead-002/proposal-v2.md')
    expect(approval.gate).toBe('proposal_final')
    expect(approval.risks).toContain('[NEEDS_SCOPING] Security review depth')
    expect(revisedCycle.status).toBe('revise_requested')
    expect(revisedLead.timeline.at(-1)?.type).toBe('approval_revision_requested')
    expect(sent.lead.pipeline_stage).toBe('proposal_sent')
    expect(sent.proposal.sent_at).toBe('2026-05-14T09:30:00Z')
  })

  it('builds lead handoff bundle for Product and PM once deal is won', () => {
    const lead = updatePipelineStage(
      scoreLead(
        createLead({
          lead_id: 'lead-003',
          company_name: 'Initech',
          primary_contact: 'Peter Gibbons',
          industry: 'SaaS',
          source: 'ceo_referral',
          initial_need: 'Customer onboarding copilot',
          timestamp: '2026-05-14T08:00:00Z',
          pain_points: ['Manual onboarding checklist', 'Low adoption of docs'],
          stakeholders: ['VP CS', 'Head of Ops'],
        }),
        {
          urgency: 3,
          budget_fit: 3,
          authority: 3,
          use_case_relevance: 4,
        },
        '2026-05-14T08:30:00Z',
      ),
      'won',
      '2026-05-14T10:00:00Z',
    )
    lead.conversation_notes.push('Client wants discovery kickoff next Tuesday.')

    const proposal = buildProposal({
      lead,
      version: 1,
      created_at: '2026-05-14T09:00:00Z',
      business_outcomes: ['Lower onboarding time', 'Improve activation'],
      scope_outline: ['Journey mapping', 'Assistant pilot'],
      estimated_timeline: '5 weeks',
      price_range: '$20k-$28k',
      assumptions: ['CS team can join workshops'],
      needs_scoping: ['CRM integration depth'],
      commercial_risks: ['Success metrics still need baseline data'],
    })

    const bundle = buildLeadHandoffBundle({
      lead,
      proposal,
      project_id: 'proj-003',
      timestamp: '2026-05-14T10:05:00Z',
    })
    const completed = markHandoffCompleted(lead, '2026-05-14T10:10:00Z')

    expect(bundle.handoff.message_type).toBe('lead_handoff')
    expect(bundle.handoff.payload.delivery_readiness.won).toBe(true)
    expect(bundle.handoff.payload.delivery_readiness.outstanding_scoping).toContain(
      'CRM integration depth',
    )
    expect(bundle.project_manager_update.to).toBe('project_manager_agent')
    expect(completed.handoff_completed).toBe(true)
  })

  it('creates persistence snapshots and escalation context for failed handoffs', () => {
    const lead = createLead({
      lead_id: 'lead-900',
      company_name: 'Helio',
      primary_contact: 'Aria',
      industry: 'Healthcare',
      source: 'partner',
      initial_need: 'Reduce manual intake',
      timestamp: '2026-05-14T07:00:00Z',
    })

    const failed = markHandoffFailed(lead, '2026-05-14T07:30:00Z', 'Product agent timeout')
    const escalation = buildHandoffFailureEscalation({
      lead: failed,
      project_id: 'proj-900',
      timestamp: '2026-05-14T07:31:00Z',
      error: 'Product agent timeout',
    })
    const snapshot = createSalesSnapshot({
      leads: [failed],
      proposals: [],
      approval_cycles: [],
      follow_up_tasks: [],
    })
    const restored = restoreSalesSnapshot(snapshot)

    expect(escalation.to).toBe('ceo_agent')
    expect(escalation.payload.error).toContain('timeout')
    expect(restored.leads[0]?.timeline.at(-1)?.type).toBe('handoff_failed')
  })
})
