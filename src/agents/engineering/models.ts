import type {
  Agent_Message,
  Approval_Request,
  Approval_Response,
} from '../../domain/types.js'

export type EngineeringToolName =
  | 'code_read'
  | 'code_write'
  | 'test_run'
  | 'bash_exec'
  | 'deliverable_package'
  | 'message_send'

export type EngineeringAgentDefinition = {
  agentType: 'engineering'
  description: string
  systemPrompt: string
  tools: EngineeringToolName[]
}

export const ENGINEERING_AGENT_DEFINITION: EngineeringAgentDefinition = {
  agentType: 'engineering',
  description:
    'Owns implementation planning, guarded execution, QA evidence, delivery packaging, and final delivery approval flow.',
  systemPrompt:
    'You are the Engineering Agent for AI Company. Accept only valid discovery handoffs, work inside the active client workspace, keep an auditable trail, package versioned deliverables, and never mark delivery complete before owner approval.',
  tools: [
    'code_read',
    'code_write',
    'test_run',
    'bash_exec',
    'deliverable_package',
    'message_send',
  ],
}

export type ImplementationStageStatus = 'pending' | 'in_progress' | 'completed' | 'blocked'

export type EngineeringImplementationStage = {
  stage_id: string
  title: string
  summary: string
  dependencies: string[]
  outputs: string[]
  risks: string[]
  testing_strategy: string[]
  status: ImplementationStageStatus
}

export type EngineeringProjectState = {
  project_id: string
  client_id: string
  workspace_root: string
  implementation_status: 'not_started' | 'in_progress' | 'blocked' | 'completed'
  qa_status: 'not_started' | 'in_progress' | 'passed' | 'failed'
  delivery_version: number
  owner_review_status: 'not_requested' | 'pending' | 'approved' | 'rejected' | 'revise_requested'
  active_stage: EngineeringTaskState
  last_updated_at: string
}

export type EngineeringTaskState =
  | 'handoff_intake'
  | 'implementation_planning'
  | 'implementation_in_progress'
  | 'awaiting_clarification'
  | 'qa_in_progress'
  | 'awaiting_owner_delivery_approval'
  | 'delivery_revision'
  | 'delivery_completed'

export type DiscoveryHandoffPayload = {
  spec_final: {
    title: string
    summary: string
    capabilities: Array<{
      capability_id: string
      title: string
      description: string
    }>
  }
  acceptance_criteria: string[]
  feature_priorities: string[]
  tool_list: string[]
  project_constraints: string[]
  implementation_risks: string[]
  approval_history: Array<{
    gate: string
    decision: string
    decided_at: string
    decided_by: string
  }>
  external_integrations?: Array<{
    name: string
    purpose: string
    notes?: string
  }>
}

export type DiscoveryHandoffMessage = Agent_Message<DiscoveryHandoffPayload> & {
  from: 'product_agent'
  to: 'engineering_agent'
  message_type: 'discovery_handoff'
}

export type EngineeringStatusPayload = {
  status:
    | 'handoff_received'
    | 'implementation_started'
    | 'qa_started'
    | 'ready_for_owner_review'
    | 'delivered'
    | 'blocked'
  summary: string
  artifact_ref?: string
}

export type EngineeringStatusMessage = Agent_Message<EngineeringStatusPayload>

export type ClarificationRequestPayload = {
  questions: string[]
  blocking_stage: EngineeringTaskState
}

export type EngineeringClarificationRequest = Agent_Message<ClarificationRequestPayload> & {
  from: 'engineering_agent'
  to: 'product_agent'
  message_type: 'clarification_request'
}

export type EngineeringRiskAlertPayload = {
  severity: 'medium' | 'high' | 'critical'
  summary: string
  recommended_action: string
  recovery_artifact_ref?: string
}

export type EngineeringRiskAlert = Agent_Message<EngineeringRiskAlertPayload> & {
  from: 'engineering_agent'
  message_type: 'risk_alert'
}

export type ApprovalRequestContext = {
  implementation_summary: string[]
  qa_summary: string[]
  residual_risks: string[]
  deployment_instructions: string[]
  artifact_ref: string
}

export type ApprovalOutcome =
  | {
      decision: 'approve'
      request: Approval_Request
      response: Approval_Response
      delivered_message: EngineeringStatusMessage
      support_message: EngineeringStatusMessage
      manager_message: EngineeringStatusMessage
      next_state: EngineeringProjectState
    }
  | {
      decision: 'revise' | 'reject'
      request: Approval_Request
      response: Approval_Response
      next_state: EngineeringProjectState
    }
