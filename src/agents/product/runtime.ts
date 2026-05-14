import type {
  Agent_Message,
  Approval_Response,
  ProjectRegistryEntry,
} from '../../domain/types.js'
import type { AgentRegistry } from '../../registry/AgentRegistry.js'
import {
  buildTool,
  checkPermissions,
  createApprovalRequest,
  createProductProjectState,
  PRODUCT_AGENT_DEFINITION,
  type ClarificationEntry,
  type DiscoveryCapability,
  type LeadHandoffMessage,
  type LeadHandoffPayload,
  type ProductArtifacts,
  type ProductProjectState,
  type ProductRisk,
  type ProductSpecVersion,
  type ProductTask,
  type ProductTaskName,
  type ProductTool,
} from './models.js'

const HANDOFF_REQUIRED_FIELDS = [
  'business_summary',
  'stakeholders',
  'last_proposal_ref',
  'initial_scope',
  'commercial_assumptions',
  'initial_risks',
] as const

function cloneTask(task: ProductTask): ProductTask {
  return { ...task }
}

function cloneState(state: ProductProjectState): ProductProjectState {
  return {
    ...state,
    tasks: state.tasks.map(cloneTask),
    capability_map: state.capability_map.map(item => ({ ...item })),
    clarification_log: state.clarification_log.map(entry => ({ ...entry })),
    assumptions: [...state.assumptions],
    conflicts: [...state.conflicts],
    risks: state.risks.map(risk => ({ ...risk })),
    artifacts: { ...state.artifacts },
    latest_spec: state.latest_spec ? { ...state.latest_spec } : undefined,
    spec_history: state.spec_history.map(spec => ({ ...spec })),
    approval_history: state.approval_history.map(item => ({
      version: item.version,
      response: { ...item.response },
    })),
    audit_log: [...state.audit_log],
  }
}

function updateTask(
  tasks: ProductTask[],
  taskName: ProductTaskName,
  status: ProductTask['status'],
  updatedAt: string,
  detail: string,
): ProductTask[] {
  const next = tasks.filter(task => task.task_name !== taskName).map(cloneTask)
  next.push({
    task_name: taskName,
    status,
    updated_at: updatedAt,
    detail,
  })
  return next
}

function stringifyJson(value: unknown): string {
  return JSON.stringify(value, null, 2)
}

function buildRiskRegister(risks: ProductRisk[]): string {
  const lines = ['# Risk Register', '']
  for (const risk of risks) {
    lines.push(`- [${risk.priority}] ${risk.summary} (${risk.id})`)
    lines.push(`  Mitigation: ${risk.mitigation}`)
  }
  return lines.join('\n')
}

function buildAssumptionsDocument(assumptions: string[], conflicts: string[]): string {
  const lines = ['# Assumptions', '']
  lines.push(...(assumptions.length > 0 ? assumptions.map(item => `- ${item}`) : ['- No explicit assumptions recorded yet.']))
  lines.push('', '# Conflicts', '')
  lines.push(...(conflicts.length > 0 ? conflicts.map(item => `- ${item}`) : ['- No conflicts recorded.']))
  return lines.join('\n')
}

function buildDiscoveryNotesMarkdown(input: {
  payload: LeadHandoffPayload
  questions: string[]
  capabilityMap: DiscoveryCapability[]
  assumptions: string[]
}): string {
  const lines = [
    '# Discovery Notes',
    '',
    `## Business Summary`,
    input.payload.business_summary ?? 'TBD',
    '',
    '## Stakeholders',
    ...(input.payload.stakeholders?.map(item => `- ${item}`) ?? ['- TBD']),
    '',
    '## Scope',
    ...(input.payload.initial_scope?.map(item => `- ${item}`) ?? ['- TBD']),
    '',
    '## Clarification Questions',
    ...(input.questions.map(item => `- ${item}`)),
    '',
    '## Capability Map',
    ...(input.capabilityMap.map(item => `- ${item.capability}: ${item.rationale}`)),
    '',
    '## Assumptions',
    ...(input.assumptions.map(item => `- ${item}`)),
  ]
  return lines.join('\n')
}

function summarizeSpec(state: ProductProjectState): string {
  return `Product discovery spec v${state.spec_version} for project ${state.project_id}`
}

export class ProductRuntime {
  private readonly projects = new Map<string, ProductProjectState>()

  constructor(private readonly registry?: AgentRegistry) {}

  readonly definition = PRODUCT_AGENT_DEFINITION

  getProjectState(projectId: string): ProductProjectState | undefined {
    const state = this.projects.get(projectId)
    return state ? cloneState(state) : undefined
  }

  upsertProject(input: {
    project_id: string
    client_id: string
    timestamp: string
  }): ProductProjectState {
    const existing = this.projects.get(input.project_id)
    if (existing) {
      return this.persist({
        ...existing,
        client_id: input.client_id,
        last_updated_at: input.timestamp,
      })
    }

    const state = createProductProjectState(input)
    this.syncRegistry(state)
    return this.persist(state)
  }

  validateLeadHandoff(message: unknown): {
    isValid: boolean
    missingFields: string[]
    payload: LeadHandoffPayload
  } {
    if (typeof message !== 'object' || message === null) {
      return {
        isValid: false,
        missingFields: ['from', 'to', 'message_type', 'project_id', 'timestamp', 'payload'],
        payload: {},
      }
    }

    const raw = message as Record<string, unknown>
    const topLevelMissing: string[] = []
    if (typeof raw['from'] !== 'string') topLevelMissing.push('from')
    if (typeof raw['to'] !== 'string') topLevelMissing.push('to')
    if (typeof raw['message_type'] !== 'string') topLevelMissing.push('message_type')
    if (typeof raw['project_id'] !== 'string') topLevelMissing.push('project_id')
    if (typeof raw['timestamp'] !== 'string') topLevelMissing.push('timestamp')
    if (typeof raw['payload'] !== 'object' || raw['payload'] === null) topLevelMissing.push('payload')

    if (topLevelMissing.length > 0) {
      return {
        isValid: false,
        missingFields: topLevelMissing,
        payload: {},
      }
    }

    const typed = raw as LeadHandoffMessage
    const missingFields: string[] = []
    if (typed.from !== 'sales_agent') missingFields.push('from')
    if (typed.to !== 'product_agent') missingFields.push('to')
    if (typed.message_type !== 'lead_handoff') missingFields.push('message_type')

    for (const field of HANDOFF_REQUIRED_FIELDS) {
      const value = typed.payload?.[field]
      if (value === undefined) {
        missingFields.push(field)
        continue
      }
      if (Array.isArray(value) && value.length === 0) {
        missingFields.push(field)
      }
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
      payload: typed.payload ?? {},
    }
  }

  receiveLeadHandoff(
    clientId: string,
    message: unknown,
  ): {
    accepted: boolean
    state: ProductProjectState
    outgoing: Agent_Message[]
  } {
    const validation = this.validateLeadHandoff(message)
    const typed = message as LeadHandoffMessage
    const baseState = this.upsertProject({
      project_id: typed.project_id,
      client_id: clientId,
      timestamp: typed.timestamp,
    })

    const questions = this.generateClarificationQuestions(validation.payload)
    const risks = this.buildRisks(validation.payload, validation.missingFields)
    const assumptions = this.extractAssumptions(validation.payload)
    const conflicts = this.detectConflicts(validation.payload)
    const capabilityMap = this.buildCapabilityMap(validation.payload)
    const artifacts = this.buildArtifacts(baseState, validation.payload, questions, assumptions, conflicts, risks, capabilityMap)

    let nextState: ProductProjectState = {
      ...baseState,
      clarification_log: questions.map<ClarificationEntry>(question => ({
        question,
        asked_at: typed.timestamp,
        source: 'sales_agent',
      })),
      capability_map: capabilityMap,
      assumptions,
      conflicts,
      risks,
      artifacts: {
        ...baseState.artifacts,
        [artifacts.clarification_log_ref]: artifacts.clarification_log_json,
        [artifacts.discovery_notes_ref]: artifacts.discovery_notes_md,
        [artifacts.assumptions_ref]: artifacts.assumptions_md,
        [artifacts.risk_register_ref]: artifacts.risk_register_md,
      },
      audit_log: [
        ...baseState.audit_log,
        `lead_handoff_received:${typed.timestamp}`,
      ],
      last_updated_at: typed.timestamp,
    }

    if (validation.isValid) {
      nextState = {
        ...nextState,
        lifecycle_state: 'discovery',
        discovery_status: 'discovery_in_progress',
        handoff_status: 'not_sent',
        tasks: updateTask(
          updateTask(nextState.tasks, 'handoff_validation', 'completed', typed.timestamp, 'Lead handoff validated'),
          'discovery_in_progress',
          'in_progress',
          typed.timestamp,
          'Discovery started',
        ),
      }
      this.syncRegistry(nextState)

      const outgoing: Agent_Message[] = [
        {
          from: 'product_agent',
          to: 'project_manager_agent',
          message_type: 'status_update',
          project_id: typed.project_id,
          timestamp: typed.timestamp,
          payload: {
            status: 'discovery_started',
            milestone: 'lead_handoff received',
            namespace: nextState.namespace,
          },
        },
      ]
      return { accepted: true, state: this.persist(nextState), outgoing }
    }

    nextState = {
      ...nextState,
      discovery_status: 'awaiting_clarification',
      handoff_status: 'validation_failed',
      tasks: updateTask(
        updateTask(nextState.tasks, 'handoff_validation', 'blocked', typed.timestamp, `Missing fields: ${validation.missingFields.join(', ')}`),
        'awaiting_clarification',
        'in_progress',
        typed.timestamp,
        'Waiting for sales clarification',
      ),
    }
    this.syncRegistry(nextState)

    const outgoing: Agent_Message[] = [
      {
        from: 'product_agent',
        to: 'sales_agent',
        message_type: 'clarification_request',
        project_id: typed.project_id,
        timestamp: typed.timestamp,
        payload: {
          missing_fields: validation.missingFields,
          questions,
        },
      },
      {
        from: 'product_agent',
        to: 'project_manager_agent',
        message_type: 'status_update',
        project_id: typed.project_id,
        timestamp: typed.timestamp,
        payload: {
          status: 'awaiting_clarification',
          blocker: validation.missingFields,
        },
      },
    ]

    return { accepted: false, state: this.persist(nextState), outgoing }
  }

  generateClarificationQuestions(payload: LeadHandoffPayload): string[] {
    const questions = [
      'Apa tujuan bisnis utama dan metrik keberhasilan proyek ini?',
      'Siapa persona utama yang akan memakai solusi ini?',
      'Integrasi apa saja yang wajib tersedia pada MVP?',
      'Batasan operasional atau compliance apa yang harus dipatuhi?',
      'Kriteria acceptance apa yang membuat proyek dianggap berhasil?',
    ]

    if (!payload.initial_scope?.length) {
      questions.push('Scope awal mana yang harus menjadi prioritas fase pertama?')
    }
    if (!payload.commercial_assumptions?.length) {
      questions.push('Asumsi komersial mana yang paling berpengaruh ke ruang lingkup delivery?')
    }
    return questions
  }

  writeSpec(input: {
    project_id: string
    timestamp: string
    summary?: string
  }): ProductSpecVersion {
    const state = this.requireProject(input.project_id)
    const version = state.spec_version + 1
    const artifactRef = `${state.namespace}spec-v${version}.md`
    const content = this.composeSpecContent(state, version, input.summary)

    const specVersion: ProductSpecVersion = {
      version,
      artifact_ref: artifactRef,
      content,
      created_at: input.timestamp,
      source: version === 1 ? 'draft' : 'revision',
    }

    const nextState: ProductProjectState = {
      ...state,
      spec_version: version,
      discovery_status: 'spec_drafting',
      latest_spec: specVersion,
      spec_history: [...state.spec_history, specVersion],
      artifacts: {
        ...state.artifacts,
        [artifactRef]: content,
      },
      tasks: updateTask(
        state.tasks,
        'spec_drafting',
        'completed',
        input.timestamp,
        `Spec v${version} drafted`,
      ),
      audit_log: [...state.audit_log, `spec_written:v${version}:${input.timestamp}`],
      last_updated_at: input.timestamp,
    }

    this.persist(nextState)
    return specVersion
  }

  requestApproval(input: {
    project_id: string
    request_id: string
    timestamp: string
    recommendation: string
  }): {
    approval: ReturnType<typeof createApprovalRequest>
    outgoing: Agent_Message[]
  } {
    const state = this.requireProject(input.project_id)
    if (!state.latest_spec) {
      throw new Error(`Cannot request approval without spec for project ${input.project_id}`)
    }

    const approval = createApprovalRequest({
      request_id: input.request_id,
      timestamp: input.timestamp,
      project_id: input.project_id,
      artifact_ref: state.latest_spec.artifact_ref,
      summary: summarizeSpec(state),
      recommendation: input.recommendation,
      risks: state.risks.map(risk => `${risk.priority}: ${risk.summary}`),
    })

    const nextState: ProductProjectState = {
      ...state,
      discovery_status: 'awaiting_owner_approval',
      tasks: updateTask(
        state.tasks,
        'awaiting_owner_approval',
        'in_progress',
        input.timestamp,
        `Awaiting owner response for spec v${state.spec_version}`,
      ),
      audit_log: [...state.audit_log, `approval_requested:v${state.spec_version}:${input.timestamp}`],
      last_updated_at: input.timestamp,
    }
    this.persist(nextState)

    return {
      approval,
      outgoing: [
        {
          from: 'product_agent',
          to: 'project_manager_agent',
          message_type: 'status_update',
          project_id: input.project_id,
          timestamp: input.timestamp,
          payload: {
            status: 'approval_pending',
            gate: 'spec_final',
            version: state.spec_version,
          },
        },
      ],
    }
  }

  recordApprovalResponse(input: {
    project_id: string
    response: Approval_Response
  }): ProductProjectState {
    const state = this.requireProject(input.project_id)
    const nextHistory = [...state.approval_history, { version: state.spec_version, response: { ...input.response } }]

    let nextState: ProductProjectState = {
      ...state,
      approval_history: nextHistory,
      audit_log: [...state.audit_log, `approval_response:${input.response.decision}:${input.response.timestamp}`],
      last_updated_at: input.response.timestamp,
    }

    if (input.response.decision === 'approve') {
      nextState = {
        ...nextState,
        discovery_status: 'approved',
        tasks: updateTask(
          state.tasks,
          'awaiting_owner_approval',
          'completed',
          input.response.timestamp,
          'Owner approved final spec',
        ),
      }
      return this.persist(nextState)
    }

    if (input.response.decision === 'revise') {
      const revision = this.writeSpec({
        project_id: input.project_id,
        timestamp: input.response.timestamp,
        summary: `Revision requested: ${input.response.notes ?? 'No notes provided.'}`,
      })
      const revisedState = this.requireProject(input.project_id)
      return this.persist({
        ...revisedState,
        approval_history: nextHistory,
        discovery_status: 'spec_drafting',
        audit_log: [...revisedState.audit_log, `revision_created:v${revision.version}:${input.response.timestamp}`],
        last_updated_at: input.response.timestamp,
      })
    }

    return this.persist({
      ...nextState,
      discovery_status: 'spec_drafting',
      tasks: updateTask(
        state.tasks,
        'awaiting_owner_approval',
        'blocked',
        input.response.timestamp,
        'Owner rejected current spec',
      ),
    })
  }

  createDiscoveryHandoff(input: {
    project_id: string
    timestamp: string
  }): {
    outgoing: Agent_Message[]
    handoff: Agent_Message
  } {
    const state = this.requireProject(input.project_id)
    const lastApproval = state.approval_history.at(-1)?.response
    if (!state.latest_spec || lastApproval?.decision !== 'approve') {
      throw new Error(`Cannot handoff project ${input.project_id} before owner approval`)
    }

    const handoff: Agent_Message = {
      from: 'product_agent',
      to: 'engineering_agent',
      message_type: 'discovery_handoff',
      project_id: input.project_id,
      timestamp: input.timestamp,
      payload: {
        spec_ref: state.latest_spec.artifact_ref,
        spec_content: state.latest_spec.content,
        discovery_notes_ref: `${state.namespace}discovery-notes.md`,
        acceptance_criteria: this.extractAcceptanceCriteria(state),
        feature_priorities: state.capability_map.map(item => ({
          capability: item.capability,
          priority: item.priority,
        })),
        tools: this.listTools().map(tool => ({
          name: tool.name,
          inputSchema: [...tool.inputSchema],
        })),
        project_constraints: state.assumptions,
        implementation_risks: state.risks,
        approval_history: state.approval_history,
      },
    }

    const nextState: ProductProjectState = {
      ...state,
      handoff_status: 'awaiting_engineering_ack',
      tasks: updateTask(
        state.tasks,
        'awaiting_engineering_ack',
        'in_progress',
        input.timestamp,
        'Discovery handoff sent to engineering',
      ),
      audit_log: [...state.audit_log, `handoff_sent:${input.timestamp}`],
      last_updated_at: input.timestamp,
    }
    this.persist(nextState)

    return {
      handoff,
      outgoing: [
        handoff,
        {
          from: 'product_agent',
          to: 'project_manager_agent',
          message_type: 'status_update',
          project_id: input.project_id,
          timestamp: input.timestamp,
          payload: {
            status: 'discovery_handoff_sent',
            gate: 'engineering_ack',
          },
        },
      ],
    }
  }

  acknowledgeEngineeringHandoff(input: {
    project_id: string
    timestamp: string
  }): ProductProjectState {
    const state = this.requireProject(input.project_id)
    const lastApproval = state.approval_history.at(-1)?.response
    if (state.handoff_status !== 'awaiting_engineering_ack' || lastApproval?.decision !== 'approve') {
      throw new Error(`Cannot acknowledge engineering handoff for project ${input.project_id}`)
    }

    const nextState: ProductProjectState = {
      ...state,
      lifecycle_state: 'implementation',
      discovery_status: 'ready_for_implementation',
      handoff_status: 'handoff_completed',
      tasks: updateTask(
        state.tasks,
        'awaiting_engineering_ack',
        'completed',
        input.timestamp,
        'Engineering acknowledged discovery handoff',
      ),
      audit_log: [...state.audit_log, `handoff_acknowledged:${input.timestamp}`],
      last_updated_at: input.timestamp,
    }
    this.syncRegistry(nextState)
    return this.persist(nextState)
  }

  evaluateSla(input: {
    project_id: string
    now: string
    maxHours?: number
  }): Agent_Message[] {
    const state = this.requireProject(input.project_id)
    const maxHours = input.maxHours ?? 24
    const elapsedHours = (Date.parse(input.now) - Date.parse(state.last_updated_at)) / 36e5
    if (elapsedHours <= maxHours) {
      return []
    }

    const detail =
      state.discovery_status === 'awaiting_clarification'
        ? 'clarification'
        : state.handoff_status === 'awaiting_engineering_ack'
          ? 'engineering_ack'
          : 'general'

    const nextTasks =
      detail === 'clarification'
        ? updateTask(state.tasks, 'awaiting_clarification', 'overdue', input.now, 'Clarification SLA breached')
        : detail === 'engineering_ack'
          ? updateTask(state.tasks, 'awaiting_engineering_ack', 'overdue', input.now, 'Engineering acknowledgment SLA breached')
          : state.tasks

    this.persist({
      ...state,
      tasks: nextTasks,
      audit_log: [...state.audit_log, `sla_breach:${detail}:${input.now}`],
      last_updated_at: input.now,
    })

    return [
      {
        from: 'product_agent',
        to: 'project_manager_agent',
        message_type: 'risk_alert',
        project_id: input.project_id,
        timestamp: input.now,
        payload: {
          summary: `SLA breach detected for ${detail}`,
          severity: 'high',
        },
      },
    ]
  }

  listTools(): Array<ProductTool<any, any>> {
    return [
      buildTool({
        name: 'brief_analyze',
        description: 'Analyzes a client brief and extracts product discovery gaps.',
        inputSchema: ['brief_text', 'project_id'],
        isConcurrencySafe: true,
        checkPermissions,
        call: input => ({
          summary: `Analyzed brief for ${input.project_id}`,
          gaps: this.generateClarificationQuestions({ business_summary: input.brief_text }),
        }),
      }),
      buildTool({
        name: 'document_read',
        description: 'Reads a stored discovery artifact from the project namespace.',
        inputSchema: ['project_id', 'artifact_ref'],
        isConcurrencySafe: true,
        checkPermissions,
        call: input => ({
          artifact_ref: input.artifact_ref,
          content: this.requireProject(input.project_id).artifacts[input.artifact_ref] ?? null,
        }),
      }),
      buildTool({
        name: 'spec_write',
        description: 'Creates the next versioned product spec artifact.',
        inputSchema: ['project_id', 'timestamp'],
        isConcurrencySafe: false,
        checkPermissions,
        call: input => this.writeSpec(input),
      }),
      buildTool({
        name: 'template_load',
        description: 'Loads the product spec template metadata.',
        inputSchema: ['project_id'],
        isConcurrencySafe: true,
        checkPermissions,
        call: input => ({
          project_id: input.project_id,
          sections: [
            'solution_summary',
            'capability_map',
            'workflow',
            'tools',
            'integrations',
            'acceptance_criteria',
            'assumptions',
            'risks',
            'mvp_recommendation',
            'testability_gaps',
            'technical_constraints',
          ],
        }),
      }),
      buildTool({
        name: 'message_send',
        description: 'Publishes a typed cross-agent message for product coordination.',
        inputSchema: ['message'],
        isConcurrencySafe: false,
        checkPermissions,
        call: input => input.message,
      }),
    ]
  }

  private requireProject(projectId: string): ProductProjectState {
    const state = this.projects.get(projectId)
    if (!state) {
      throw new Error(`Unknown product project: ${projectId}`)
    }
    return cloneState(state)
  }

  private persist(state: ProductProjectState): ProductProjectState {
    const cloned = cloneState(state)
    this.projects.set(state.project_id, cloned)
    return cloneState(cloned)
  }

  private syncRegistry(state: ProductProjectState): void {
    if (!this.registry) return

    const existing = this.registry.getProject(state.project_id)
    const updates: ProjectRegistryEntry = existing
      ? {
          ...existing,
          project_id: state.project_id,
          client_id: state.client_id,
          lifecycle_state: state.lifecycle_state,
          active_agent_ids: existing.active_agent_ids.includes('product-agent')
            ? [...existing.active_agent_ids]
            : [...existing.active_agent_ids, 'product-agent'],
          current_milestone: state.discovery_status,
          updated_at: state.last_updated_at,
        }
      : {
          project_id: state.project_id,
          client_id: state.client_id,
          lifecycle_state: state.lifecycle_state,
          active_agent_ids: ['product-agent'],
          current_milestone: state.discovery_status,
          updated_at: state.last_updated_at,
        }

    if (existing) {
      this.registry.updateProject(state.project_id, {
        client_id: updates.client_id,
        lifecycle_state: updates.lifecycle_state,
        active_agent_ids: updates.active_agent_ids,
        current_milestone: updates.current_milestone,
        updated_at: updates.updated_at,
      })
      return
    }

    this.registry.registerProject(updates)
  }

  private extractAssumptions(payload: LeadHandoffPayload): string[] {
    const assumptions = [...(payload.commercial_assumptions ?? [])]
    if (!payload.stakeholders?.length) {
      assumptions.push('Primary stakeholder authority still needs confirmation.')
    }
    if (!payload.initial_scope?.length) {
      assumptions.push('Scope will stay limited to MVP until clarified.')
    }
    return assumptions
  }

  private detectConflicts(payload: LeadHandoffPayload): string[] {
    const conflicts: string[] = []
    const notes = payload.conversation_notes?.join(' ').toLowerCase() ?? ''
    const summary = payload.business_summary?.toLowerCase() ?? ''
    if (notes.includes('internal only') && summary.includes('public')) {
      conflicts.push('Conversation notes mention internal-only usage while summary suggests public-facing workflow.')
    }
    return conflicts
  }

  private buildCapabilityMap(payload: LeadHandoffPayload): DiscoveryCapability[] {
    const scopeText = payload.initial_scope?.join(' ').toLowerCase() ?? ''
    const capabilities: DiscoveryCapability[] = [
      {
        capability: 'Discovery intake and backlog shaping',
        recommended_agent_type: 'product_agent',
        rationale: 'Required to convert business needs into implementable scope.',
        priority: 'critical',
      },
    ]
    if (scopeText.includes('lead') || scopeText.includes('crm')) {
      capabilities.push({
        capability: 'Sales workflow automation',
        recommended_agent_type: 'sales_agent',
        rationale: 'Scope references lead or CRM operations that need sales-side integration.',
        priority: 'high',
      })
    }
    if (scopeText.includes('support')) {
      capabilities.push({
        capability: 'Support issue routing',
        recommended_agent_type: 'support_agent',
        rationale: 'Support workflows require escalation and ticket handling.',
        priority: 'medium',
      })
    }
    return capabilities
  }

  private buildRisks(payload: LeadHandoffPayload, missingFields: string[]): ProductRisk[] {
    const risks: ProductRisk[] = [...(payload.initial_risks ?? []).map((summary, index) => ({
      id: `risk-${index + 1}`,
      summary,
      priority: 'medium' as const,
      mitigation: 'Validate during discovery and capture explicit owner decision.',
    }))]

    if (missingFields.length > 0) {
      risks.push({
        id: `risk-missing-${missingFields.length}`,
        summary: `Incomplete lead handoff: ${missingFields.join(', ')}`,
        priority: 'high',
        mitigation: 'Send clarification_request before drafting the final spec.',
      })
    }
    if (!payload.last_proposal_ref) {
      risks.push({
        id: 'risk-proposal-ref',
        summary: 'Proposal reference is missing, which weakens auditability.',
        priority: 'critical',
        mitigation: 'Block discovery approval until proposal artifact is attached.',
      })
    }
    return risks
  }

  private buildArtifacts(
    state: ProductProjectState,
    payload: LeadHandoffPayload,
    questions: string[],
    assumptions: string[],
    conflicts: string[],
    risks: ProductRisk[],
    capabilityMap: DiscoveryCapability[],
  ): ProductArtifacts {
    const clarificationLogRef = `${state.namespace}clarification-log.json`
    const discoveryNotesRef = `${state.namespace}discovery-notes.md`
    const assumptionsRef = `${state.namespace}assumptions.md`
    const riskRegisterRef = `${state.namespace}risk-register.md`

    return {
      namespace: state.namespace,
      clarification_log_ref: clarificationLogRef,
      clarification_log_json: stringifyJson(
        questions.map(question => ({
          question,
          answer: null,
        })),
      ),
      discovery_notes_ref: discoveryNotesRef,
      discovery_notes_md: buildDiscoveryNotesMarkdown({
        payload,
        questions,
        capabilityMap,
        assumptions,
      }),
      assumptions_ref: assumptionsRef,
      assumptions_md: buildAssumptionsDocument(assumptions, conflicts),
      risk_register_ref: riskRegisterRef,
      risk_register_md: buildRiskRegister(risks),
    }
  }

  private composeSpecContent(
    state: ProductProjectState,
    version: number,
    summary?: string,
  ): string {
    const lines = [
      `# Product Spec v${version}`,
      '',
      '## Solution Summary',
      summary ?? state.latest_spec?.content ?? 'Solution summary derived from discovery artifacts.',
      '',
      '## Capability Map',
      ...(state.capability_map.map(item => `- ${item.capability} (${item.priority}): ${item.rationale}`)),
      '',
      '## Main Workflow',
      '- lead_handoff -> discovery -> approval_request -> discovery_handoff -> engineering_ack',
      '',
      '## Tools',
      ...this.listTools().map(tool => `- ${tool.name}: ${tool.description}`),
      '',
      '## Integrations',
      '- Sales Agent handoff intake',
      '- Project Manager status updates',
      '- Engineering Agent discovery handoff',
      '',
      '## Acceptance Criteria',
      ...this.extractAcceptanceCriteria(state).map(item => `- ${item}`),
      '',
      '## Assumptions',
      ...(state.assumptions.map(item => `- ${item}`)),
      '',
      '## Risks',
      ...(state.risks.map(item => `- [${item.priority}] ${item.summary}`)),
      '',
      '## MVP Recommendation',
      '- Deliver the validated scope from initial discovery as phase 1.',
      '',
      '## Testability Gaps',
      ...(state.conflicts.length > 0
        ? state.conflicts.map(item => `- ${item}`)
        : ['- No unresolved testability gaps captured at this version.']),
      '',
      '## Technical Constraints',
      '- Must remain compatible with .kiro/specs/ai-company-agents lifecycle and message contracts.',
    ]
    return lines.join('\n')
  }

  private extractAcceptanceCriteria(state: ProductProjectState): string[] {
    const criteria = [
      'Spec must be approved by owner before engineering handoff.',
      'Engineering acknowledgment is required before lifecycle advances to implementation.',
      'All discovery artifacts stay inside the project namespace.',
    ]
    if (state.capability_map.length > 0) {
      criteria.push(`Capability map includes ${state.capability_map.length} tracked capabilities.`)
    }
    return criteria
  }
}
