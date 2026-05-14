/**
 * Agent Registry
 *
 * Central state store for all agents and projects in the AI Company system.
 * Implements the Agent_Registry contract defined in design.md § Agent Registry
 * and requirements.md § Req 10 (Dashboard and State Terpadu) and
 * § Req 11 (Keamanan dan Isolasi Lintas Proyek).
 *
 * Responsibilities:
 * - Agent state management (Task 2.1)
 * - Project state management (Task 2.2)
 * - Access validation for agent ↔ project (Task 2.3)
 * - Append-only state history for dashboard (Task 2.4)
 */

import type {
  AgentRegistryEntry,
  AgentRegistryState,
  AgentStatus,
  AgentType,
  Approval_Response,
  Agent_Message,
  AgentMessagePayload,
  HandoffMessageType,
  Lifecycle_State,
  LifecycleEvent,
  ProjectRegistryEntry,
} from '../domain/types.js'
import {
  isHandoffAcknowledgedWithinSla,
  isHandoffMessageType,
  validateAgentMessage,
  validateLifecycleTransition,
} from '../domain/types.js'

// ---------------------------------------------------------------------------
// History record types (Task 2.4)
// ---------------------------------------------------------------------------

/**
 * A timestamped snapshot of an agent's state at a point in time.
 * Appended whenever the agent's state changes; never deleted.
 */
export type AgentStateSnapshot = AgentRegistryEntry & {
  /** ISO 8601 timestamp when this snapshot was recorded. */
  recorded_at: string
}

/**
 * A timestamped snapshot of a project's state at a point in time.
 * Appended whenever the project's state changes; never deleted.
 */
export type ProjectStateSnapshot = ProjectRegistryEntry & {
  /** ISO 8601 timestamp when this snapshot was recorded. */
  recorded_at: string
}

// ---------------------------------------------------------------------------
// Access validation result types (Task 2.3)
// ---------------------------------------------------------------------------

/**
 * Result of an access validation check.
 * On failure, `reason` explains why access was denied.
 */
export type AccessValidationResult =
  | { allowed: true }
  | { allowed: false; reason: string }

// ---------------------------------------------------------------------------
// Audit log entry (Task 2.3 — log denied access)
// ---------------------------------------------------------------------------

export type AuditLogEntry = {
  /** ISO 8601 timestamp of the event. */
  timestamp: string
  /** Type of audit event. */
  event:
    | 'access_denied'
    | 'agent_registered'
    | 'project_registered'
    | 'state_updated'
    | 'message_routed'
    | 'message_rejected'
    | 'handoff_acknowledged'
    | 'approval_recorded'
    | 'lifecycle_transition'
    | 'lifecycle_transition_rejected'
  /** Agent involved in the event. */
  agent_id?: string
  /** Project involved in the event. */
  project_id?: string
  /** Human-readable description of what happened. */
  detail: string
}

export type CommunicationLogEntry = {
  log_id: string
  recorded_at: string
  message: Agent_Message<AgentMessagePayload>
  status: 'routed' | 'rejected'
  rejection_reason?: string
  requires_acknowledgment: boolean
  acknowledged_at?: string
  acknowledged_within_sla?: boolean
}

// ---------------------------------------------------------------------------
// AgentRegistry class
// ---------------------------------------------------------------------------

/**
 * AgentRegistry manages the live state of all agents and projects, enforces
 * cross-project access isolation, and maintains an append-only history of
 * every state change so the Company Dashboard can display historical data
 * without losing old records.
 *
 * @example
 * const registry = new AgentRegistry()
 * registry.registerAgent({ agent_id: 'sales-1', agent_type: 'sales_agent', status: 'idle', last_activity_timestamp: new Date().toISOString() })
 * registry.registerProject({ project_id: 'proj-001', client_id: 'acme', lifecycle_state: 'lead', active_agent_ids: [], current_milestone: 'lead_created', updated_at: new Date().toISOString() })
 */
export class AgentRegistry {
  // Current live state
  private readonly _agents: Map<string, AgentRegistryEntry> = new Map()
  private readonly _projects: Map<string, ProjectRegistryEntry> = new Map()

  // Append-only history (Task 2.4)
  private readonly _agentHistory: Map<string, AgentStateSnapshot[]> = new Map()
  private readonly _projectHistory: Map<string, ProjectStateSnapshot[]> = new Map()

  // Audit log (Task 2.3)
  private readonly _auditLog: AuditLogEntry[] = []
  private readonly _communicationLog: CommunicationLogEntry[] = []

  // ---------------------------------------------------------------------------
  // 2.1 Agent state management
  // ---------------------------------------------------------------------------

  /**
   * Register a new agent or fully replace an existing agent's state.
   * Appends a snapshot to the agent's history.
   *
   * @param entry - The agent state to register. `last_activity_timestamp` must
   *   be a valid ISO 8601 string.
   */
  registerAgent(entry: AgentRegistryEntry): void {
    this._agents.set(entry.agent_id, { ...entry })
    this._appendAgentSnapshot(entry)
    this._audit({
      event: 'agent_registered',
      agent_id: entry.agent_id,
      detail: `Agent ${entry.agent_id} (${entry.agent_type}) registered with status "${entry.status}"`,
    })
  }

  /**
   * Update specific fields of an existing agent's state.
   * If the agent does not exist, throws an error.
   * Appends a snapshot to the agent's history.
   *
   * @param agentId - The agent to update.
   * @param updates - Partial fields to merge into the current state.
   */
  updateAgent(agentId: string, updates: Partial<Omit<AgentRegistryEntry, 'agent_id'>>): void {
    const existing = this._agents.get(agentId)
    if (!existing) {
      throw new Error(`Agent not found: ${agentId}`)
    }
    const updated: AgentRegistryEntry = {
      ...existing,
      ...updates,
      agent_id: agentId, // agent_id is immutable
    }
    this._agents.set(agentId, updated)
    this._appendAgentSnapshot(updated)
    this._audit({
      event: 'state_updated',
      agent_id: agentId,
      detail: `Agent ${agentId} state updated: ${JSON.stringify(updates)}`,
    })
  }

  /**
   * Retrieve the current state of an agent by ID.
   * Returns `undefined` if the agent is not registered.
   */
  getAgent(agentId: string): AgentRegistryEntry | undefined {
    const entry = this._agents.get(agentId)
    return entry ? { ...entry } : undefined
  }

  /**
   * List all currently registered agents.
   * Returns a shallow copy of each entry to prevent external mutation.
   */
  listAgents(): AgentRegistryEntry[] {
    return Array.from(this._agents.values()).map(e => ({ ...e }))
  }

  // ---------------------------------------------------------------------------
  // 2.2 Project state management
  // ---------------------------------------------------------------------------

  /**
   * Register a new project or fully replace an existing project's state.
   * Appends a snapshot to the project's history.
   *
   * @param entry - The project state to register. `updated_at` must be a valid
   *   ISO 8601 string.
   */
  registerProject(entry: ProjectRegistryEntry): void {
    this._projects.set(entry.project_id, { ...entry, active_agent_ids: [...entry.active_agent_ids] })
    this._appendProjectSnapshot(entry)
    this._audit({
      event: 'project_registered',
      project_id: entry.project_id,
      detail: `Project ${entry.project_id} (client: ${entry.client_id}) registered at state "${entry.lifecycle_state}"`,
    })
  }

  /**
   * Update specific fields of an existing project's state.
   * If the project does not exist, throws an error.
   * Appends a snapshot to the project's history.
   *
   * @param projectId - The project to update.
   * @param updates - Partial fields to merge into the current state.
   */
  updateProject(
    projectId: string,
    updates: Partial<Omit<ProjectRegistryEntry, 'project_id'>>,
  ): void {
    const existing = this._projects.get(projectId)
    if (!existing) {
      throw new Error(`Project not found: ${projectId}`)
    }
    const updated: ProjectRegistryEntry = {
      ...existing,
      ...updates,
      project_id: projectId, // project_id is immutable
      // Ensure active_agent_ids is always a fresh array copy
      active_agent_ids: updates.active_agent_ids
        ? [...updates.active_agent_ids]
        : [...existing.active_agent_ids],
    }
    this._projects.set(projectId, updated)
    this._appendProjectSnapshot(updated)
    this._audit({
      event: 'state_updated',
      project_id: projectId,
      detail: `Project ${projectId} state updated: ${JSON.stringify(updates)}`,
    })
  }

  /**
   * Retrieve the current state of a project by ID.
   * Returns `undefined` if the project is not registered.
   */
  getProject(projectId: string): ProjectRegistryEntry | undefined {
    const entry = this._projects.get(projectId)
    if (!entry) return undefined
    return { ...entry, active_agent_ids: [...entry.active_agent_ids] }
  }

  /**
   * List all currently registered projects.
   * Returns a shallow copy of each entry to prevent external mutation.
   */
  listProjects(): ProjectRegistryEntry[] {
    return Array.from(this._projects.values()).map(e => ({
      ...e,
      active_agent_ids: [...e.active_agent_ids],
    }))
  }

  // ---------------------------------------------------------------------------
  // 2.3 Access validation
  // ---------------------------------------------------------------------------

  /**
   * Validate whether an agent is authorised to access a given project.
   *
   * An agent is authorised if and only if its `current_project_id` matches
   * the requested `projectId`. This enforces the isolation rule from
   * requirements.md § Req 11, AC 2–3 and design.md § Project Namespace and
   * Isolation.
   *
   * @param agentId - The agent requesting access.
   * @param projectId - The project the agent wants to access.
   * @returns `{ allowed: true }` on success, or `{ allowed: false, reason }` on failure.
   */
  validateAgentProjectAccess(
    agentId: string,
    projectId: string,
  ): AccessValidationResult {
    const agent = this._agents.get(agentId)

    if (!agent) {
      const reason = `Agent not found: ${agentId}`
      this._auditDenied(agentId, projectId, reason)
      return { allowed: false, reason }
    }

    if (agent.current_project_id !== projectId) {
      const reason =
        `Agent ${agentId} is not authorised for project ${projectId}. ` +
        `Current project: ${agent.current_project_id ?? '(none)'}`
      this._auditDenied(agentId, projectId, reason)
      return { allowed: false, reason }
    }

    return { allowed: true }
  }

  /**
   * Validate that both the sender and receiver of a message are authorised to
   * access the message's `project_id`.
   *
   * Both agents must be registered and have `current_project_id` matching the
   * message's `project_id`. If either check fails, the message is rejected and
   * the denial is logged to the audit trail.
   *
   * See requirements.md § Req 9, AC 4 and § Req 11, AC 5.
   *
   * @param message - The inter-agent message to validate.
   * @returns `{ allowed: true }` if both agents pass, or `{ allowed: false, reason }`.
   */
  validateMessageAccess(message: Agent_Message): AccessValidationResult {
    // Resolve agent IDs from AgentType values.
    // The registry stores entries by agent_id (e.g. "sales-1"), but messages
    // carry agent_type (e.g. "sales_agent"). We look up by type to find the
    // matching registered agent.
    const senderEntry = this._findAgentByType(message.from)
    const receiverEntry = this._findAgentByType(message.to)

    if (!senderEntry) {
      const reason = `Sender agent type not registered: ${message.from}`
      this._auditDenied(message.from, message.project_id, reason)
      return { allowed: false, reason }
    }

    if (!receiverEntry) {
      const reason = `Receiver agent type not registered: ${message.to}`
      this._auditDenied(message.to, message.project_id, reason)
      return { allowed: false, reason }
    }

    const senderResult = this.validateAgentProjectAccess(
      senderEntry.agent_id,
      message.project_id,
    )
    if (!senderResult.allowed) {
      return senderResult
    }

    const receiverResult = this.validateAgentProjectAccess(
      receiverEntry.agent_id,
      message.project_id,
    )
    if (!receiverResult.allowed) {
      return receiverResult
    }

    return { allowed: true }
  }

  routeMessage(
    message: unknown,
  ):
    | { allowed: true; entry: CommunicationLogEntry }
    | { allowed: false; reason: string } {
    const validation = validateAgentMessage(message)
    if (!validation.valid) {
      const reason = validation.errors.join('; ')
      this._audit({
        event: 'message_rejected',
        detail: reason,
      })
      return { allowed: false, reason }
    }

    const typedMessage = cloneMessage(
      message as Agent_Message<AgentMessagePayload>,
    )
    const access = this.validateMessageAccess(typedMessage)
    if (!access.allowed) {
      const entry = this._recordCommunication(typedMessage, 'rejected', access.reason)
      this._audit({
        event: 'message_rejected',
        project_id: typedMessage.project_id,
        detail: access.reason,
      })
      return { allowed: false, reason: entry.rejection_reason ?? access.reason }
    }

    const entry = this._recordCommunication(typedMessage, 'routed')
    this._audit({
      event: 'message_routed',
      project_id: typedMessage.project_id,
      detail: `${typedMessage.message_type} routed from ${typedMessage.from} to ${typedMessage.to}`,
    })

    return { allowed: true, entry }
  }

  acknowledgeHandoff(
    handoffId: string,
    acknowledgedAt: string = new Date().toISOString(),
  ): AccessValidationResult {
    const target = [...this._communicationLog]
      .reverse()
      .find(entry => this._matchesHandoff(entry, handoffId))

    if (!target) {
      return { allowed: false, reason: `Handoff not found: ${handoffId}` }
    }

    target.acknowledged_at = acknowledgedAt
    target.acknowledged_within_sla = isHandoffAcknowledgedWithinSla(
      target.message.timestamp,
      acknowledgedAt,
    )
    this._audit({
      event: 'handoff_acknowledged',
      project_id: target.message.project_id,
      detail:
        `Handoff ${handoffId} acknowledged by ${target.message.to}` +
        ` within SLA: ${target.acknowledged_within_sla ? 'yes' : 'no'}`,
    })

    return { allowed: true }
  }

  transitionProjectLifecycle(args: {
    project_id: string
    to: Lifecycle_State
    event: LifecycleEvent
    actor: AgentType
    updated_at?: string
    milestone?: string
  }): AccessValidationResult {
    const project = this._projects.get(args.project_id)
    if (!project) {
      return { allowed: false, reason: `Project not found: ${args.project_id}` }
    }

    const validation = validateLifecycleTransition({
      from: project.lifecycle_state,
      to: args.to,
      event: args.event,
      owner: args.actor,
    })

    if (!validation.valid) {
      this._audit({
        event: 'lifecycle_transition_rejected',
        project_id: args.project_id,
        detail: validation.reason,
      })
      return { allowed: false, reason: validation.reason }
    }

    this.updateProject(args.project_id, {
      lifecycle_state: args.to,
      current_milestone: args.milestone ?? args.event,
      updated_at: args.updated_at ?? new Date().toISOString(),
    })
    this._audit({
      event: 'lifecycle_transition',
      project_id: args.project_id,
      detail: `${project.lifecycle_state} -> ${args.to} via ${args.event} by ${args.actor}`,
    })
    return { allowed: true }
  }

  recordApprovalResponse(response: Approval_Response): void {
    this._audit({
      event: 'approval_recorded',
      project_id: undefined,
      detail: `Approval ${response.request_id} recorded with decision ${response.decision}`,
    })
  }

  // ---------------------------------------------------------------------------
  // 2.4 State history
  // ---------------------------------------------------------------------------

  /**
   * Return the full append-only history of state snapshots for an agent.
   * Snapshots are ordered oldest-first (insertion order).
   * Returns an empty array if the agent has never been registered.
   *
   * See requirements.md § Req 10, AC 4.
   */
  getAgentHistory(agentId: string): AgentStateSnapshot[] {
    return (this._agentHistory.get(agentId) ?? []).map(snapshot => ({
      ...snapshot,
    }))
  }

  /**
   * Return the full append-only history of state snapshots for a project.
   * Snapshots are ordered oldest-first (insertion order).
   * Returns an empty array if the project has never been registered.
   *
   * See requirements.md § Req 10, AC 4.
   */
  getProjectHistory(projectId: string): ProjectStateSnapshot[] {
    return (this._projectHistory.get(projectId) ?? []).map(snapshot => ({
      ...snapshot,
      active_agent_ids: [...snapshot.active_agent_ids],
    }))
  }

  // ---------------------------------------------------------------------------
  // Audit log access
  // ---------------------------------------------------------------------------

  /**
   * Return a copy of the full audit log.
   * Entries are ordered oldest-first.
   */
  getAuditLog(): AuditLogEntry[] {
    return [...this._auditLog]
  }

  getCommunicationLog(): CommunicationLogEntry[] {
    return this._communicationLog.map(entry => ({
      ...entry,
      message: cloneMessage(entry.message),
    }))
  }

  // ---------------------------------------------------------------------------
  // Snapshot of full registry state (for dashboard reads)
  // ---------------------------------------------------------------------------

  /**
   * Return a point-in-time snapshot of the full registry state.
   * Matches the `AgentRegistryState` shape from design.md § Agent Registry.
   */
  getState(): AgentRegistryState {
    const agents: AgentRegistryState['agents'] = {}
    for (const [id, entry] of this._agents) {
      agents[id] = { ...entry }
    }
    const projects: AgentRegistryState['projects'] = {}
    for (const [id, entry] of this._projects) {
      projects[id] = { ...entry, active_agent_ids: [...entry.active_agent_ids] }
    }
    return { agents, projects }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private _appendAgentSnapshot(entry: AgentRegistryEntry): void {
    const snapshot: AgentStateSnapshot = {
      ...entry,
      recorded_at: new Date().toISOString(),
    }
    const history = this._agentHistory.get(entry.agent_id) ?? []
    history.push(snapshot)
    this._agentHistory.set(entry.agent_id, history)
  }

  private _appendProjectSnapshot(entry: ProjectRegistryEntry): void {
    const snapshot: ProjectStateSnapshot = {
      ...entry,
      active_agent_ids: [...entry.active_agent_ids],
      recorded_at: new Date().toISOString(),
    }
    const history = this._projectHistory.get(entry.project_id) ?? []
    history.push(snapshot)
    this._projectHistory.set(entry.project_id, history)
  }

  private _audit(entry: Omit<AuditLogEntry, 'timestamp'>): void {
    this._auditLog.push({
      timestamp: new Date().toISOString(),
      ...entry,
    })
  }

  private _auditDenied(agentIdOrType: string, projectId: string, reason: string): void {
    this._audit({
      event: 'access_denied',
      agent_id: agentIdOrType,
      project_id: projectId,
      detail: reason,
    })
  }

  /**
   * Find the first registered agent whose `agent_type` matches the given type.
   * Used by `validateMessageAccess` to resolve AgentType → AgentRegistryEntry.
   */
  private _findAgentByType(agentType: AgentType): AgentRegistryEntry | undefined {
    for (const entry of this._agents.values()) {
      if (entry.agent_type === agentType) return entry
    }
    return undefined
  }

  private _recordCommunication(
    message: Agent_Message<AgentMessagePayload>,
    status: CommunicationLogEntry['status'],
    rejectionReason?: string,
  ): CommunicationLogEntry {
    const recordedAt = new Date().toISOString()
    const entry: CommunicationLogEntry = {
      log_id: `comm-${this._communicationLog.length + 1}`,
      recorded_at: recordedAt,
      message: cloneMessage(message),
      status,
      rejection_reason: rejectionReason,
      requires_acknowledgment: isHandoffMessageType(message.message_type),
    }
    this._communicationLog.push(entry)
    return entry
  }

  private _matchesHandoff(
    entry: CommunicationLogEntry,
    handoffId: string,
  ): entry is CommunicationLogEntry & {
    message: Agent_Message<{ handoff_id: string }>
  } {
    if (!isHandoffMessageType(entry.message.message_type)) {
      return false
    }

    const payload = entry.message.payload as Record<string, unknown>
    return payload['handoff_id'] === handoffId
  }
}

function cloneMessage<P>(message: Agent_Message<P>): Agent_Message<P> {
  return {
    ...message,
    payload: structuredClone(message.payload),
  }
}
