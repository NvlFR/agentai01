import { describe, expect, it } from 'bun:test'

import { AgentRegistry } from '../../registry/AgentRegistry.js'
import {
  MARKETING_AGENT_DEFINITION,
  InMemoryMarketingStore,
  acknowledgeLeadHandoff,
  buildAssetDeliveryMessage,
  buildAssetPackage,
  buildLeadHandoffEscalation,
  createMarketingAsset,
  createMarketingTask,
  ingestSalesFeedback,
  registerInboundLead,
  retryLeadHandoff,
  reviseMarketingAsset,
  updateMarketingTaskStatus,
} from './flow.js'
import {
  createCampaignPlan,
  feedbackToMarketInsight,
  isCampaignPlan,
  isInboundLeadPacket,
  isMarketInsight,
  isMarketingAsset,
  normalizeInboundLeadPacket,
  reviseCampaignPlan,
  type InboundLeadPacket,
  type MarketingAsset,
} from './models.js'

describe('marketing models', () => {
  it('exposes a marketing agent definition with required tools', () => {
    expect(MARKETING_AGENT_DEFINITION.agentType).toBe('marketing')
    expect(MARKETING_AGENT_DEFINITION.tools).toEqual([
      'campaign_plan',
      'content_write',
      'market_research',
      'asset_store',
      'message_send',
    ])
  })

  it('creates and revises a campaign plan without overwriting version history', () => {
    const first = createCampaignPlan('cmp-001', {
      objective: 'Generate qualified demos',
      target_segments: ['mid-market ops', 'mid-market ops'],
      primary_channels: ['email', 'social'],
      timeline: {
        start_at: '2026-05-14T00:00:00Z',
        end_at: '2026-06-14T00:00:00Z',
      },
      key_message: 'AI agents reduce handoff friction',
      call_to_action: 'Book a diagnostic call',
      success_metrics: ['10 replies', '3 meetings'],
      dependencies: ['case study'],
    }, '2026-05-14T09:00:00Z')

    const revised = reviseCampaignPlan(
      first,
      {
        key_message: 'AI agents reduce handoff friction for lean teams',
        status: 'active',
      },
      '2026-05-15T09:00:00Z',
    )

    expect(isCampaignPlan(first)).toBe(true)
    expect(first.version).toBe(1)
    expect(first.target_segments).toEqual(['mid-market ops'])
    expect(revised.version).toBe(2)
    expect(revised.status).toBe('active')
    expect(revised.key_message).toContain('lean teams')
    expect(first.key_message).toBe('AI agents reduce handoff friction')
  })

  it('validates market insight, asset, and inbound lead packet shapes', () => {
    const insight = feedbackToMarketInsight({
      feedback_id: 'fb-001',
      campaign_id: 'cmp-001',
      segment_id: 'ops-leaders',
      project_id: null,
      objections: ['Too complex'],
      lost_reasons: ['Budget timing'],
      response_patterns: ['Faster qualification'],
      conversion_signal: 'negative',
      summary: 'Ops leaders want clearer ROI framing',
      received_at: '2026-05-14T10:00:00Z',
    }, '2026-05-14T10:05:00Z')

    const asset: MarketingAsset = {
      asset_id: 'asset-001',
      campaign_id: 'cmp-001',
      asset_type: 'one_pager',
      segment_id: 'ops-leaders',
      content: 'Short value proposition',
      cta: 'Reply for a walkthrough',
      version: 1,
      status: 'ready',
      technical_claim_status: 'validated',
      created_at: '2026-05-14T11:00:00Z',
      updated_at: '2026-05-14T11:00:00Z',
    }

    const lead = normalizeInboundLeadPacket({
      lead_id: 'lead-001',
      company_name: ' ACME ',
      contact_channel: 'linkedin',
      source_channel: 'email',
      campaign_id: 'cmp-001',
      segment_id: 'ops-leaders',
      captured_at: '2026-05-14T12:00:00Z',
      tags: ['warm', 'warm', 'pilot'],
    })

    expect(isMarketInsight(insight)).toBe(true)
    expect(isMarketingAsset(asset)).toBe(true)
    expect(isInboundLeadPacket(lead)).toBe(true)
    expect(lead.company_name).toBe('ACME')
    expect(lead.ack_status).toBe('pending_sales_ack')
    expect(lead.tags).toEqual(['warm', 'pilot'])
  })
})

describe('marketing lead handoff compatibility', () => {
  const baseLead: InboundLeadPacket = {
    lead_id: 'lead-123',
    company_name: 'Northstar Labs',
    contact_name: 'Nadia',
    contact_email: 'nadia@northstar.test',
    contact_channel: 'website_form',
    source_channel: 'website',
    campaign_id: 'cmp-demand-gen',
    segment_id: 'ai-ops',
    project_id: null,
    initial_need_summary: 'Need faster inbound qualification',
    captured_at: '2026-05-14T08:00:00Z',
    ack_status: 'pending_sales_ack',
    tags: ['inbound', 'high-intent'],
  }

  it('builds a Sales-compatible lead_handoff message with required marketing metadata', () => {
    const state = registerInboundLead(baseLead, {
      routingProjectId: 'routing-marketing-sales',
      timestamp: '2026-05-14T08:01:00Z',
    })
    const message = state.message

    expect(message.from).toBe('marketing_agent')
    expect(message.to).toBe('sales_agent')
    expect(message.message_type).toBe('lead_handoff')
    expect(message.project_id).toBe('routing-marketing-sales')
    expect(message.payload.campaign_id).toBe('cmp-demand-gen')
    expect(message.payload.source_channel).toBe('website')
    expect(message.payload.segment_id).toBe('ai-ops')
    expect(message.payload.captured_at).toBe('2026-05-14T08:00:00Z')
    expect(message.payload.lifecycle_state_hint).toBe('lead')
    expect(message.payload.pending_project_creation).toBe(true)
  })

  it('can be validated by the shared registry when both agents share a routing project context', () => {
    const registry = new AgentRegistry()

    registry.registerAgent({
      agent_id: 'marketing-1',
      agent_type: 'marketing_agent',
      status: 'busy',
      current_project_id: 'routing-marketing-sales',
      last_activity_timestamp: '2026-05-14T08:00:00Z',
    })
    registry.registerAgent({
      agent_id: 'sales-1',
      agent_type: 'sales_agent',
      status: 'idle',
      current_project_id: 'routing-marketing-sales',
      last_activity_timestamp: '2026-05-14T08:00:00Z',
    })

    const message = registerInboundLead(baseLead, {
      routingProjectId: 'routing-marketing-sales',
    }).message

    expect(registry.validateMessageAccess(message)).toEqual({ allowed: true })
  })
})

describe('marketing feedback loop helpers', () => {
  it('turns sales feedback into a messaging revision and flags at-risk campaigns', () => {
    const feedback = {
      feedback_id: 'fb-200',
      campaign_id: 'cmp-200',
      segment_id: 'finance-ops',
      project_id: null,
      objections: ['ROI unclear', 'Implementation seems long', 'No internal champion'],
      lost_reasons: ['Competing priority'],
      response_patterns: ['Cost reduction'],
      conversion_signal: 'negative' as const,
      summary: 'Finance leads want faster proof of value',
      received_at: '2026-05-14T13:00:00Z',
    }
    const { revision, task, insight } = ingestSalesFeedback(
      feedback,
      'We build custom AI agents',
      '2026-05-14T13:05:00Z',
    )

    expect(revision.at_risk).toBe(true)
    expect(revision.lifecycle_hint).toBe('lead')
    expect(revision.recommended_message).toContain('Cost reduction')
    expect(revision.revision_reason).toBe('ROI unclear')
    expect(task.kind).toBe('messaging_revision')
    expect(task.status).toBe('waiting_feedback')
    expect(insight.source_feedback_ids).toEqual(['fb-200'])
  })
})

describe('marketing asset delivery and persistence helpers', () => {
  it('prevents unvalidated assets from reaching sales and keeps version history', () => {
    const draft = createMarketingAsset({
      asset_id: 'asset-100',
      campaign_id: 'cmp-100',
      segment_id: 'ops-leaders',
      asset_type: 'one_pager',
      content: '  AI agent rollout plan  ',
      cta: '  Book diagnostic  ',
      created_at: '2026-05-14T09:00:00Z',
      technical_claim_status: 'requires_validation',
    })

    expect(() => buildAssetPackage([draft], '2026-05-14T09:05:00Z')).toThrow()

    const revised = reviseMarketingAsset(draft, {
      technical_claim_status: 'validated',
      status: 'ready',
      updated_at: '2026-05-14T10:00:00Z',
    })

    const assetPackage = buildAssetPackage([revised], '2026-05-14T10:05:00Z')
    const message = buildAssetDeliveryMessage(assetPackage, '2026-05-14T10:06:00Z')
    const store = new InMemoryMarketingStore()
    store.saveAsset(draft)
    store.saveAsset(revised)
    store.recordSalesUsage({
      asset_id: revised.asset_id,
      campaign_id: revised.campaign_id,
      segment_id: revised.segment_id,
      used_at: '2026-05-14T10:06:00Z',
    })

    const snapshot = store.createSnapshot()
    const restored = InMemoryMarketingStore.restore(snapshot)

    expect(revised.version).toBe(2)
    expect(revised.status).toBe('ready')
    expect(message.payload.asset_ids).toEqual(['asset-100'])
    expect(restored.listLatestAssetsBySegment('ops-leaders')[0]?.version).toBe(2)
  })

  it('retries unacknowledged inbound leads and escalates repeated failures', () => {
    const registered = registerInboundLead({
      lead_id: 'lead-retry-1',
      company_name: 'Delta Ops',
      contact_channel: 'linkedin',
      source_channel: 'social',
      campaign_id: 'cmp-retry',
      segment_id: 'ops-leaders',
      project_id: null,
      captured_at: '2026-05-14T11:00:00Z',
      ack_status: 'pending_sales_ack',
      tags: ['social'],
    }, {
      routingProjectId: 'routing-retry',
      timestamp: '2026-05-14T11:00:30Z',
    })

    const retry1 = retryLeadHandoff(registered, '2026-05-14T12:00:00Z')
    const retry2 = retryLeadHandoff(retry1, '2026-05-14T13:00:00Z')
    const retry3 = retryLeadHandoff(retry2, '2026-05-14T14:00:00Z')
    const escalation = buildLeadHandoffEscalation(
      retry3,
      'Sales acknowledgment SLA breached',
      '2026-05-14T14:05:00Z',
    )
    const acked = acknowledgeLeadHandoff(registered)

    expect(retry1.packet.ack_status).toBe('retrying')
    expect(retry3.packet.ack_status).toBe('failed')
    expect(escalation.payload.failure_count).toBe(3)
    expect(acked.packet.ack_status).toBe('acknowledged')
  })

  it('builds report snapshots from persisted campaigns, leads, and feedback', () => {
    const store = new InMemoryMarketingStore()
    const plan = reviseCampaignPlan(
      createCampaignPlan('cmp-report', {
        objective: 'Drive inbound demos',
        target_segments: ['ops'],
        primary_channels: ['email'],
        timeline: {
          start_at: '2026-05-14T00:00:00Z',
          end_at: '2026-05-21T00:00:00Z',
        },
        key_message: 'Clearer AI ROI',
        call_to_action: 'Book demo',
        success_metrics: ['5 demos'],
        dependencies: [],
      }, '2026-05-14T08:00:00Z'),
      { status: 'active' },
      '2026-05-14T09:00:00Z',
    )
    store.saveCampaign(plan)
    store.queueLeadRetry(
      acknowledgeLeadHandoff(
        registerInboundLead({
          lead_id: 'lead-report-1',
          company_name: 'Northwind',
          contact_channel: 'website_form',
          source_channel: 'website',
          campaign_id: 'cmp-report',
          segment_id: 'ops',
          project_id: null,
          captured_at: '2026-05-14T10:00:00Z',
          ack_status: 'pending_sales_ack',
          tags: ['inbound'],
        }),
      ),
    )
    store.saveAsset(
      reviseMarketingAsset(
        createMarketingAsset({
          asset_id: 'asset-report',
          campaign_id: 'cmp-report',
          segment_id: 'ops',
          asset_type: 'landing_copy',
          content: 'ROI-first messaging',
          cta: 'Book demo',
          created_at: '2026-05-14T10:30:00Z',
        }),
        {
          status: 'ready',
          updated_at: '2026-05-14T11:00:00Z',
        },
      ),
    )

    const report = store.buildReport([
      {
        feedback_id: 'fb-report-1',
        campaign_id: 'cmp-report',
        segment_id: 'ops',
        asset_id: 'asset-report',
        project_id: null,
        objections: ['Need stronger case study', 'ROI proof still too abstract'],
        lost_reasons: [],
        response_patterns: ['ROI in first month'],
        conversion_signal: 'negative',
        summary: 'Leads need proof quickly',
        received_at: '2026-05-14T12:00:00Z',
      },
    ])

    expect(report.active_campaigns).toBe(1)
    expect(report.assets_per_segment.ops).toBe(1)
    expect(report.inbound_leads_per_campaign['cmp-report']).toBe(1)
    expect(report.sales_ack_rate).toBe(1)
    expect(report.at_risk_campaigns).toContain('cmp-report')
  })

  it('preserves task state transitions for restart-friendly recovery', () => {
    const task = createMarketingTask({
      task_id: 'task-campaign-1',
      campaign_id: 'cmp-task',
      segment_id: 'ops',
      kind: 'campaign_planning',
      created_at: '2026-05-14T08:00:00Z',
      context: { objective: 'Generate demos' },
    })
    const running = updateMarketingTaskStatus(task, 'running', '2026-05-14T08:05:00Z')
    const done = updateMarketingTaskStatus(running, 'completed', '2026-05-14T08:20:00Z')

    expect(done.status).toBe('completed')
    expect(done.context.objective).toBe('Generate demos')
  })
})
