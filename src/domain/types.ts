/**
 * Cross-Agent Domain Model for AI Company Agents
 *
 * This module defines the shared types, enums, and constants used across all
 * agent implementations in the AI Company system. It is the single source of
 * truth for lifecycle states, approval gates, project namespacing, and
 * inter-agent message contracts.
 *
 * All agent specs (CEO, Sales, Product, Engineering, Marketing, PM, Support)
 * must import from this module to ensure consistency.
 */

// ---------------------------------------------------------------------------
// 1. Lifecycle State (Requirement 2, Task 1.1)
// ---------------------------------------------------------------------------

/**
 * Global lifecycle state for a client engagement or project.
 *
 * State flow (linear with optional support loop):
 *   lead → qualified → proposal → won → discovery → implementation → qa → delivered → support → closed
 *                                                                          ↑                    ↓
 *                                                                          └────────────────────┘
 *
 * See design.md § Lifecycle State Flow for the full stateDiagram.
 */
export type Lifecycle_State =
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

/** Ordered tuple of all valid lifecycle states (useful for ordering/display). */
export const LIFECYCLE_STATES: readonly Lifecycle_State[] = [
  'lead',
  'qualified',
  'proposal',
  'won',
  'discovery',
  'implementation',
  'qa',
  'delivered',
  'support',
  'closed',
] as const

// ---------------------------------------------------------------------------
// 2. Lifecycle Transition Mapping (Requirement 2, Task 1.2)
// ---------------------------------------------------------------------------

/**
 * A business/pipeline event that triggers a lifecycle state transition.
 * Maps to the "Business / Pipeline Event" column in design.md § Data Model.
 */
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

/**
 * Describes a single valid lifecycle transition.
 */
export type LifecycleTransition = {
  /** The event that triggers this transition. */
  event: LifecycleEvent
  /** The state the system must be in for this transition to be valid. */
  from: Lifecycle_State
  /** The state the system moves to after the transition. */
  to: Lifecycle_State
  /** The agent role primarily responsible for triggering this event. */
  primaryOwner: AgentType
}

/**
 * Complete mapping of all valid lifecycle transitions.
 *
 * Derived from design.md § Data Model — Lifecycle Mapping table.
 * Use `isValidTransition()` to validate a proposed state change.
 */
export const LIFECYCLE_TRANSITIONS: readonly LifecycleTransition[] = [
  {
    event: 'lead_created',
    from: 'lead', // initial state — no "from" transition needed; lead is the entry point
    to: 'lead',
    primaryOwner: 'sales_agent',
  },
  {
    event: 'lead_qualified',
    from: 'lead',
    to: 'qualified',
    primaryOwner: 'sales_agent',
  },
  {
    event: 'proposal_sent',
    from: 'qualified',
    to: 'proposal',
    primaryOwner: 'sales_agent',
  },
  {
    event: 'deal_won',
    from: 'proposal',
    to: 'won',
    primaryOwner: 'sales_agent',
  },
  {
    event: 'discovery_started',
    from: 'won',
    to: 'discovery',
    primaryOwner: 'product_agent',
  },
  {
    event: 'build_started',
    from: 'discovery',
    to: 'implementation',
    primaryOwner: 'engineering_agent',
  },
  {
    event: 'final_validation_started',
    from: 'implementation',
    to: 'qa',
    primaryOwner: 'engineering_agent',
  },
  {
    event: 'delivery_approved',
    from: 'qa',
    to: 'delivered',
    primaryOwner: 'engineering_agent',
  },
  {
    event: 'post_delivery_issue',
    from: 'delivered',
    to: 'support',
    primaryOwner: 'support_agent',
  },
  {
    event: 'support_closed',
    from: 'support',
    to: 'closed',
    primaryOwner: 'support_agent',
  },
  // Direct close from delivered (no support needed)
  {
    event: 'support_closed',
    from: 'delivered',
    to: 'closed',
    primaryOwner: 'support_agent',
  },
] as const

/**
 * Returns true when transitioning from `from` to `to` is a valid lifecycle move.
 *
 * @example
 * isValidTransition('lead', 'qualified') // true
 * isValidTransition('lead', 'delivered') // false
 */
export function isValidTransition(
  from: Lifecycle_State,
  to: Lifecycle_State,
): boolean {
  return LIFECYCLE_TRANSITIONS.some(t => t.from === from && t.to === to)
}

/**
 * Returns all valid next states reachable from the given state.
 */
export function getValidNextStates(from: Lifecycle_State): Lifecycle_State[] {
  return LIFECYCLE_TRANSITIONS.filter(t => t.from === from).map(t => t.to)
}

// ---------------------------------------------------------------------------
// 3. Agent Types (shared reference used by multiple models below)
// ---------------------------------------------------------------------------

/**
 * Canonical agent type identifiers used across the system.
 * Matches the agent roles defined in requirements.md § Glossary.
 */
export type AgentType =
  | 'ceo_agent'
  | 'sales_agent'
  | 'marketing_agent'
  | 'product_agent'
  | 'engineering_agent'
  | 'project_manager_agent'
  | 'support_agent'

// ---------------------------------------------------------------------------
// 4. Approval Gate Models (Requirement 8, Task 1.3)
// ---------------------------------------------------------------------------

/**
 * The four mandatory approval gate checkpoints defined in requirements.md § Req 8.
 * Each gate requires Owner sign-off before the workflow can proceed.
 */
export type Approval_Gate =
  | 'proposal_final'       // Sales Agent → Owner: proposal ready to send to client
  | 'spec_final'           // Product Agent → Owner: spec ready for engineering
  | 'delivery_final'       // Engineering Agent → Owner: deliverable ready for client
  | 'strategic_decision'   // CEO Agent → Owner: high-impact cross-project decision

/** Human-readable labels for each approval gate (for dashboard display). */
export const APPROVAL_GATE_LABELS: Record<Approval_Gate, string> = {
  proposal_final: 'Proposal Final Approval',
  spec_final: 'Spec Final Approval',
  delivery_final: 'Delivery Final Approval',
  strategic_decision: 'Strategic Decision Approval',
}

/**
 * The three possible Owner responses to an approval request.
 * Defined in requirements.md § Req 8, AC 3.
 */
export type ApprovalDecision = 'approve' | 'reject' | 'revise'

/**
 * An approval request sent by an agent to the Owner.
 *
 * Sent when an `Approval_Gate` is reached. The requesting agent must include
 * a summary, recommendation, risks, and the artifact reference being approved.
 *
 * See requirements.md § Req 8, AC 2 and design.md § Approval Gate Model.
 */
export type Approval_Request = {
  /** Unique identifier for this approval request. */
  request_id: string
  /** The gate checkpoint this request corresponds to. */
  gate: Approval_Gate
  /** The agent submitting the request. */
  from_agent: AgentType
  /** ISO 8601 timestamp when the request was created. */
  timestamp: string
  /** The project this approval is for (if applicable). */
  project_id?: string
  /** Short summary of what is being approved. */
  summary: string
  /** Agent's recommendation to the Owner. */
  recommendation: string
  /** Key risks the Owner should be aware of. */
  risks: string[]
  /** The decision options available to the Owner. Always approve/reject/revise. */
  options: readonly ApprovalDecision[]
  /** Reference to the artifact being approved (e.g. file path, doc ID, URL). */
  artifact_ref: string
}

/**
 * The Owner's response to an approval request.
 *
 * See requirements.md § Req 8, AC 3–4.
 */
export type Approval_Response = {
  /** The request_id this response corresponds to. */
  request_id: string
  /** The gate this response closes (or iterates on). */
  gate: Approval_Gate
  /** ISO 8601 timestamp when the Owner responded. */
  timestamp: string
  /** The Owner's decision. */
  decision: ApprovalDecision
  /**
   * Optional notes from the Owner.
   * Required when decision is 'revise' to guide the next iteration.
   */
  notes?: string
}

// ---------------------------------------------------------------------------
// 5. Project Namespace and Isolation Rules (Requirement 11, Task 1.4)
// ---------------------------------------------------------------------------

/**
 * The root namespace template for all project artifacts.
 *
 * Pattern: `projects/{client_id}/{project_id}/`
 *
 * See requirements.md § Req 11, AC 1 and design.md § Project Namespace and Isolation.
 */
export const PROJECT_NAMESPACE_TEMPLATE = 'projects/{client_id}/{project_id}/' as const

/**
 * Builds the namespace path for a given client and project.
 *
 * @example
 * buildProjectNamespace('acme-corp', 'proj-001')
 * // → 'projects/acme-corp/proj-001/'
 */
export function buildProjectNamespace(
  clientId: string,
  projectId: string,
): string {
  return `projects/${clientId}/${projectId}/`
}

/**
 * Parses a namespace path back into its components.
 * Returns null if the path does not match the expected pattern.
 *
 * @example
 * parseProjectNamespace('projects/acme-corp/proj-001/')
 * // → { clientId: 'acme-corp', projectId: 'proj-001' }
 */
export function parseProjectNamespace(
  namespacePath: string,
): { clientId: string; projectId: string } | null {
  const match = namespacePath.match(/^projects\/([^/]+)\/([^/]+)\/?$/)
  if (!match) return null
  return { clientId: match[1]!, projectId: match[2]! }
}

/**
 * Isolation rules for project artifact access.
 *
 * These rules are enforced by the Agent_Registry before any message or
 * handoff is forwarded. See requirements.md § Req 11.
 */
export const PROJECT_ISOLATION_RULES = {
  /**
   * An agent may only access artifacts within its currently active project context.
   * Cross-project access without explicit authorization is denied.
   */
  AGENT_SCOPED_TO_ACTIVE_PROJECT: true,

  /**
   * All cross-agent messages must pass Agent_Registry access validation
   * against the project_id before being forwarded.
   */
  REGISTRY_VALIDATES_ACCESS: true,

  /**
   * Client credentials must never be stored directly in specs, proposals,
   * or delivery source code.
   */
  NO_CREDENTIALS_IN_ARTIFACTS: true,

  /**
   * The Company Dashboard may only display aggregated project data.
   * It must not expose raw artifacts from projects the viewer lacks access to.
   */
  DASHBOARD_AGGREGATION_ONLY: true,
} as const

/**
 * Checks whether a given namespace path belongs to the specified project context.
 * Used by the Agent_Registry to enforce isolation rules.
 *
 * @example
 * isWithinProjectContext('projects/acme/proj-001/spec.md', 'acme', 'proj-001') // true
 * isWithinProjectContext('projects/other/proj-999/spec.md', 'acme', 'proj-001') // false
 */
export function isWithinProjectContext(
  artifactPath: string,
  clientId: string,
  projectId: string,
): boolean {
  const expectedPrefix = buildProjectNamespace(clientId, projectId)
  return artifactPath.startsWith(expectedPrefix)
}

// ---------------------------------------------------------------------------
// 6. Agent Registry State (design.md § Agent Registry, referenced by Task 2)
// ---------------------------------------------------------------------------

/**
 * Operational status of an agent.
 * Used by the Company Dashboard to surface operational issues.
 */
export type AgentStatus = 'idle' | 'busy' | 'offline' | 'error' | 'stale'

/**
 * Minimum state record for a single agent in the Agent_Registry.
 * See design.md § Agent Registry and requirements.md § Req 10, AC 2.
 */
export type AgentRegistryEntry = {
  agent_id: string
  agent_type: AgentType
  status: AgentStatus
  current_project_id?: string
  last_activity_timestamp: string // ISO 8601
}

/**
 * Minimum state record for a single project in the Agent_Registry.
 * See design.md § Agent Registry and requirements.md § Req 10, AC 3.
 */
export type ProjectRegistryEntry = {
  project_id: string
  client_id: string
  lifecycle_state: Lifecycle_State
  active_agent_ids: string[]
  current_milestone: string
  updated_at: string // ISO 8601
}

/**
 * Full Agent_Registry state shape.
 * Matches the TypeScript type defined in design.md § Agent Registry.
 */
export type AgentRegistryState = {
  agents: Record<string, AgentRegistryEntry>
  projects: Record<string, ProjectRegistryEntry>
}

// ---------------------------------------------------------------------------
// 7. Agent Message Contract (Requirement 9, referenced by Task 3)
// ---------------------------------------------------------------------------

/**
 * All valid message types for inter-agent communication.
 * See requirements.md § Req 9, AC 2 and design.md § Agent Message Contract.
 */
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

export const MESSAGE_TYPES: readonly MessageType[] = [
  'lead_handoff',
  'discovery_handoff',
  'implementation_handoff',
  'status_update',
  'clarification_request',
  'clarification_response',
  'approval_request',
  'approval_response',
  'ticket_escalation',
  'risk_alert',
] as const

export type HandoffMessageType =
  | 'lead_handoff'
  | 'discovery_handoff'
  | 'implementation_handoff'

export const HANDOFF_MESSAGE_TYPES: readonly HandoffMessageType[] = [
  'lead_handoff',
  'discovery_handoff',
  'implementation_handoff',
] as const

export const HANDOFF_ACKNOWLEDGMENT_SLA_SECONDS = 30 as const

export type LeadHandoffPayload = {
  handoff_id: string
  lead_id: string
  client_name: string
  stakeholder_contacts: string[]
  proposal_artifact_ref: string
  initial_scope: string
  commercial_assumptions: string[]
  initial_risks: string[]
}

export type DiscoveryHandoffPayload = {
  handoff_id: string
  spec_artifact_ref: string
  mvp_scope: string[]
  tool_stack: string[]
  acceptance_criteria: string[]
  technical_constraints: string[]
  implementation_risks: string[]
}

export type ImplementationHandoffPayload = {
  handoff_id: string
  deliverable_artifact_ref: string
  qa_summary: string
  deployment_notes: string[]
  known_risks: string[]
  support_watchouts: string[]
}

export type StatusUpdatePayload = {
  status: string
  summary: string
  milestone?: string
  blocker_ids?: string[]
}

export type ClarificationRequestPayload = {
  request_id: string
  related_handoff_id?: string
  question: string
  artifact_ref?: string
}

export type ClarificationResponsePayload = {
  request_id: string
  related_handoff_id?: string
  response: string
  artifact_ref?: string
}

export type ApprovalRequestMessagePayload = {
  approval: Approval_Request
}

export type ApprovalResponseMessagePayload = {
  response: Approval_Response
}

export type TicketEscalationPayload = {
  ticket_id: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  summary: string
  requested_action: string
}

export type RiskAlertPayload = {
  risk_id: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  summary: string
  mitigation_plan?: string
}

export type AgentMessagePayload =
  | LeadHandoffPayload
  | DiscoveryHandoffPayload
  | ImplementationHandoffPayload
  | StatusUpdatePayload
  | ClarificationRequestPayload
  | ClarificationResponsePayload
  | ApprovalRequestMessagePayload
  | ApprovalResponseMessagePayload
  | TicketEscalationPayload
  | RiskAlertPayload

/**
 * Structured inter-agent message format.
 *
 * All cross-agent communication must use this format. Messages missing any
 * required field are rejected by the Agent_Registry.
 *
 * See requirements.md § Req 9, AC 1 and design.md § Agent Message Contract.
 *
 * @example
 * const msg: Agent_Message = {
 *   from: 'sales_agent',
 *   to: 'product_agent',
 *   message_type: 'lead_handoff',
 *   project_id: 'proj-123',
 *   timestamp: '2026-05-14T09:30:00Z',
 *   payload: { ... },
 * }
 */
export type Agent_Message<P = unknown> = {
  /** The agent sending this message. */
  from: AgentType
  /** The agent receiving this message. */
  to: AgentType
  /** The type of message being sent. */
  message_type: MessageType
  /** The project this message relates to. */
  project_id: string
  /** ISO 8601 timestamp when the message was created. */
  timestamp: string
  /** Message-type-specific payload. Shape varies by message_type. */
  payload: P
}

export const MESSAGE_TYPE_REQUIRED_PAYLOAD_FIELDS: Record<MessageType, readonly string[]> =
  {
    lead_handoff: [
      'handoff_id',
      'lead_id',
      'client_name',
      'stakeholder_contacts',
      'proposal_artifact_ref',
      'initial_scope',
      'commercial_assumptions',
      'initial_risks',
    ],
    discovery_handoff: [
      'handoff_id',
      'spec_artifact_ref',
      'mvp_scope',
      'tool_stack',
      'acceptance_criteria',
      'technical_constraints',
      'implementation_risks',
    ],
    implementation_handoff: [
      'handoff_id',
      'deliverable_artifact_ref',
      'qa_summary',
      'deployment_notes',
      'known_risks',
      'support_watchouts',
    ],
    status_update: ['status', 'summary'],
    clarification_request: ['request_id', 'question'],
    clarification_response: ['request_id', 'response'],
    approval_request: ['approval'],
    approval_response: ['response'],
    ticket_escalation: ['ticket_id', 'severity', 'summary', 'requested_action'],
    risk_alert: ['risk_id', 'severity', 'summary'],
  } as const

export type AgentMessageValidationResult =
  | { valid: true; errors: [] }
  | { valid: false; errors: string[] }

export type LifecycleTransitionValidationResult =
  | { valid: true }
  | { valid: false; reason: string }

/**
 * Validates that an object has all required Agent_Message fields.
 * Returns true if valid, false if any required field is missing.
 *
 * See requirements.md § Req 9, AC 3.
 */
export function isValidAgentMessage(msg: unknown): msg is Agent_Message {
  return validateAgentMessage(msg).valid
}

export function validateAgentMessage(
  msg: unknown,
): AgentMessageValidationResult {
  const errors = getAgentMessageValidationErrors(msg)
  if (errors.length > 0) {
    return { valid: false, errors }
  }

  return { valid: true, errors: [] }
}

export function getAgentMessageValidationErrors(msg: unknown): string[] {
  if (typeof msg !== 'object' || msg === null) {
    return ['message must be an object']
  }

  const m = msg as Record<string, unknown>
  const errors: string[] = []

  if (typeof m['from'] !== 'string') {
    errors.push('from is required')
  }

  if (typeof m['to'] !== 'string') {
    errors.push('to is required')
  }

  if (
    typeof m['message_type'] !== 'string' ||
    !MESSAGE_TYPES.includes(m['message_type'] as MessageType)
  ) {
    errors.push('message_type is invalid')
  }

  if (typeof m['project_id'] !== 'string') {
    errors.push('project_id is required')
  }

  if (typeof m['timestamp'] !== 'string') {
    errors.push('timestamp is required')
  }

  if (!('payload' in m)) {
    errors.push('payload is required')
    return errors
  }

  if (typeof m['payload'] !== 'object' || m['payload'] === null) {
    errors.push('payload must be an object')
    return errors
  }

  if (
    typeof m['message_type'] === 'string' &&
    MESSAGE_TYPES.includes(m['message_type'] as MessageType)
  ) {
    const requiredFields =
      MESSAGE_TYPE_REQUIRED_PAYLOAD_FIELDS[m['message_type'] as MessageType]
    const payload = m['payload'] as Record<string, unknown>
    for (const field of requiredFields) {
      if (!(field in payload)) {
        errors.push(`payload.${field} is required`)
      }
    }
  }

  return errors
}

export function isHandoffMessageType(
  messageType: MessageType,
): messageType is HandoffMessageType {
  return HANDOFF_MESSAGE_TYPES.includes(messageType as HandoffMessageType)
}

export function validateLifecycleTransition(args: {
  from: Lifecycle_State
  to: Lifecycle_State
  event?: LifecycleEvent
  owner?: AgentType
}): LifecycleTransitionValidationResult {
  const transition = LIFECYCLE_TRANSITIONS.find(item => {
    if (item.from !== args.from || item.to !== args.to) {
      return false
    }

    if (args.event && item.event !== args.event) {
      return false
    }

    if (args.owner && item.primaryOwner !== args.owner) {
      return false
    }

    return true
  })

  if (!transition) {
    return {
      valid: false,
      reason:
        `Illegal lifecycle transition ${args.from} -> ${args.to}` +
        (args.event ? ` for event ${args.event}` : '') +
        (args.owner ? ` by ${args.owner}` : ''),
    }
  }

  return { valid: true }
}

export function isHandoffAcknowledgedWithinSla(
  messageTimestamp: string,
  acknowledgedAt: string,
  slaSeconds: number = HANDOFF_ACKNOWLEDGMENT_SLA_SECONDS,
): boolean {
  const startedAt = Date.parse(messageTimestamp)
  const endedAt = Date.parse(acknowledgedAt)

  if (Number.isNaN(startedAt) || Number.isNaN(endedAt)) {
    return false
  }

  return endedAt - startedAt <= slaSeconds * 1000
}
