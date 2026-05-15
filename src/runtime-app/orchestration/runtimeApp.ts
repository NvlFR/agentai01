import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import type {
  AgentType,
  Agent_Message,
  Approval_Response,
  ProjectRegistryEntry,
} from '../../domain/types.js'
import type {
  OrchestratorShell,
  RuntimeWorkerDescriptor,
} from '../../runtime/index.js'
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

export type RuntimeOperationalAppOptions = {
  shell?: OrchestratorShell
  workers?: RuntimeWorkerDescriptor[]
  workspaceBaseDir?: string
  now?: string
}

export class RuntimeOperationalApp {
  readonly shell: OrchestratorShell
  readonly workspaceBaseDir: string
  readonly workerMap: Map<AgentType, RuntimeWorkerDescriptor>
  readonly stores: RuntimeAgentStores
  readonly adapters: Record<AgentType, AgentAdapter>
  readonly bus: RuntimeMessageBus

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
