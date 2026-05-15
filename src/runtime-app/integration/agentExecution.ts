import type {
  AgentType,
  Agent_Message,
  Approval_Request,
  Approval_Response,
  ProjectRegistryEntry,
} from '../../domain/types.js'
import { CeoRuntime } from '../../agents/ceo/index.js'
import {
  acceptDiscoveryHandoff,
  buildDeliveryApprovalRequest,
  createEngineeringProjectState,
  handleApprovalResponse as handleEngineeringApprovalResponse,
  markReadyForOwnerReview,
  startQaValidation,
  writeQaReport,
  type DiscoveryHandoffMessage,
  type EngineeringProjectState,
} from '../../agents/engineering/index.js'
import {
  buildSalesLeadHandoffMessage,
  type InboundLeadPacket,
} from '../../agents/marketing/index.js'
import {
  createBaselineTimeline,
  createProjectHistoryEvent,
  type ProjectHistoryEvent,
  type ProjectTimeline,
} from '../../agents/project-manager/index.js'
import {
  ProductRuntime,
  type ProductProjectState,
} from '../../agents/product/index.js'
import {
  applyProposalApprovalResponse,
  attachProposalToLead,
  buildLeadHandoffBundle,
  buildProposal,
  createLeadFromMarketingHandoff,
  createProposalApprovalCycle,
  recordApprovalCycleOnLead,
  scoreLead,
  sendProposal,
  updatePipelineStage,
  type Lead,
  type MarketingLeadHandoffMessage,
  type Proposal,
  type ProposalApprovalCycle,
} from '../../agents/sales/index.js'
import {
  createSupportTicket,
  type SupportTicket,
  type SupportTicketInput,
} from '../../agents/support/index.js'
import type { AgentRegistry } from '../../registry/AgentRegistry.js'

export type RuntimeOperationalAppPort = {
  shell: {
    routeMessage: (
      message: unknown,
    ) => { allowed: true } | { allowed: false; reason: string }
    app: {
      getRegistry: () => AgentRegistry
      registerProject: (entry: ProjectRegistryEntry) => void
      updateProject: (
        projectId: string,
        updates: Partial<Omit<ProjectRegistryEntry, 'project_id'>>,
      ) => void
      setSupportTicketCount: (count: number) => void
    }
    recordApprovalRequest: (approval: Approval_Request) => void
    transitionProjectLifecycle: (args: {
      project_id: string
      to: ProjectRegistryEntry['lifecycle_state']
      event: 'lead_qualified' | 'proposal_sent' | 'deal_won'
      actor: 'sales_agent'
      updated_at?: string
      milestone?: string
    }) => { allowed: boolean }
  }
  workspaceBaseDir: string
  requireProject: (projectId: string) => ProjectRegistryEntry
  assignProjectAgents: (projectId: string, now?: string) => void
  bindAgentsToProject: (agents: AgentType[], projectId: string, now?: string) => void
  raiseRepeatedFailureEscalation: (
    message: Agent_Message,
    reason: string,
    now?: string,
  ) => void
}

export type AgentExecutionResult = {
  outgoing?: Agent_Message[]
  approvals?: Approval_Request[]
  responses?: Approval_Response[]
  notes?: string[]
}

export type AgentExecutionContext = {
  app: RuntimeOperationalAppPort
  now: string
}

export type AgentAdapter = {
  agentType: AgentType
  executeMessage?: (
    message: Agent_Message,
    context: AgentExecutionContext,
  ) => Promise<AgentExecutionResult> | AgentExecutionResult
  executeTask?: (
    task: string,
    input: Record<string, unknown>,
    context: AgentExecutionContext,
  ) => Promise<AgentExecutionResult> | AgentExecutionResult
}

export type RuntimeAgentStores = {
  ceo: CeoRuntime
  product: ProductRuntime
  productProjects: Map<string, ProductProjectState>
  engineeringProjects: Map<string, EngineeringProjectState>
  salesLeads: Map<string, Lead>
  salesProposals: Map<string, Proposal>
  salesApprovalCycles: Map<string, ProposalApprovalCycle>
  projectTimelines: Map<string, ProjectTimeline>
  projectHistory: Map<string, ProjectHistoryEvent[]>
  supportTickets: Map<string, SupportTicket>
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

function toStringArray(value: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(value)) {
    return [...fallback]
  }
  return value.filter((item): item is string => typeof item === 'string')
}

function toNonEmptyString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback
}

function makeApprovalRequestMessage(
  from: AgentType,
  projectId: string,
  timestamp: string,
  approval: Approval_Request,
): Agent_Message<{ approval: Approval_Request }> {
  return {
    from,
    to: 'ceo_agent',
    message_type: 'approval_request',
    project_id: projectId,
    timestamp,
    payload: { approval },
  }
}

export function makeApprovalResponseMessage(
  to: AgentType,
  projectId: string,
  timestamp: string,
  response: Approval_Response,
): Agent_Message<{ response: Approval_Response }> {
  return {
    from: 'ceo_agent',
    to,
    message_type: 'approval_response',
    project_id: projectId,
    timestamp,
    payload: { response },
  }
}

function mapProductToEngineeringHandoff(
  state: ProductProjectState,
  timestamp: string,
): Agent_Message<Record<string, unknown>> {
  const capabilityTitles = state.capability_map.map(item => item.capability)
  const toolNames = ['spec_write', 'message_send', 'deliverable_package']
  const constraints =
    state.assumptions.length > 0
      ? [...state.assumptions]
      : ['Stay within approved delivery scope.']
  const implementationRisks = state.risks.map(
    risk => `${risk.priority}:${risk.summary}`,
  )

  return {
    from: 'product_agent',
    to: 'engineering_agent',
    message_type: 'discovery_handoff',
    project_id: state.project_id,
    timestamp,
    payload: {
      handoff_id: `${state.project_id}:discovery_handoff`,
      spec_artifact_ref:
        state.latest_spec?.artifact_ref ?? `projects/${state.client_id}/${state.project_id}/spec.md`,
      mvp_scope: capabilityTitles,
      tool_stack: toolNames,
      technical_constraints: constraints,
      implementation_risks: implementationRisks,
      spec_final: {
        title: state.latest_spec?.artifact_ref ?? `Spec ${state.project_id}`,
        summary:
          state.latest_spec?.content.slice(0, 240) ??
          `Approved spec for ${state.project_id}`,
        capabilities: state.capability_map.map((capability, index) => ({
          capability_id: `cap-${index + 1}`,
          title: capability.capability,
          description: capability.rationale,
        })),
      },
      acceptance_criteria: capabilityTitles.map(
        item => `Deliver capability ${item}`,
      ),
      feature_priorities: state.capability_map.map(
        item => `${item.priority}:${item.capability}`,
      ),
      tool_list: toolNames,
      project_constraints: constraints,
      approval_history: state.approval_history.map(item => ({
        gate: item.response.gate,
        decision: item.response.decision,
        decided_at: item.response.timestamp,
        decided_by: 'owner',
      })),
      external_integrations: [],
    },
  }
}

function createProjectIfMissing(
  app: RuntimeOperationalAppPort,
  input: {
    projectId: string
    clientId: string
    now: string
    lifecycleState?: ProjectRegistryEntry['lifecycle_state']
    milestone?: string
  },
): void {
  if (app.shell.app.getRegistry().getProject(input.projectId)) {
    return
  }

  app.shell.app.registerProject({
    project_id: input.projectId,
    client_id: input.clientId,
    lifecycle_state: input.lifecycleState ?? 'lead',
    active_agent_ids: [],
    current_milestone: input.milestone ?? 'runtime_created',
    updated_at: input.now,
  })
}

export function createDefaultAgentAdapters(
  app: RuntimeOperationalAppPort,
  stores: RuntimeAgentStores,
): Record<AgentType, AgentAdapter> {
  const ceoAdapter: AgentAdapter = {
    agentType: 'ceo_agent',
    executeMessage(message, context) {
      if (message.message_type === 'approval_request') {
        const approval = asRecord(message.payload)['approval'] as Approval_Request
        context.app.shell.recordApprovalRequest(approval)
        return {
          notes: [`Approval request ${approval.request_id} registered.`],
        }
      }

      return { notes: [`CEO received ${message.message_type}.`] }
    },
    executeTask(task, input, context) {
      if (task !== 'owner_directive') {
        return { notes: [`CEO task ${task} ignored.`] }
      }

      const result = stores.ceo.executeOwnerDirective(
        toNonEmptyString(input['raw_input'], 'status'),
        {
          actor_id: toNonEmptyString(input['actor_id'], 'owner'),
          authenticated: input['authenticated'] !== false,
          token_id:
            typeof input['token_id'] === 'string' ? input['token_id'] : undefined,
        },
        'natural',
        context.now,
      )
      return { notes: [result.response] }
    },
  }

  const marketingAdapter: AgentAdapter = {
    agentType: 'marketing_agent',
    executeTask(task, input, context) {
      if (task !== 'capture_inbound_lead') {
        return { notes: [`Marketing task ${task} ignored.`] }
      }

      const packet: InboundLeadPacket = {
        lead_id: toNonEmptyString(input['lead_id'], 'lead-1'),
        company_name: toNonEmptyString(input['company_name'], 'Unknown Company'),
        contact_name:
          typeof input['contact_name'] === 'string' ? input['contact_name'] : undefined,
        contact_email:
          typeof input['contact_email'] === 'string' ? input['contact_email'] : undefined,
        contact_channel: toNonEmptyString(input['contact_channel'], 'email'),
        source_channel: toNonEmptyString(input['source_channel'], 'website'),
        campaign_id: toNonEmptyString(input['campaign_id'], 'campaign-1'),
        segment_id: toNonEmptyString(input['segment_id'], 'general'),
        project_id:
          typeof input['project_id'] === 'string' ? input['project_id'] : null,
        initial_need_summary:
          typeof input['initial_need_summary'] === 'string'
            ? input['initial_need_summary']
            : undefined,
        captured_at: context.now,
        ack_status: 'pending_sales_ack',
        tags: toStringArray(input['tags']),
      }

      const projectId = packet.project_id ?? `proj-${packet.lead_id}`
      const message = buildSalesLeadHandoffMessage(packet, {
        routingProjectId: projectId,
        timestamp: context.now,
      })

      createProjectIfMissing(context.app, {
        projectId,
        clientId: packet.company_name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        now: context.now,
        lifecycleState: 'lead',
        milestone: 'marketing_lead_captured',
      })
      context.app.assignProjectAgents(projectId, context.now)

      return {
        outgoing: [
          {
            from: 'marketing_agent',
            to: 'sales_agent',
            message_type: 'status_update',
            project_id: message.project_id,
            timestamp: message.timestamp,
            payload: {
              status: 'marketing_lead_ready',
              summary: `Inbound lead captured from ${packet.source_channel}.`,
              ...message.payload,
            },
          },
        ],
      }
    },
  }

  const salesAdapter: AgentAdapter = {
    agentType: 'sales_agent',
    executeMessage(message, context) {
      if (message.message_type === 'status_update' && message.from === 'marketing_agent') {
        const inbound = message as MarketingLeadHandoffMessage
        const lead = createLeadFromMarketingHandoff(inbound)
        const scoredLead = scoreLead(
          lead,
          {
            urgency: 4,
            budget_fit: 4,
            authority: 3,
            use_case_relevance: 4,
          },
          context.now,
        )
        const qualifiedLead = updatePipelineStage(scoredLead, 'qualified', context.now)
        const proposal = buildProposal({
          lead: qualifiedLead,
          version: 1,
          created_at: context.now,
          business_outcomes: [
            'Reduce manual coordination',
            'Provide owner dashboard visibility',
          ],
          scope_outline: [
            'Lead intake automation',
            'Runtime orchestration',
            'Delivery dashboard updates',
          ],
          estimated_timeline: '2 weeks',
          price_range: '$8k-$12k',
          assumptions: ['Existing agents can be integrated without a rewrite.'],
          commercial_risks: ['Approval turnaround impacts delivery velocity.'],
        })
        const leadWithProposal = attachProposalToLead(
          qualifiedLead,
          proposal,
          context.now,
        )
        const cycle = createProposalApprovalCycle({
          request_id: `${message.project_id}:proposal_final:v1`,
          timestamp: context.now,
          proposal,
          project_id: message.project_id,
          change_summary: 'Initial proposal ready for owner review.',
        })

        stores.salesLeads.set(leadWithProposal.lead_id, leadWithProposal)
        stores.salesProposals.set(leadWithProposal.lead_id, proposal)
        stores.salesApprovalCycles.set(message.project_id, cycle)

        return {
          outgoing: [
            makeApprovalRequestMessage(
              'sales_agent',
              message.project_id,
              context.now,
              cycle.request,
            ),
          ],
          approvals: [cycle.request],
        }
      }

      if (message.message_type === 'approval_response') {
        const response = asRecord(message.payload)['response'] as Approval_Response
        const cycle = stores.salesApprovalCycles.get(message.project_id)
        if (!cycle) {
          throw new Error(`Sales approval cycle not found for ${message.project_id}`)
        }

        const nextCycle = applyProposalApprovalResponse(cycle, response)
        stores.salesApprovalCycles.set(message.project_id, nextCycle)

        const lead = [...stores.salesLeads.values()].find(item =>
          item.proposal_refs.includes(cycle.request.artifact_ref),
        )
        const proposal = [...stores.salesProposals.values()].find(
          item => item.artifact_ref === cycle.request.artifact_ref,
        )
        if (!lead || !proposal) {
          throw new Error(`Sales lead/proposal not found for ${message.project_id}`)
        }

        const leadAfterApproval = recordApprovalCycleOnLead(lead, nextCycle, context.now)
        if (response.decision !== 'approve') {
          stores.salesLeads.set(lead.lead_id, leadAfterApproval)
          return { responses: [response] }
        }

        const sent = sendProposal(leadAfterApproval, proposal, context.now)
        const wonLead = updatePipelineStage(sent.lead, 'won', context.now)
        stores.salesLeads.set(lead.lead_id, wonLead)
        stores.salesProposals.set(lead.lead_id, sent.proposal)

        context.app.shell.transitionProjectLifecycle({
          project_id: message.project_id,
          to: 'qualified',
          event: 'lead_qualified',
          actor: 'sales_agent',
          updated_at: context.now,
          milestone: 'lead_qualified',
        })
        context.app.shell.transitionProjectLifecycle({
          project_id: message.project_id,
          to: 'proposal',
          event: 'proposal_sent',
          actor: 'sales_agent',
          updated_at: context.now,
          milestone: 'proposal_sent',
        })
        context.app.shell.transitionProjectLifecycle({
          project_id: message.project_id,
          to: 'won',
          event: 'deal_won',
          actor: 'sales_agent',
          updated_at: context.now,
          milestone: 'deal_won',
        })

        const handoffBundle = buildLeadHandoffBundle({
          lead: wonLead,
          proposal: sent.proposal,
          project_id: message.project_id,
          timestamp: context.now,
        })
        const normalizedLeadHandoff: Agent_Message = {
          ...handoffBundle.handoff,
          payload: {
            ...handoffBundle.handoff.payload,
            handoff_id: `${message.project_id}:lead_handoff`,
            client_name: wonLead.company_name,
            stakeholder_contacts: [
              wonLead.primary_contact,
              ...wonLead.stakeholders,
            ].filter((value, index, array) => array.indexOf(value) === index),
            business_summary: wonLead.initial_need,
            stakeholders:
              wonLead.stakeholders.length > 0
                ? wonLead.stakeholders
                : [wonLead.primary_contact],
            last_proposal_ref: sent.proposal.artifact_ref,
            proposal_artifact_ref: sent.proposal.artifact_ref,
            initial_scope: sent.proposal.scope_outline,
            commercial_assumptions: sent.proposal.assumptions,
            initial_risks: sent.proposal.commercial_risks,
          },
        }

        return {
          outgoing: [normalizedLeadHandoff, handoffBundle.project_manager_update],
          responses: [response],
        }
      }

      return { notes: [`Sales ignored ${message.message_type}.`] }
    },
  }

  const productAdapter: AgentAdapter = {
    agentType: 'product_agent',
    executeMessage(message, context) {
      if (message.message_type === 'lead_handoff') {
        const payload = asRecord(message.payload)
        const transformed: Agent_Message = {
          ...message,
          payload: {
            business_summary: toNonEmptyString(payload['business_summary'], 'Discovery brief'),
            stakeholders: toStringArray(payload['stakeholders'], [
              'Buying stakeholder to confirm during discovery',
            ]),
            last_proposal_ref: toNonEmptyString(payload['last_proposal_ref'], 'proposal.md'),
            initial_scope: (() => {
              const outstanding = toStringArray(
                asRecord(payload['delivery_readiness'])['outstanding_scoping'],
              )
              return outstanding.length > 0 ? outstanding : ['Initial MVP scope']
            })(),
            commercial_assumptions: ['Commercial assumptions inherited from proposal.'],
            initial_risks: (() => {
              const risks = toStringArray(payload['commercial_risks'])
              return risks.length > 0 ? risks : ['Scope assumptions may evolve in discovery.']
            })(),
            company_name: toNonEmptyString(payload['company_name'], 'client'),
            pain_points: toStringArray(payload['pain_points']),
            conversation_notes: toStringArray(payload['conversation_notes']),
          },
        }

        const clientId = context.app.requireProject(message.project_id).client_id
        const received = stores.product.receiveLeadHandoff(clientId, transformed)
        stores.productProjects.set(message.project_id, received.state)

        const spec = stores.product.writeSpec({
          project_id: message.project_id,
          timestamp: context.now,
          summary: 'Runtime-generated discovery spec.',
        })
        const approval = stores.product.requestApproval({
          project_id: message.project_id,
          request_id: `${message.project_id}:spec_final:v${spec.version}`,
          timestamp: context.now,
          recommendation: 'Approve spec so engineering can start.',
        })

        return {
          outgoing: [
            ...received.outgoing,
            ...approval.outgoing,
            makeApprovalRequestMessage(
              'product_agent',
              message.project_id,
              context.now,
              approval.approval,
            ),
          ],
          approvals: [approval.approval],
        }
      }

      if (message.message_type === 'approval_response') {
        const response = asRecord(message.payload)['response'] as Approval_Response
        const nextState = stores.product.recordApprovalResponse({
          project_id: message.project_id,
          response,
        })
        stores.productProjects.set(message.project_id, nextState)

        if (response.decision !== 'approve') {
          return { responses: [response] }
        }

        const discovery = stores.product.createDiscoveryHandoff({
          project_id: message.project_id,
          timestamp: context.now,
        })
        const handoffReadyState =
          stores.product.getProjectState(message.project_id) ?? nextState
        stores.productProjects.set(message.project_id, handoffReadyState)

        return {
          outgoing: [
            ...discovery.outgoing.filter(
              outgoing => outgoing.message_type === 'status_update',
            ),
            mapProductToEngineeringHandoff(handoffReadyState, context.now),
          ],
          responses: [response],
        }
      }

      if (
        message.message_type === 'status_update' &&
        message.from === 'engineering_agent'
      ) {
        const project = context.app.requireProject(message.project_id)
        if (
          ['qa', 'delivered', 'support', 'closed'].includes(project.lifecycle_state)
        ) {
          return {
            notes: [
              `Product observed engineering status while project is already ${project.lifecycle_state}.`,
            ],
          }
        }

        try {
          const state = stores.product.acknowledgeEngineeringHandoff({
            project_id: message.project_id,
            timestamp: context.now,
          })
          stores.productProjects.set(message.project_id, state)
        } catch {
          return {
            notes: [
              `Product ignored duplicate engineering acknowledgment for ${message.project_id}.`,
            ],
          }
        }
      }

      return { notes: [`Product processed ${message.message_type}.`] }
    },
  }

  const engineeringAdapter: AgentAdapter = {
    agentType: 'engineering_agent',
    async executeMessage(message, context) {
      if (message.message_type === 'discovery_handoff') {
        const project = context.app.requireProject(message.project_id)
        const existingState = stores.engineeringProjects.get(message.project_id)
        if (
          existingState &&
          ['implementation', 'qa', 'delivered', 'support', 'closed'].includes(
            project.lifecycle_state,
          )
        ) {
          return {
            notes: [
              `Engineering handoff for ${message.project_id} already processed at ${existingState.last_updated_at}.`,
            ],
          }
        }

        const baseState =
          existingState ??
          createEngineeringProjectState({
            project_id: message.project_id,
            client_id: project.client_id,
            workspace_root: '',
            now: context.now,
          })

        const accepted = await acceptDiscoveryHandoff(context.app.shell.app.getRegistry(), {
          message: message as DiscoveryHandoffMessage,
          state: baseState,
          workspaceBaseDir: context.app.workspaceBaseDir,
        })
        let nextState = accepted.nextState
        const qa = await startQaValidation(
          context.app.shell.app.getRegistry(),
          nextState,
          context.now,
        )
        nextState = qa.nextState

        const qaReportPath = await writeQaReport(nextState, {
          unitTests: ['handoff validation', 'approval workflow'],
          integrationTests: ['lead intake to delivery orchestration'],
          staticChecks: ['tsc --noEmit'],
          knownLimitations: ['Execution steps are simulated by runtime adapters.'],
          deploymentNotes: ['Release after owner approval.'],
        })

        const ready = await markReadyForOwnerReview(nextState, context.now, qaReportPath)
        nextState = ready.nextState
        stores.engineeringProjects.set(message.project_id, nextState)

        const approval = buildDeliveryApprovalRequest(nextState, context.now, {
          implementation_summary: ['Runtime integration flow executed successfully.'],
          qa_summary: ['QA report generated', 'Lifecycle advanced to qa'],
          residual_risks: ['Watch first live delivery for support issues.'],
          deployment_instructions: ['Promote packaged artifacts.'],
          artifact_ref: qaReportPath,
        })

        return {
          outgoing: [
            accepted.ack,
            accepted.pmUpdate,
            qa.pmUpdate,
            ready.pmUpdate,
            makeApprovalRequestMessage(
              'engineering_agent',
              message.project_id,
              context.now,
              approval,
            ),
          ],
          approvals: [approval],
        }
      }

      if (message.message_type === 'approval_response') {
        const response = asRecord(message.payload)['response'] as Approval_Response
        const state = stores.engineeringProjects.get(message.project_id)
        if (!state) {
          throw new Error(`Engineering state not found for ${message.project_id}`)
        }

        const request: Approval_Request = {
          request_id: `${message.project_id}:delivery_final:v${state.delivery_version}`,
          gate: 'delivery_final',
          from_agent: 'engineering_agent',
          timestamp: state.last_updated_at,
          project_id: message.project_id,
          summary: 'Delivery approval',
          recommendation: 'Approve',
          risks: [],
          options: ['approve', 'reject', 'revise'],
          artifact_ref: `${state.workspace_root}/artifacts/qa-report.md`,
        }

        const outcome = await handleEngineeringApprovalResponse(
          context.app.shell.app.getRegistry(),
          state,
          request,
          response,
        )
        stores.engineeringProjects.set(message.project_id, outcome.next_state)

        if (outcome.decision !== 'approve') {
          return { responses: [response] }
        }

        return {
          outgoing: [
            outcome.manager_message,
            outcome.support_message,
            outcome.delivered_message,
          ],
          responses: [response],
        }
      }

      return { notes: [`Engineering ignored ${message.message_type}.`] }
    },
  }

  const projectManagerAdapter: AgentAdapter = {
    agentType: 'project_manager_agent',
    executeMessage(message, context) {
      if (!stores.projectTimelines.has(message.project_id)) {
        stores.projectTimelines.set(
          message.project_id,
          createBaselineTimeline(message.project_id, context.now),
        )
      }
      const history = stores.projectHistory.get(message.project_id) ?? []
      history.push(
        createProjectHistoryEvent({
          project_id: message.project_id,
          event_type:
            message.message_type === 'risk_alert' ? 'risk_alert' : 'status_update',
          actor: message.from,
          summary:
            message.message_type === 'status_update'
              ? toNonEmptyString(
                  asRecord(message.payload)['summary'],
                  'Status update recorded',
                )
              : `${message.message_type} recorded`,
          created_at: context.now,
          metadata: {
            message_type: message.message_type,
          },
        }),
      )
      stores.projectHistory.set(message.project_id, history)

      if (message.from === 'ceo_agent') {
        context.app.shell.app.updateProject(message.project_id, {
          current_milestone: 'owner_directive_dispatched',
          updated_at: context.now,
        })
      }

      return { notes: [`PM recorded ${message.message_type}.`] }
    },
  }

  const supportAdapter: AgentAdapter = {
    agentType: 'support_agent',
    executeMessage() {
      app.shell.app.setSupportTicketCount(stores.supportTickets.size)
      return { notes: ['Support updated runtime context.'] }
    },
    executeTask(task, input, context) {
      if (task !== 'open_ticket') {
        return { notes: [`Support task ${task} ignored.`] }
      }

      const project = context.app.requireProject(
        toNonEmptyString(input['project_id'], ''),
      )
      const ticketInput: SupportTicketInput = {
        project_id: project.project_id,
        client_contact: toNonEmptyString(input['client_contact'], 'client@example.test'),
        summary: toNonEmptyString(input['summary'], 'Support request'),
        requested_outcome: toNonEmptyString(
          input['requested_outcome'],
          'Resolve the reported issue.',
        ),
        occurred_at: context.now,
        urgency:
          toNonEmptyString(input['urgency'], 'medium') as SupportTicketInput['urgency'],
        business_impact:
          toNonEmptyString(
            input['business_impact'],
            'medium',
          ) as SupportTicketInput['business_impact'],
      }

      const created = createSupportTicket(ticketInput, project, context.now)
      stores.supportTickets.set(created.ticket.ticket_id, created.ticket)
      app.shell.app.setSupportTicketCount(stores.supportTickets.size)
      return { notes: [`Support ticket ${created.ticket.ticket_id} opened.`] }
    },
  }

  return {
    ceo_agent: ceoAdapter,
    marketing_agent: marketingAdapter,
    sales_agent: salesAdapter,
    product_agent: productAdapter,
    engineering_agent: engineeringAdapter,
    project_manager_agent: projectManagerAdapter,
    support_agent: supportAdapter,
  }
}
