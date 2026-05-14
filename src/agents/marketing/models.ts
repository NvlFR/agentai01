import type { Agent_Message, Lifecycle_State } from '../../domain/types.js'

export type MarketingChannel = 'website' | 'email' | 'social'

export type MarketingToolName =
  | 'campaign_plan'
  | 'content_write'
  | 'market_research'
  | 'asset_store'
  | 'message_send'

export type MarketingAgentDefinition = {
  agentType: 'marketing'
  description: string
  systemPrompt: string
  tools: MarketingToolName[]
}

export const MARKETING_AGENT_DEFINITION: MarketingAgentDefinition = {
  agentType: 'marketing',
  description:
    'Owns demand generation, campaign planning, asset delivery, inbound lead routing, and the sales feedback loop.',
  systemPrompt:
    'You are the Marketing Agent for AI Company. Plan campaigns, generate trustworthy assets, route inbound leads to Sales with full metadata, and revise messaging when sales feedback reveals drift.',
  tools: [
    'campaign_plan',
    'content_write',
    'market_research',
    'asset_store',
    'message_send',
  ],
}

export type CampaignStatus = 'draft' | 'active' | 'at_risk' | 'archived'

export type CampaignTimeline = {
  start_at: string
  end_at: string
}

export type CampaignPlanInput = {
  objective: string
  target_segments: string[]
  primary_channels: MarketingChannel[]
  timeline: CampaignTimeline
  key_message: string
  call_to_action: string
  success_metrics: string[]
  dependencies: string[]
}

export type CampaignPlan = CampaignPlanInput & {
  campaign_id: string
  version: number
  status: CampaignStatus
  created_at: string
  updated_at: string
}

export type MarketInsight = {
  insight_id: string
  campaign_id: string
  segment_id: string
  pain_points: string[]
  buying_triggers: string[]
  competitor_pressure: string[]
  objections: string[]
  positioning_statement: string
  recommended_messaging: string[]
  recommended_offer_angles: string[]
  generated_at: string
  source_feedback_ids: string[]
}

export type MarketingAssetType =
  | 'article'
  | 'landing_copy'
  | 'email_sequence'
  | 'social_post'
  | 'one_pager'
  | 'case_study_summary'
  | 'objection_copy'

export type MarketingAssetStatus =
  | 'draft'
  | 'ready'
  | 'revised'
  | 'requires_validation'

export type TechnicalClaimStatus =
  | 'not_applicable'
  | 'requires_validation'
  | 'validated'

export type MarketingAsset = {
  asset_id: string
  campaign_id: string
  asset_type: MarketingAssetType
  segment_id: string
  content: string
  cta: string
  version: number
  status: MarketingAssetStatus
  technical_claim_status: TechnicalClaimStatus
  created_at: string
  updated_at: string
}

export type AssetPackage = {
  campaign_id: string
  segment_id: string
  asset_ids: string[]
  assets: MarketingAsset[]
  generated_at: string
}

export type LeadAckStatus =
  | 'pending_sales_ack'
  | 'acknowledged'
  | 'retrying'
  | 'failed'

export type InboundLeadPacket = {
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
  ack_status: LeadAckStatus
  tags: string[]
}

export type SalesFeedbackPacket = {
  feedback_id: string
  campaign_id: string
  segment_id: string
  asset_id?: string
  project_id: string | null
  objections: string[]
  lost_reasons: string[]
  response_patterns: string[]
  conversion_signal: 'positive' | 'neutral' | 'negative'
  summary: string
  received_at: string
}

export type MessagingRevision = {
  campaign_id: string
  segment_id: string
  revision_reason: string
  previous_message: string
  recommended_message: string
  at_risk: boolean
  lifecycle_hint: Lifecycle_State
  created_at: string
}

export type MarketingTaskStatus =
  | 'queued'
  | 'running'
  | 'waiting_feedback'
  | 'completed'
  | 'failed'

export type MarketingTaskKind =
  | 'campaign_planning'
  | 'messaging_revision'
  | 'lead_handoff_retry'

export type MarketingTask = {
  task_id: string
  campaign_id: string
  segment_id?: string
  kind: MarketingTaskKind
  status: MarketingTaskStatus
  created_at: string
  updated_at: string
  context: Record<string, string>
}

export type SalesCompatibleLeadHandoffPayload = InboundLeadPacket & {
  handoff_source: 'marketing_campaign'
  lifecycle_state_hint: 'lead'
  pending_project_creation: boolean
}

export type MarketingLeadHandoffMessage =
  Agent_Message<SalesCompatibleLeadHandoffPayload>

export type SalesAssetDeliveryMessage = Agent_Message<AssetPackage> & {
  from: 'marketing_agent'
  to: 'sales_agent'
  message_type: 'status_update'
}

export type MarketingEscalationMessage = Agent_Message<{
  lead_id: string
  campaign_id: string
  failure_count: number
  reason: string
}> & {
  from: 'marketing_agent'
  to: 'ceo_agent'
  message_type: 'status_update'
}

export function createCampaignPlan(
  campaignId: string,
  input: CampaignPlanInput,
  now = new Date().toISOString(),
): CampaignPlan {
  return {
    campaign_id: campaignId,
    objective: input.objective.trim(),
    target_segments: dedupeStrings(input.target_segments),
    primary_channels: dedupeStrings(input.primary_channels) as MarketingChannel[],
    timeline: { ...input.timeline },
    key_message: input.key_message.trim(),
    call_to_action: input.call_to_action.trim(),
    success_metrics: dedupeStrings(input.success_metrics),
    dependencies: dedupeStrings(input.dependencies),
    version: 1,
    status: 'draft',
    created_at: now,
    updated_at: now,
  }
}

export function reviseCampaignPlan(
  current: CampaignPlan,
  updates: Partial<Omit<CampaignPlanInput, 'timeline'>> & {
    timeline?: Partial<CampaignTimeline>
    status?: CampaignStatus
  },
  now = new Date().toISOString(),
): CampaignPlan {
  return {
    ...current,
    objective: updates.objective?.trim() ?? current.objective,
    target_segments: updates.target_segments
      ? dedupeStrings(updates.target_segments)
      : current.target_segments,
    primary_channels: updates.primary_channels
      ? (dedupeStrings(updates.primary_channels) as MarketingChannel[])
      : current.primary_channels,
    timeline: {
      start_at: updates.timeline?.start_at ?? current.timeline.start_at,
      end_at: updates.timeline?.end_at ?? current.timeline.end_at,
    },
    key_message: updates.key_message?.trim() ?? current.key_message,
    call_to_action: updates.call_to_action?.trim() ?? current.call_to_action,
    success_metrics: updates.success_metrics
      ? dedupeStrings(updates.success_metrics)
      : current.success_metrics,
    dependencies: updates.dependencies
      ? dedupeStrings(updates.dependencies)
      : current.dependencies,
    version: current.version + 1,
    status: updates.status ?? current.status,
    updated_at: now,
  }
}

export function normalizeInboundLeadPacket(
  packet: Omit<InboundLeadPacket, 'project_id' | 'ack_status' | 'tags'> &
    Partial<Pick<InboundLeadPacket, 'project_id' | 'ack_status' | 'tags'>>,
): InboundLeadPacket {
  return {
    ...packet,
    company_name: packet.company_name.trim(),
    contact_name: packet.contact_name?.trim(),
    contact_email: packet.contact_email?.trim(),
    contact_channel: packet.contact_channel.trim(),
    source_channel: packet.source_channel.trim(),
    campaign_id: packet.campaign_id.trim(),
    segment_id: packet.segment_id.trim(),
    project_id: packet.project_id ?? null,
    initial_need_summary: packet.initial_need_summary?.trim(),
    ack_status: packet.ack_status ?? 'pending_sales_ack',
    tags: dedupeStrings(packet.tags ?? []),
  }
}

export function resolveLeadHandoffProjectId(
  packet: Pick<InboundLeadPacket, 'project_id' | 'campaign_id'>,
  routingProjectId?: string,
): string {
  if (packet.project_id) {
    return packet.project_id
  }
  if (routingProjectId && routingProjectId.trim()) {
    return routingProjectId.trim()
  }
  return `routing-${slugify(packet.campaign_id)}`
}

export function buildSalesLeadHandoffMessage(
  packet: InboundLeadPacket,
  options?: {
    routingProjectId?: string
    timestamp?: string
  },
): MarketingLeadHandoffMessage {
  const normalizedPacket = normalizeInboundLeadPacket(packet)
  return {
    from: 'marketing_agent',
    to: 'sales_agent',
    message_type: 'lead_handoff',
    project_id: resolveLeadHandoffProjectId(
      normalizedPacket,
      options?.routingProjectId,
    ),
    timestamp: options?.timestamp ?? new Date().toISOString(),
    payload: {
      ...normalizedPacket,
      handoff_source: 'marketing_campaign',
      lifecycle_state_hint: 'lead',
      pending_project_creation: normalizedPacket.project_id === null,
    },
  }
}

export function generateMessagingRevision(
  feedback: SalesFeedbackPacket,
  currentMessage: string,
  now = new Date().toISOString(),
): MessagingRevision {
  const negativeSignal = feedback.conversion_signal === 'negative'
  const primaryObjection = feedback.objections[0] ?? feedback.lost_reasons[0] ?? 'market feedback mismatch'

  return {
    campaign_id: feedback.campaign_id,
    segment_id: feedback.segment_id,
    revision_reason: primaryObjection,
    previous_message: currentMessage,
    recommended_message: buildRecommendedMessage(feedback, currentMessage),
    at_risk: negativeSignal || feedback.objections.length >= 3,
    lifecycle_hint: 'lead',
    created_at: now,
  }
}

export function feedbackToMarketInsight(
  feedback: SalesFeedbackPacket,
  now = new Date().toISOString(),
): MarketInsight {
  return {
    insight_id: feedback.feedback_id,
    campaign_id: feedback.campaign_id,
    segment_id: feedback.segment_id,
    pain_points: dedupeStrings([
      ...feedback.objections,
      ...feedback.lost_reasons,
    ]),
    buying_triggers: dedupeStrings(feedback.response_patterns),
    competitor_pressure: dedupeStrings(feedback.lost_reasons),
    objections: dedupeStrings(feedback.objections),
    positioning_statement: feedback.summary,
    recommended_messaging: [
      buildRecommendedMessage(feedback, feedback.summary),
    ],
    recommended_offer_angles: dedupeStrings(feedback.response_patterns),
    generated_at: now,
    source_feedback_ids: [feedback.feedback_id],
  }
}

export function isCampaignPlan(value: unknown): value is CampaignPlan {
  if (!isObject(value)) return false
  return (
    typeof value.campaign_id === 'string' &&
    typeof value.objective === 'string' &&
    isStringArray(value.target_segments) &&
    isStringArray(value.primary_channels) &&
    isObject(value.timeline) &&
    typeof value.timeline.start_at === 'string' &&
    typeof value.timeline.end_at === 'string' &&
    typeof value.key_message === 'string' &&
    typeof value.call_to_action === 'string' &&
    isStringArray(value.success_metrics) &&
    isStringArray(value.dependencies) &&
    typeof value.version === 'number' &&
    typeof value.status === 'string' &&
    typeof value.created_at === 'string' &&
    typeof value.updated_at === 'string'
  )
}

export function isMarketInsight(value: unknown): value is MarketInsight {
  if (!isObject(value)) return false
  return (
    typeof value.insight_id === 'string' &&
    typeof value.campaign_id === 'string' &&
    typeof value.segment_id === 'string' &&
    isStringArray(value.pain_points) &&
    isStringArray(value.buying_triggers) &&
    isStringArray(value.competitor_pressure) &&
    isStringArray(value.objections) &&
    typeof value.positioning_statement === 'string' &&
    isStringArray(value.recommended_messaging) &&
    isStringArray(value.recommended_offer_angles) &&
    typeof value.generated_at === 'string' &&
    isStringArray(value.source_feedback_ids)
  )
}

export function isMarketingAsset(value: unknown): value is MarketingAsset {
  if (!isObject(value)) return false
  return (
    typeof value.asset_id === 'string' &&
    typeof value.campaign_id === 'string' &&
    typeof value.asset_type === 'string' &&
    typeof value.segment_id === 'string' &&
    typeof value.content === 'string' &&
    typeof value.cta === 'string' &&
    typeof value.version === 'number' &&
    typeof value.status === 'string' &&
    typeof value.technical_claim_status === 'string' &&
    typeof value.created_at === 'string' &&
    typeof value.updated_at === 'string'
  )
}

export function isInboundLeadPacket(value: unknown): value is InboundLeadPacket {
  if (!isObject(value)) return false
  return (
    typeof value.lead_id === 'string' &&
    typeof value.company_name === 'string' &&
    (typeof value.contact_name === 'string' || typeof value.contact_name === 'undefined') &&
    (typeof value.contact_email === 'string' || typeof value.contact_email === 'undefined') &&
    typeof value.contact_channel === 'string' &&
    typeof value.source_channel === 'string' &&
    typeof value.campaign_id === 'string' &&
    typeof value.segment_id === 'string' &&
    (typeof value.project_id === 'string' || value.project_id === null) &&
    (typeof value.initial_need_summary === 'string' ||
      typeof value.initial_need_summary === 'undefined') &&
    typeof value.captured_at === 'string' &&
    typeof value.ack_status === 'string' &&
    isStringArray(value.tags)
  )
}

function buildRecommendedMessage(
  feedback: SalesFeedbackPacket,
  fallback: string,
): string {
  const trigger = feedback.response_patterns[0]
  const objection = feedback.objections[0] ?? feedback.lost_reasons[0]
  if (trigger && objection) {
    return `Lead with ${trigger} but answer objection: ${objection}`
  }
  if (trigger) {
    return `Lean into ${trigger} with a stronger CTA`
  }
  if (objection) {
    return `Clarify value proposition against objection: ${objection}`
  }
  return fallback
}

function dedupeStrings<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values.map(value => value.trim()).filter(Boolean))] as T[]
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function isObject(
  value: unknown,
): value is Record<string, unknown> & {
  timeline?: Record<string, unknown>
} {
  return typeof value === 'object' && value !== null
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string')
}
