import type { AgentRegistry } from '../../registry/AgentRegistry.js'
import type { Approval_Request, Approval_Response } from '../../domain/types.js'
import { applyLifecycleUpdate } from '../project-manager/lifecycle.js'
import type {
  ApprovalOutcome,
  ApprovalRequestContext,
  DiscoveryHandoffMessage,
  DiscoveryHandoffPayload,
  EngineeringClarificationRequest,
  EngineeringImplementationStage,
  EngineeringProjectState,
  EngineeringRiskAlert,
  EngineeringStatusMessage,
} from './models.js'
import {
  appendAuditEntry,
  ensureWorkspaceStructure,
  getProjectWorkspaceRoot,
  saveRecoverySnapshot,
  writeWorkspaceArtifact,
} from './workspace.js'

function isNonEmptyStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string' && item.trim().length > 0)
}

export function createEngineeringProjectState(input: {
  project_id: string
  client_id: string
  workspace_root: string
  now: string
}): EngineeringProjectState {
  return {
    project_id: input.project_id,
    client_id: input.client_id,
    workspace_root: input.workspace_root,
    implementation_status: 'not_started',
    qa_status: 'not_started',
    delivery_version: 1,
    owner_review_status: 'not_requested',
    active_stage: 'handoff_intake',
    last_updated_at: input.now,
  }
}

export function validateDiscoveryHandoffPayload(
  payload: unknown,
): { ok: true; payload: DiscoveryHandoffPayload } | { ok: false; errors: string[] } {
  const errors: string[] = []
  const candidate = payload as Partial<DiscoveryHandoffPayload>

  if (!candidate?.spec_final?.title?.trim()) {
    errors.push('spec_final.title is required')
  }
  if (!candidate?.spec_final?.summary?.trim()) {
    errors.push('spec_final.summary is required')
  }
  if (!Array.isArray(candidate?.spec_final?.capabilities) || candidate!.spec_final!.capabilities.length === 0) {
    errors.push('spec_final.capabilities must contain at least one capability')
  }
  if (!isNonEmptyStringArray(candidate.acceptance_criteria)) {
    errors.push('acceptance_criteria is required')
  }
  if (!isNonEmptyStringArray(candidate.feature_priorities)) {
    errors.push('feature_priorities is required')
  }
  if (!isNonEmptyStringArray(candidate.tool_list)) {
    errors.push('tool_list is required')
  }
  if (!isNonEmptyStringArray(candidate.project_constraints)) {
    errors.push('project_constraints is required')
  }
  if (!isNonEmptyStringArray(candidate.implementation_risks)) {
    errors.push('implementation_risks is required')
  }
  if (!Array.isArray(candidate.approval_history) || candidate.approval_history.length === 0) {
    errors.push('approval_history is required')
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return { ok: true, payload: candidate as DiscoveryHandoffPayload }
}

export function buildImplementationStages(
  payload: DiscoveryHandoffPayload,
): EngineeringImplementationStage[] {
  return payload.spec_final.capabilities.map((capability, index) => ({
    stage_id: capability.capability_id,
    title: capability.title,
    summary: capability.description,
    dependencies: index === 0 ? [] : [payload.spec_final.capabilities[index - 1]!.capability_id],
    outputs: [`Implemented ${capability.title}`],
    risks: [...payload.implementation_risks],
    testing_strategy: payload.acceptance_criteria.map(
      criterion => `Validate against acceptance criterion: ${criterion}`,
    ),
    status: index === 0 ? 'in_progress' : 'pending',
  }))
}

export function buildImplementationPlanMarkdown(
  payload: DiscoveryHandoffPayload,
  stages: EngineeringImplementationStage[],
): string {
  const lines = [
    `# Implementation Plan`,
    '',
    `## Spec`,
    `- Title: ${payload.spec_final.title}`,
    `- Summary: ${payload.spec_final.summary}`,
    '',
    `## Priorities`,
    ...payload.feature_priorities.map(priority => `- ${priority}`),
    '',
    `## Constraints`,
    ...payload.project_constraints.map(constraint => `- ${constraint}`),
    '',
    `## Stages`,
  ]

  for (const stage of stages) {
    lines.push(`### ${stage.title}`)
    lines.push(`- Stage ID: ${stage.stage_id}`)
    lines.push(`- Summary: ${stage.summary}`)
    lines.push(`- Dependencies: ${stage.dependencies.join(', ') || 'none'}`)
    lines.push(`- Outputs: ${stage.outputs.join(', ')}`)
    lines.push(`- Risks: ${stage.risks.join(', ') || 'none'}`)
    lines.push(`- Testing: ${stage.testing_strategy.join(' | ')}`)
    lines.push(`- Status: ${stage.status}`)
    lines.push('')
  }

  return `${lines.join('\n')}\n`
}

export function collectClarificationQuestions(
  payload: DiscoveryHandoffPayload,
): string[] {
  const questions: string[] = []
  if (payload.spec_final.summary.length < 40) {
    questions.push('Mohon lengkapi ringkasan spec agar konteks implementasi lebih jelas.')
  }
  if (payload.tool_list.length === 0) {
    questions.push('Tool list untuk implementasi belum tersedia.')
  }
  return questions
}

export async function acceptDiscoveryHandoff(
  registry: AgentRegistry,
  input: {
    message: DiscoveryHandoffMessage
    state: EngineeringProjectState
    workspaceBaseDir: string
  },
): Promise<{
  ack: EngineeringStatusMessage
  pmUpdate: EngineeringStatusMessage
  nextState: EngineeringProjectState
  implementationPlanPath: string
}> {
  const validation = validateDiscoveryHandoffPayload(input.message.payload)
  if (!validation.ok) {
    throw new Error(`Invalid discovery handoff: ${validation.errors.join('; ')}`)
  }

  const project = registry.getProject(input.message.project_id)
  if (!project) {
    throw new Error(`Project not found: ${input.message.project_id}`)
  }

  const workspaceRoot = getProjectWorkspaceRoot(
    input.workspaceBaseDir,
    project.client_id,
    input.message.project_id,
  )
  await ensureWorkspaceStructure(workspaceRoot)

  const stages = buildImplementationStages(validation.payload)
  const implementationPlan = buildImplementationPlanMarkdown(validation.payload, stages)
  const implementationPlanPath = await writeWorkspaceArtifact(
    workspaceRoot,
    'artifacts/implementation-plan.md',
    implementationPlan,
  )

  applyLifecycleUpdate(registry, {
    project_id: input.message.project_id,
    event: 'build_started',
    actor: 'engineering_agent',
    timestamp: input.message.timestamp,
    milestone: 'implementation_started',
  })

  const nextState: EngineeringProjectState = {
    ...input.state,
    workspace_root: workspaceRoot,
    implementation_status: 'in_progress',
    active_stage: 'implementation_planning',
    last_updated_at: input.message.timestamp,
  }

  await appendAuditEntry(workspaceRoot, {
    timestamp: input.message.timestamp,
    kind: 'handoff',
    detail: `discovery_handoff accepted for ${input.message.project_id}`,
  })
  await saveRecoverySnapshot(workspaceRoot, {
    project_id: input.message.project_id,
    active_stage: nextState.active_stage,
    context: {
      implementationPlanPath,
      specTitle: validation.payload.spec_final.title,
    },
    saved_at: input.message.timestamp,
  })

  return {
    ack: {
      from: 'engineering_agent',
      to: 'product_agent',
      message_type: 'status_update',
      project_id: input.message.project_id,
      timestamp: input.message.timestamp,
      payload: {
        status: 'handoff_received',
        summary: 'Discovery handoff diterima dan implementasi dimulai.',
        artifact_ref: implementationPlanPath,
      },
    },
    pmUpdate: {
      from: 'engineering_agent',
      to: 'project_manager_agent',
      message_type: 'status_update',
      project_id: input.message.project_id,
      timestamp: input.message.timestamp,
      payload: {
        status: 'implementation_started',
        summary: 'Engineering memulai implementation planning.',
        artifact_ref: implementationPlanPath,
      },
    },
    nextState,
    implementationPlanPath,
  }
}

export function buildClarificationRequest(
  projectId: string,
  timestamp: string,
  questions: string[],
): EngineeringClarificationRequest {
  return {
    from: 'engineering_agent',
    to: 'product_agent',
    message_type: 'clarification_request',
    project_id: projectId,
    timestamp,
    payload: {
      questions,
      blocking_stage: 'awaiting_clarification',
    },
  }
}

export async function startQaValidation(
  registry: AgentRegistry,
  state: EngineeringProjectState,
  timestamp: string,
): Promise<{ nextState: EngineeringProjectState; pmUpdate: EngineeringStatusMessage }> {
  applyLifecycleUpdate(registry, {
    project_id: state.project_id,
    event: 'final_validation_started',
    actor: 'engineering_agent',
    timestamp,
    milestone: 'qa_started',
  })

  const nextState: EngineeringProjectState = {
    ...state,
    implementation_status: 'completed',
    qa_status: 'in_progress',
    active_stage: 'qa_in_progress',
    last_updated_at: timestamp,
  }

  await appendAuditEntry(state.workspace_root, {
    timestamp,
    kind: 'test',
    detail: 'qa_started',
  })

  return {
    nextState,
    pmUpdate: {
      from: 'engineering_agent',
      to: 'project_manager_agent',
      message_type: 'status_update',
      project_id: state.project_id,
      timestamp,
      payload: {
        status: 'qa_started',
        summary: 'Engineering memasuki validasi QA akhir.',
      },
    },
  }
}

export async function writeQaReport(
  state: EngineeringProjectState,
  input: {
    unitTests: string[]
    integrationTests: string[]
    staticChecks: string[]
    knownLimitations: string[]
    deploymentNotes: string[]
  },
): Promise<string> {
  const content = [
    '# QA Report',
    '',
    '## Unit Tests',
    ...input.unitTests.map(item => `- ${item}`),
    '',
    '## Integration Tests',
    ...input.integrationTests.map(item => `- ${item}`),
    '',
    '## Static Checks',
    ...input.staticChecks.map(item => `- ${item}`),
    '',
    '## Known Limitations',
    ...input.knownLimitations.map(item => `- ${item}`),
    '',
    '## Deployment Notes',
    ...input.deploymentNotes.map(item => `- ${item}`),
    '',
  ].join('\n')

  const reportPath = await writeWorkspaceArtifact(
    state.workspace_root,
    'artifacts/qa-report.md',
    `${content}\n`,
  )
  await appendAuditEntry(state.workspace_root, {
    timestamp: state.last_updated_at,
    kind: 'artifact',
    detail: 'qa-report.md written',
  })
  return reportPath
}

export async function markReadyForOwnerReview(
  state: EngineeringProjectState,
  timestamp: string,
  artifactRef: string,
): Promise<{ nextState: EngineeringProjectState; pmUpdate: EngineeringStatusMessage }> {
  const nextState: EngineeringProjectState = {
    ...state,
    qa_status: 'passed',
    owner_review_status: 'pending',
    active_stage: 'awaiting_owner_delivery_approval',
    last_updated_at: timestamp,
  }
  await appendAuditEntry(state.workspace_root, {
    timestamp,
    kind: 'approval',
    detail: 'ready_for_owner_review',
  })
  return {
    nextState,
    pmUpdate: {
      from: 'engineering_agent',
      to: 'project_manager_agent',
      message_type: 'status_update',
      project_id: state.project_id,
      timestamp,
      payload: {
        status: 'ready_for_owner_review',
        summary: 'Deliverable siap untuk owner review.',
        artifact_ref: artifactRef,
      },
    },
  }
}

export function buildDeliveryApprovalRequest(
  state: EngineeringProjectState,
  timestamp: string,
  context: ApprovalRequestContext,
): Approval_Request {
  return {
    request_id: `${state.project_id}:delivery_final:v${state.delivery_version}`,
    gate: 'delivery_final',
    from_agent: 'engineering_agent',
    timestamp,
    project_id: state.project_id,
    summary: context.implementation_summary.join(' '),
    recommendation: 'Approve delivery if QA evidence and deployment plan are acceptable.',
    risks: [...context.residual_risks],
    options: ['approve', 'reject', 'revise'],
    artifact_ref: context.artifact_ref,
  }
}

export async function handleApprovalResponse(
  registry: AgentRegistry,
  state: EngineeringProjectState,
  request: Approval_Request,
  response: Approval_Response,
): Promise<ApprovalOutcome> {
  if (request.gate !== 'delivery_final' || response.gate !== 'delivery_final') {
    throw new Error('Engineering approval flow only supports delivery_final gate')
  }
  if (request.request_id !== response.request_id) {
    throw new Error('Approval response request_id mismatch')
  }

  await appendAuditEntry(state.workspace_root, {
    timestamp: response.timestamp,
    kind: 'approval',
    detail: `approval_response:${response.decision}`,
  })

  if (response.decision === 'approve') {
    applyLifecycleUpdate(registry, {
      project_id: state.project_id,
      event: 'delivery_approved',
      actor: 'engineering_agent',
      timestamp: response.timestamp,
      milestone: 'delivered',
    })
    const nextState: EngineeringProjectState = {
      ...state,
      owner_review_status: 'approved',
      active_stage: 'delivery_completed',
      last_updated_at: response.timestamp,
    }
    return {
      decision: 'approve',
      request,
      response,
      manager_message: {
        from: 'engineering_agent',
        to: 'project_manager_agent',
        message_type: 'status_update',
        project_id: state.project_id,
        timestamp: response.timestamp,
        payload: {
          status: 'delivered',
          summary: 'Owner menyetujui delivery final.',
          artifact_ref: request.artifact_ref,
        },
      },
      support_message: {
        from: 'engineering_agent',
        to: 'support_agent',
        message_type: 'status_update',
        project_id: state.project_id,
        timestamp: response.timestamp,
        payload: {
          status: 'delivered',
          summary: 'Context package delivery final siap untuk support.',
          artifact_ref: request.artifact_ref,
        },
      },
      delivered_message: {
        from: 'engineering_agent',
        to: 'project_manager_agent',
        message_type: 'status_update',
        project_id: state.project_id,
        timestamp: response.timestamp,
        payload: {
          status: 'delivered',
          summary: 'Lifecycle project berubah ke delivered.',
          artifact_ref: request.artifact_ref,
        },
      },
      next_state: nextState,
    }
  }

  const nextState: EngineeringProjectState = {
    ...state,
    owner_review_status: response.decision === 'revise' ? 'revise_requested' : 'rejected',
    delivery_version: response.decision === 'revise' ? state.delivery_version + 1 : state.delivery_version,
    active_stage: response.decision === 'revise' ? 'delivery_revision' : 'implementation_in_progress',
    last_updated_at: response.timestamp,
  }
  return {
    decision: response.decision,
    request,
    response,
    next_state: nextState,
  }
}

export function buildUnrecoverableErrorAlert(
  state: EngineeringProjectState,
  timestamp: string,
  error: Error,
): EngineeringRiskAlert[] {
  return [
    {
      from: 'engineering_agent',
      to: 'project_manager_agent',
      message_type: 'risk_alert',
      project_id: state.project_id,
      timestamp,
      payload: {
        severity: 'critical',
        summary: error.message,
        recommended_action: 'Escalate blocker and review recovery snapshot.',
        recovery_artifact_ref: `${state.workspace_root}/audit/recovery-snapshot.json`,
      },
    },
    {
      from: 'engineering_agent',
      to: 'ceo_agent',
      message_type: 'risk_alert',
      project_id: state.project_id,
      timestamp,
      payload: {
        severity: 'critical',
        summary: error.message,
        recommended_action: 'Owner attention required for unrecoverable engineering blocker.',
        recovery_artifact_ref: `${state.workspace_root}/audit/recovery-snapshot.json`,
      },
    },
  ]
}
