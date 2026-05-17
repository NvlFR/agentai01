import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import type {
  AgentType,
  Agent_Message,
  Approval_Gate,
  Approval_Request,
  Approval_Response,
  ProjectRegistryEntry,
} from '../../domain/types.js'
import {
  executeDepartmentHeadAgent,
  registerAllSubAgentDepartments,
  type DepartmentHeadAgentId,
} from '../../agents/subagents/index.js'
import type {
  OrchestratorShell,
  RuntimeWorkerDescriptor,
} from '../../runtime/index.js'
import { SubAgentRegistry } from '../../registry/subAgentRegistry.js'
import {
  createDefaultAgentAdapters,
  makeApprovalResponseMessage,
  type AgentAdapter,
  type RuntimeAgentStores,
} from '../integration/agentExecution.js'
import {
  bootRuntimeShell,
  createDefaultWorkers,
  workerToRegistryEntry,
} from '../integration/bootstrap.js'
import { RuntimeMessageBus, type RuntimeEvent } from './messageBus.js'
import { CeoRuntime } from '../../agents/ceo/index.js'
import { ProductRuntime } from '../../agents/product/index.js'
import {
  createSpecialistToolExecutor,
  SubAgentSpecialistExecutor,
  type SpecialistTextProvider,
  type SpecialistToolExecutor,
  type SubAgentExecutorMode,
} from '../../runtime/subagents/index.js'

export type RuntimeOperationalAppOptions = {
  shell?: OrchestratorShell
  workers?: RuntimeWorkerDescriptor[]
  workspaceBaseDir?: string
  now?: string
  specialistProvider?: SpecialistTextProvider
  specialistToolExecutor?: SpecialistToolExecutor
  specialistMode?: SubAgentExecutorMode
}

export type DepartmentRunRecord = {
  runId: string
  headAgentId: DepartmentHeadAgentId
  workflow: string
  startedAt: string
  completedAt: string
  status: 'completed' | 'failed'
  requiresApproval: boolean
  summary: string
  output: Record<string, unknown>
  approvalRequestId?: string
}

export class RuntimeOperationalApp {
  readonly shell: OrchestratorShell
  readonly workspaceBaseDir: string
  readonly workerMap: Map<AgentType, RuntimeWorkerDescriptor>
  readonly stores: RuntimeAgentStores
  readonly adapters: Record<AgentType, AgentAdapter>
  readonly bus: RuntimeMessageBus
  readonly subAgentRegistry: SubAgentRegistry
  readonly departmentRuns: DepartmentRunRecord[] = []

  private readonly specialistProvider?: SpecialistTextProvider
  private readonly specialistToolExecutor: SpecialistToolExecutor
  private readonly specialistMode: SubAgentExecutorMode

  constructor(options: RuntimeOperationalAppOptions = {}) {
    const now = options.now ?? new Date().toISOString()
    const workers = options.workers ?? createDefaultWorkers()
    this.shell =
      options.shell ??
      bootRuntimeShell({
        shell_id: 'runtime-app-shell',
        runtime_id: 'runtime-app',
        workers,
        started_at: now,
      })
    this.workspaceBaseDir =
      options.workspaceBaseDir ?? join(process.cwd(), '.runtime-app-workspaces')
    mkdirSync(this.workspaceBaseDir, { recursive: true })

    this.workerMap = new Map(workers.map(worker => [worker.agent_type, { ...worker }]))
    for (const worker of workers) {
      this.shell.app.registerAgent(workerToRegistryEntry(worker, now))
    }

    this.stores = {
      ceo: new CeoRuntime(this.shell.app.getRegistry(), 'ceo-1', { now }),
      product: new ProductRuntime(this.shell.app.getRegistry()),
      productProjects: new Map(),
      engineeringProjects: new Map(),
      salesLeads: new Map(),
      salesProposals: new Map(),
      salesApprovalCycles: new Map(),
      projectTimelines: new Map(),
      projectHistory: new Map(),
      supportTickets: new Map(),
    }
    this.adapters = createDefaultAgentAdapters(this, this.stores)
    this.bus = new RuntimeMessageBus(this, this.adapters)
    this.subAgentRegistry = new SubAgentRegistry()
    registerAllSubAgentDepartments(this.subAgentRegistry)
    this.specialistProvider = options.specialistProvider
    this.specialistToolExecutor =
      options.specialistToolExecutor ?? createSpecialistToolExecutor(readToolExecutorOptionsFromEnv())
    this.specialistMode = options.specialistMode ?? 'auto'
    this.bus.events.push({
      kind: 'boot',
      timestamp: now,
      detail: `Registered ${workers.length} workers.`,
    })
  }

  get events(): RuntimeEvent[] {
    return [...this.bus.events]
  }

  requireProject(projectId: string): ProjectRegistryEntry {
    const project = this.shell.app.getRegistry().getProject(projectId)
    if (!project) {
      throw new Error(`Project not found: ${projectId}`)
    }
    return project
  }

  ensureProject(input: {
    project_id: string
    client_id: string
    lifecycle_state?: ProjectRegistryEntry['lifecycle_state']
    milestone?: string
    now?: string
  }): ProjectRegistryEntry {
    const now = input.now ?? new Date().toISOString()
    const existing = this.shell.app.getRegistry().getProject(input.project_id)
    if (existing) {
      return existing
    }

    const project: ProjectRegistryEntry = {
      project_id: input.project_id,
      client_id: input.client_id,
      lifecycle_state: input.lifecycle_state ?? 'lead',
      active_agent_ids: [],
      current_milestone: input.milestone ?? 'runtime_boot',
      updated_at: now,
    }
    this.shell.app.registerProject(project)
    return project
  }

  assignProjectAgents(projectId: string, now = new Date().toISOString()): void {
    this.bindAgentsToProject([...this.workerMap.keys()], projectId, now)
  }

  bindAgentsToProject(
    agents: AgentType[],
    projectId: string,
    now = new Date().toISOString(),
  ): void {
    for (const agentType of agents) {
      const worker = this.workerMap.get(agentType)
      if (!worker) continue
      this.shell.app.updateAgent(worker.agent_id, {
        current_project_id: projectId,
        last_activity_timestamp: now,
      })
    }

    const project = this.requireProject(projectId)
    const activeAgentIds = new Set(project.active_agent_ids)
    for (const worker of this.workerMap.values()) {
      const agent = this.shell.app.getRegistry().getAgent(worker.agent_id)
      if (agent?.current_project_id === projectId) {
        activeAgentIds.add(worker.agent_id)
      }
    }
    this.shell.app.updateProject(projectId, {
      active_agent_ids: [...activeAgentIds],
      updated_at: now,
    })
  }

  async dispatch(message: Agent_Message): Promise<void> {
    await this.bus.dispatch(message)
  }

  async executeAgentTask(
    agentType: AgentType,
    task: string,
    input: Record<string, unknown>,
    now = new Date().toISOString(),
  ): Promise<void> {
    const adapter = this.adapters[agentType]
    if (!adapter?.executeTask) {
      throw new Error(`Task adapter not available for ${agentType}`)
    }

    const result = await adapter.executeTask(task, input, { app: this, now })
    for (const outgoing of result.outgoing ?? []) {
      await this.dispatch(outgoing)
    }
  }

  async runDepartmentWorkflow(args: {
    headAgentId: DepartmentHeadAgentId
    payload: unknown
    workflow?: string
    mode?: SubAgentExecutorMode
    now?: string
    requireApproval?: boolean
    projectId?: string
  }): Promise<DepartmentRunRecord> {
    const now = args.now ?? new Date().toISOString()
    const payload = withWorkflowPayload(args.payload, args.workflow)
    const executor = new SubAgentSpecialistExecutor({
      registry: this.subAgentRegistry,
      mode: args.mode ?? this.specialistMode,
      provider: this.specialistProvider,
      toolExecutor: this.specialistToolExecutor,
      now: () => now,
    })

    const result = await executeDepartmentHeadAgent(args.headAgentId, {
      registry: this.subAgentRegistry,
      payload,
      mode: args.mode ?? this.specialistMode,
      provider: this.specialistProvider,
      toolExecutor: this.specialistToolExecutor,
      executor,
      now,
    })

    const output = structuredClone(result.output)
    const status = output['status'] === 'failed' ? 'failed' : 'completed'
    const workflow =
      typeof output['workflow'] === 'string' ? output['workflow'] : args.workflow ?? 'default'
    const record: DepartmentRunRecord = {
      runId: `dept-run:${args.headAgentId}:${now}`,
      headAgentId: args.headAgentId,
      workflow,
      startedAt: now,
      completedAt: now,
      status,
      requiresApproval: args.requireApproval === true,
      summary: result.summary,
      output,
    }

    if (args.requireApproval && status === 'completed') {
      const approval = buildDepartmentApprovalRequest(record, args.projectId)
      this.shell.recordApprovalRequest(approval)
      record.approvalRequestId = approval.request_id
    }

    this.departmentRuns.unshift(record)
    this.bus.events.push({
      kind: 'department_run',
      timestamp: now,
      head_agent_id: args.headAgentId,
      workflow,
      status,
      requires_approval: args.requireApproval === true,
    })
    return record
  }

  executeOwnerDirective(rawInput: string, now = new Date().toISOString()): string {
    const result = this.stores.ceo.executeOwnerDirective(
      rawInput,
      {
        actor_id: 'owner',
        token_id: 'owner-token',
        authenticated: true,
      },
      'natural',
      now,
    )
    return result.response
  }

  async respondToPendingApproval(
    projectId: string,
    gate: Approval_Response['gate'],
    decision: Approval_Response['decision'],
    now = new Date().toISOString(),
    notes?: string,
  ): Promise<void> {
    const approval = this.shell
      .buildSnapshot(now)
      .pending_approvals
      .find(item => item.project_id === projectId && item.gate === gate)
    if (!approval) {
      throw new Error(`Pending approval ${gate} not found for ${projectId}`)
    }

    const response: Approval_Response = {
      request_id: approval.request_id,
      gate: approval.gate,
      timestamp: now,
      decision,
      notes,
    }

    this.shell.applyApprovalResponse(response)
    await this.dispatch(
      makeApprovalResponseMessage(approval.from_agent, projectId, now, response),
    )
  }

  raiseRepeatedFailureEscalation(
    message: Agent_Message,
    reason: string,
    now = new Date().toISOString(),
  ): void {
    this.shell.app.addBlocker({
      blocker_id: `dispatch-failure:${message.project_id}:${message.to}:${message.message_type}`,
      summary: `Dispatch to ${message.to} failed repeatedly: ${reason}`,
      severity: 'high',
      created_at: now,
      project_id: message.project_id,
      owner_agent: message.to,
    })
  }
}

export function createRuntimeOperationalApp(
  options: RuntimeOperationalAppOptions = {},
): RuntimeOperationalApp {
  return new RuntimeOperationalApp(options)
}

function withWorkflowPayload(payload: unknown, workflow?: string): unknown {
  if (!workflow) {
    return payload
  }

  const root =
    typeof payload === 'object' && payload !== null
      ? (payload as Record<string, unknown>)
      : { payload }
  return {
    ...root,
    workflow,
  }
}

function readToolExecutorOptionsFromEnv() {
  const env = process.env
  return {
    notionToken: env['NOTION_TOKEN'],
    notionParentPageId: env['NOTION_PARENT_PAGE_ID'],
    githubToken: env['GITHUB_TOKEN'],
    githubDefaultOwner: env['GITHUB_OWNER'],
    githubDefaultRepo: env['GITHUB_REPO'],
    slackToken: env['SLACK_BOT_TOKEN'],
    slackDefaultChannel: env['SLACK_DEFAULT_CHANNEL'],
  }
}

function buildDepartmentApprovalRequest(
  record: DepartmentRunRecord,
  projectId?: string,
): Approval_Request {
  return {
    request_id: `${record.runId}:approval`,
    gate: mapHeadToApprovalGate(record.headAgentId),
    from_agent: mapHeadToAgentType(record.headAgentId),
    timestamp: record.completedAt,
    project_id: projectId,
    summary: record.summary,
    recommendation: `Review ${record.workflow} output from ${record.headAgentId}.`,
    risks: collectApprovalRisks(record),
    options: ['approve', 'reject', 'revise'],
    artifact_ref: `runtime://${record.runId}`,
  }
}

function collectApprovalRisks(record: DepartmentRunRecord): string[] {
  const risks = record.output['risks']
  if (Array.isArray(risks)) {
    return risks.filter((item): item is string => typeof item === 'string')
  }
  if (record.status === 'failed') {
    const reason = record.output['reason']
    return [typeof reason === 'string' ? reason : 'Department workflow failed.']
  }
  return [`Validate ${record.workflow} output before downstream execution.`]
}

function mapHeadToApprovalGate(headAgentId: DepartmentHeadAgentId): Approval_Gate {
  switch (headAgentId) {
    case 'sales-head':
      return 'proposal_final'
    case 'product-head':
      return 'spec_final'
    case 'engineering-head':
      return 'delivery_final'
    default:
      return 'strategic_decision'
  }
}

function mapHeadToAgentType(headAgentId: DepartmentHeadAgentId): AgentType {
  switch (headAgentId) {
    case 'ceo-agent':
      return 'ceo_agent'
    case 'marketing-head':
      return 'marketing_agent'
    case 'sales-head':
      return 'sales_agent'
    case 'product-head':
      return 'product_agent'
    case 'engineering-head':
      return 'engineering_agent'
    case 'pm-head':
      return 'project_manager_agent'
    case 'support-head':
      return 'support_agent'
  }
}
