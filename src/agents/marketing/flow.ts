import {
  MARKETING_AGENT_DEFINITION,
  buildSalesLeadHandoffMessage,
  createCampaignPlan,
  feedbackToMarketInsight,
  generateMessagingRevision,
  normalizeInboundLeadPacket,
  reviseCampaignPlan,
  type AssetPackage,
  type CampaignPlan,
  type CampaignPlanInput,
  type InboundLeadPacket,
  type MarketingAsset,
  type MarketingAssetStatus,
  type MarketingAssetType,
  type MarketingEscalationMessage,
  type MarketingLeadHandoffMessage,
  type MarketingTask,
  type MessagingRevision,
  type SalesAssetDeliveryMessage,
  type SalesFeedbackPacket,
  type TechnicalClaimStatus,
} from './models.js'

type AssetDraftInput = {
  asset_id: string
  campaign_id: string
  segment_id: string
  asset_type: MarketingAssetType
  content: string
  cta: string
  created_at: string
  technical_claim_status?: TechnicalClaimStatus
}

type AssetRevisionInput = {
  content?: string
  cta?: string
  technical_claim_status?: TechnicalClaimStatus
  status?: MarketingAssetStatus
  updated_at: string
}

type LeadRetryState = {
  packet: InboundLeadPacket
  message: MarketingLeadHandoffMessage
  failure_count: number
  last_error?: string
}

type MarketingPersistenceSnapshot = {
  campaigns: CampaignPlan[]
  assets: MarketingAsset[]
  insights: ReturnType<typeof feedbackToMarketInsight>[]
  lead_retry_queue: LeadRetryState[]
  tasks: MarketingTask[]
  sales_usage: Record<string, { campaign_id: string; segment_id: string; used_at: string }>
}

type ReportSnapshot = {
  active_campaigns: number
  assets_per_segment: Record<string, number>
  inbound_leads_per_campaign: Record<string, number>
  sales_ack_rate: number
  conversion_feedback_per_source: Record<string, number>
  at_risk_campaigns: string[]
}

export { MARKETING_AGENT_DEFINITION }

export function createVersionedCampaignPlan(
  campaignId: string,
  input: CampaignPlanInput,
  now: string,
): CampaignPlan {
  return createCampaignPlan(campaignId, input, now)
}

export function createMarketingAsset(input: AssetDraftInput): MarketingAsset {
  return {
    asset_id: input.asset_id,
    campaign_id: input.campaign_id,
    asset_type: input.asset_type,
    segment_id: input.segment_id,
    content: input.content.trim(),
    cta: input.cta.trim(),
    version: 1,
    status: deriveInitialAssetStatus(input.technical_claim_status),
    technical_claim_status: input.technical_claim_status ?? 'not_applicable',
    created_at: input.created_at,
    updated_at: input.created_at,
  }
}

export function reviseMarketingAsset(
  asset: MarketingAsset,
  updates: AssetRevisionInput,
): MarketingAsset {
  const technicalClaimStatus =
    updates.technical_claim_status ?? asset.technical_claim_status
  const nextStatus =
    updates.status ??
    (technicalClaimStatus === 'requires_validation' ? 'requires_validation' : 'revised')

  return {
    ...asset,
    content: updates.content?.trim() ?? asset.content,
    cta: updates.cta?.trim() ?? asset.cta,
    version: asset.version + 1,
    status: nextStatus,
    technical_claim_status: technicalClaimStatus,
    updated_at: updates.updated_at,
  }
}

export function buildAssetPackage(
  assets: readonly MarketingAsset[],
  generatedAt: string,
): AssetPackage {
  if (assets.length === 0) {
    throw new Error('Asset package requires at least one asset')
  }

  const invalid = assets.find(
    asset =>
      asset.status === 'requires_validation' ||
      asset.technical_claim_status === 'requires_validation',
  )
  if (invalid) {
    throw new Error(`Asset ${invalid.asset_id} is not ready for Sales delivery`)
  }

  return {
    campaign_id: assets[0]!.campaign_id,
    segment_id: assets[0]!.segment_id,
    asset_ids: assets.map(asset => asset.asset_id),
    assets: assets.map(asset => ({ ...asset })),
    generated_at: generatedAt,
  }
}

export function buildAssetDeliveryMessage(
  assetPackage: AssetPackage,
  timestamp: string,
  projectId = `routing-${assetPackage.campaign_id}`,
): SalesAssetDeliveryMessage {
  return {
    from: 'marketing_agent',
    to: 'sales_agent',
    message_type: 'status_update',
    project_id: projectId,
    timestamp,
    payload: {
      ...assetPackage,
      asset_ids: [...assetPackage.asset_ids],
      assets: assetPackage.assets.map(asset => ({ ...asset })),
    },
  }
}

export function registerInboundLead(
  packet: InboundLeadPacket,
  options?: { routingProjectId?: string; timestamp?: string },
): LeadRetryState {
  const normalized = normalizeInboundLeadPacket(packet)
  return {
    packet: normalized,
    message: buildSalesLeadHandoffMessage(normalized, options),
    failure_count: 0,
  }
}

export function acknowledgeLeadHandoff(state: LeadRetryState): LeadRetryState {
  return {
    ...state,
    packet: {
      ...state.packet,
      ack_status: 'acknowledged',
    },
  }
}

export function retryLeadHandoff(
  state: LeadRetryState,
  timestamp: string,
): LeadRetryState {
  const retryCount = state.failure_count + 1
  const packet = {
    ...state.packet,
    ack_status: retryCount >= 3 ? 'failed' : 'retrying',
  } as InboundLeadPacket

  return {
    packet,
    message: buildSalesLeadHandoffMessage(packet, {
      routingProjectId: state.message.project_id,
      timestamp,
    }),
    failure_count: retryCount,
    last_error: state.last_error,
  }
}

export function buildLeadHandoffEscalation(
  state: LeadRetryState,
  reason: string,
  timestamp: string,
): MarketingEscalationMessage {
  return {
    from: 'marketing_agent',
    to: 'ceo_agent',
    message_type: 'status_update',
    project_id: state.message.project_id,
    timestamp,
    payload: {
      lead_id: state.packet.lead_id,
      campaign_id: state.packet.campaign_id,
      failure_count: state.failure_count,
      reason,
    },
  }
}

export function createMarketingTask(input: {
  task_id: string
  campaign_id: string
  kind: MarketingTask['kind']
  created_at: string
  segment_id?: string
  context?: Record<string, string>
}): MarketingTask {
  return {
    task_id: input.task_id,
    campaign_id: input.campaign_id,
    segment_id: input.segment_id,
    kind: input.kind,
    status: 'queued',
    created_at: input.created_at,
    updated_at: input.created_at,
    context: { ...(input.context ?? {}) },
  }
}

export function updateMarketingTaskStatus(
  task: MarketingTask,
  status: MarketingTask['status'],
  updatedAt: string,
): MarketingTask {
  return {
    ...task,
    status,
    updated_at: updatedAt,
    context: { ...task.context },
  }
}

export function ingestSalesFeedback(
  feedback: SalesFeedbackPacket,
  currentMessage: string,
  now: string,
): {
  insight: ReturnType<typeof feedbackToMarketInsight>
  revision: MessagingRevision
  task: MarketingTask
} {
  const insight = feedbackToMarketInsight(feedback, now)
  const revision = generateMessagingRevision(feedback, currentMessage, now)
  const task = createMarketingTask({
    task_id: `msg-revision-${feedback.feedback_id}`,
    campaign_id: feedback.campaign_id,
    segment_id: feedback.segment_id,
    kind: 'messaging_revision',
    created_at: now,
    context: {
      revision_reason: revision.revision_reason,
      conversion_signal: feedback.conversion_signal,
    },
  })

  return {
    insight,
    revision,
    task: updateMarketingTaskStatus(task, 'waiting_feedback', now),
  }
}

export class InMemoryMarketingStore {
  private campaigns = new Map<string, CampaignPlan[]>()
  private assets = new Map<string, MarketingAsset[]>()
  private insights = new Map<string, ReturnType<typeof feedbackToMarketInsight>>()
  private leadRetryQueue = new Map<string, LeadRetryState>()
  private tasks = new Map<string, MarketingTask>()
  private salesUsage = new Map<string, { campaign_id: string; segment_id: string; used_at: string }>()

  saveCampaign(plan: CampaignPlan): void {
    const versions = this.campaigns.get(plan.campaign_id) ?? []
    this.campaigns.set(plan.campaign_id, [...versions, { ...plan }])
  }

  saveAsset(asset: MarketingAsset): void {
    const versions = this.assets.get(asset.asset_id) ?? []
    this.assets.set(asset.asset_id, [...versions, { ...asset }])
  }

  saveInsight(insight: ReturnType<typeof feedbackToMarketInsight>): void {
    this.insights.set(insight.insight_id, {
      ...insight,
      pain_points: [...insight.pain_points],
      buying_triggers: [...insight.buying_triggers],
      competitor_pressure: [...insight.competitor_pressure],
      objections: [...insight.objections],
      recommended_messaging: [...insight.recommended_messaging],
      recommended_offer_angles: [...insight.recommended_offer_angles],
      source_feedback_ids: [...insight.source_feedback_ids],
    })
  }

  queueLeadRetry(state: LeadRetryState): void {
    this.leadRetryQueue.set(state.packet.lead_id, {
      ...state,
      packet: { ...state.packet, tags: [...state.packet.tags] },
      message: { ...state.message, payload: { ...state.message.payload, tags: [...state.message.payload.tags] } },
    })
  }

  saveTask(task: MarketingTask): void {
    this.tasks.set(task.task_id, {
      ...task,
      context: { ...task.context },
    })
  }

  recordSalesUsage(input: {
    asset_id: string
    campaign_id: string
    segment_id: string
    used_at: string
  }): void {
    this.salesUsage.set(input.asset_id, { ...input })
  }

  listLatestAssetsBySegment(segmentId: string): MarketingAsset[] {
    const latestAssets = [...this.assets.values()]
      .map(versions => versions.at(-1))
      .filter((asset): asset is MarketingAsset => asset !== undefined)

    return latestAssets
      .filter(asset => asset.segment_id === segmentId)
      .map(asset => ({ ...asset }))
  }

  createSnapshot(): MarketingPersistenceSnapshot {
    return {
      campaigns: [...this.campaigns.values()].flat().map(plan => ({ ...plan })),
      assets: [...this.assets.values()].flat().map(asset => ({ ...asset })),
      insights: [...this.insights.values()].map(insight => ({
        ...insight,
        pain_points: [...insight.pain_points],
        buying_triggers: [...insight.buying_triggers],
        competitor_pressure: [...insight.competitor_pressure],
        objections: [...insight.objections],
        recommended_messaging: [...insight.recommended_messaging],
        recommended_offer_angles: [...insight.recommended_offer_angles],
        source_feedback_ids: [...insight.source_feedback_ids],
      })),
      lead_retry_queue: [...this.leadRetryQueue.values()].map(state => ({
        ...state,
        packet: { ...state.packet, tags: [...state.packet.tags] },
        message: { ...state.message, payload: { ...state.message.payload, tags: [...state.message.payload.tags] } },
      })),
      tasks: [...this.tasks.values()].map(task => ({
        ...task,
        context: { ...task.context },
      })),
      sales_usage: Object.fromEntries([...this.salesUsage.entries()]),
    }
  }

  static restore(snapshot: MarketingPersistenceSnapshot): InMemoryMarketingStore {
    const store = new InMemoryMarketingStore()
    for (const plan of snapshot.campaigns) store.saveCampaign(plan)
    for (const asset of snapshot.assets) store.saveAsset(asset)
    for (const insight of snapshot.insights) store.saveInsight(insight)
    for (const state of snapshot.lead_retry_queue) store.queueLeadRetry(state)
    for (const task of snapshot.tasks) store.saveTask(task)
    for (const [assetId, usage] of Object.entries(snapshot.sales_usage)) {
      store.recordSalesUsage({ asset_id: assetId, ...usage })
    }
    return store
  }

  buildReport(feedbackPackets: readonly SalesFeedbackPacket[] = []): ReportSnapshot {
    const assetsPerSegment: Record<string, number> = {}
    const latestAssets = [...this.assets.values()]
      .map(versions => versions.at(-1))
      .filter((asset): asset is MarketingAsset => asset !== undefined)

    for (const asset of latestAssets) {
      assetsPerSegment[asset.segment_id] = (assetsPerSegment[asset.segment_id] ?? 0) + 1
    }

    const inboundLeadsPerCampaign: Record<string, number> = {}
    let acknowledged = 0
    let totalLeads = 0
    const atRiskCampaigns = new Set<string>()

    for (const state of this.leadRetryQueue.values()) {
      totalLeads += 1
      inboundLeadsPerCampaign[state.packet.campaign_id] =
        (inboundLeadsPerCampaign[state.packet.campaign_id] ?? 0) + 1
      if (state.packet.ack_status === 'acknowledged') acknowledged += 1
      if (state.failure_count >= 2) atRiskCampaigns.add(state.packet.campaign_id)
    }

    const conversionFeedbackPerSource: Record<string, number> = {}
    for (const feedback of feedbackPackets) {
      conversionFeedbackPerSource[feedback.campaign_id] =
        (conversionFeedbackPerSource[feedback.campaign_id] ?? 0) +
        (feedback.conversion_signal === 'positive' ? 1 : feedback.conversion_signal === 'neutral' ? 0 : -1)
      if (feedback.conversion_signal === 'negative' && feedback.objections.length >= 2) {
        atRiskCampaigns.add(feedback.campaign_id)
      }
    }

    return {
      active_campaigns: [...this.campaigns.values()]
        .map(versions => versions.at(-1))
        .filter((plan): plan is CampaignPlan => plan !== undefined)
        .filter(plan => plan.status === 'active').length,
      assets_per_segment: assetsPerSegment,
      inbound_leads_per_campaign: inboundLeadsPerCampaign,
      sales_ack_rate: totalLeads === 0 ? 1 : acknowledged / totalLeads,
      conversion_feedback_per_source: conversionFeedbackPerSource,
      at_risk_campaigns: [...atRiskCampaigns],
    }
  }
}

function deriveInitialAssetStatus(
  technicalClaimStatus: TechnicalClaimStatus | undefined,
): MarketingAssetStatus {
  if (technicalClaimStatus === 'requires_validation') return 'requires_validation'
  return 'draft'
}
