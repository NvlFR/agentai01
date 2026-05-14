import type {
  AgentType,
  Agent_Message,
  Approval_Request,
  Approval_Response,
  Lifecycle_State,
} from '../../domain/types.js'
import { buildProjectNamespace } from '../../domain/types.js'

export type ProductAgentDefinition = {
  id: 'product-agent'
  name: 'Product_Agent'
  agentType: 'product'
  runtimeAgentType: 'product_agent'
  parentSpecRefs: readonly [
    '.kiro/specs/ai-company-agents/requirements.md',
    '.kiro/specs/product-agent/requirements.md',
  ]
  supportedMessageTypes: readonly [
    'lead_handoff',
    'clarification_response',
    'approval_response',
    'status_update',
  ]
}

export const PRODUCT_AGENT_DEFINITION: ProductAgentDefinition = {
  id: 'product-agent',
  name: 'Product_Agent',
  agentType: 'product',
  runtimeAgentType: 'product_agent',
  parentSpecRefs: [
    '.kiro/specs/ai-company-agents/requirements.md',
    '.kiro/specs/product-agent/requirements.md',
  ],
  supportedMessageTypes: [
    'lead_handoff',
    'clarification_response',
    'approval_response',
    'status_update',
  ],
}

export type ProductLifecycleState = Lifecycle_State
export type DiscoveryStatus =
  | 'idle'
  | 'awaiting_clarification'
  | 'discovery_in_progress'
  | 'spec_drafting'
  | 'awaiting_owner_approval'
  | 'approved'
  | 'ready_for_implementation'

export type HandoffStatus =
  | 'not_sent'
  | 'validation_failed'
  | 'awaiting_engineering_ack'
  | 'handoff_completed'

export type ProductTaskName =
  | 'handoff_validation'
  | 'discovery_in_progress'
  | 'awaiting_clarification'
  | 'spec_drafting'
  | 'awaiting_owner_approval'
  | 'awaiting_engineering_ack'

export type ProductTaskStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'blocked'
  | 'overdue'

export type ProductTask = {
  task_name: ProductTaskName
  status: ProductTaskStatus
  updated_at: string
  detail: string
}

export type LeadHandoffPayload = {
  business_summary?: string
  stakeholders?: string[]
  last_proposal_ref?: string
  initial_scope?: string[]
  commercial_assumptions?: string[]
  initial_risks?: string[]
  company_name?: string
  pain_points?: string[]
  conversation_notes?: string[]
}

export type LeadHandoffMessage = Agent_Message<LeadHandoffPayload> & {
  from: 'sales_agent'
  to: 'product_agent'
  message_type: 'lead_handoff'
}

export type ClarificationEntry = {
  question: string
  answer?: string
  asked_at: string
  answered_at?: string
  source: 'sales_agent' | 'owner'
}

export type DiscoveryCapability = {
  capability: string
  recommended_agent_type: AgentType
  rationale: string
  priority: 'critical' | 'high' | 'medium' | 'low'
}

export type ProductRisk = {
  id: string
  summary: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  mitigation: string
}

export type ProductArtifacts = {
  namespace: string
  clarification_log_ref: string
  clarification_log_json: string
  discovery_notes_ref: string
  discovery_notes_md: string
  assumptions_ref: string
  assumptions_md: string
  risk_register_ref: string
  risk_register_md: string
}

export type ProductSpecVersion = {
  version: number
  artifact_ref: string
  content: string
  created_at: string
  source: 'draft' | 'revision'
}

export type ProductApprovalHistory = {
  version: number
  response: Approval_Response
}

export type ProductProjectState = {
  project_id: string
  client_id: string
  lifecycle_state: ProductLifecycleState
  spec_version: number
  discovery_status: DiscoveryStatus
  handoff_status: HandoffStatus
  namespace: string
  tasks: ProductTask[]
  capability_map: DiscoveryCapability[]
  clarification_log: ClarificationEntry[]
  assumptions: string[]
  conflicts: string[]
  risks: ProductRisk[]
  artifacts: Record<string, string>
  latest_spec?: ProductSpecVersion
  spec_history: ProductSpecVersion[]
  approval_history: ProductApprovalHistory[]
  audit_log: string[]
  last_updated_at: string
}

export type ProductTool<Input, Output> = {
  name: string
  description: string
  inputSchema: readonly string[]
  isConcurrencySafe: boolean
  checkPermissions: (input: Input) => true
  call: (input: Input) => Output
}

export function buildTool<Input, Output>(tool: ProductTool<Input, Output>): ProductTool<Input, Output> {
  return tool
}

export function checkPermissions(): true {
  return true
}

export function createProductProjectState(input: {
  project_id: string
  client_id: string
  timestamp: string
}): ProductProjectState {
  return {
    project_id: input.project_id,
    client_id: input.client_id,
    lifecycle_state: 'won',
    spec_version: 0,
    discovery_status: 'idle',
    handoff_status: 'not_sent',
    namespace: buildProjectNamespace(input.client_id, input.project_id),
    tasks: [],
    capability_map: [],
    clarification_log: [],
    assumptions: [],
    conflicts: [],
    risks: [],
    artifacts: {},
    spec_history: [],
    approval_history: [],
    audit_log: [],
    last_updated_at: input.timestamp,
  }
}

export function createApprovalRequest(input: {
  request_id: string
  timestamp: string
  project_id: string
  artifact_ref: string
  summary: string
  recommendation: string
  risks: string[]
}): Approval_Request {
  return {
    request_id: input.request_id,
    gate: 'spec_final',
    from_agent: 'product_agent',
    timestamp: input.timestamp,
    project_id: input.project_id,
    summary: input.summary,
    recommendation: input.recommendation,
    risks: [...input.risks],
    options: ['approve', 'reject', 'revise'],
    artifact_ref: input.artifact_ref,
  }
}
