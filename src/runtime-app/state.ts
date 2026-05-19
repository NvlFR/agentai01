import type { CompanyDashboardReadModel } from '../app/dashboardReadModel.js'
import type { CompanySnapshotSeed } from '../app/companySnapshot.js'
import { UnifiedSqlRuntimeRepository } from './storage/sql/sqlRepository.js'
import { spawnSync } from 'node:child_process'
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { CeoRuntime } from '../agents/ceo/runtime.js'
import type { OwnerCommand } from '../agents/ceo/models.js'
import { executeWorkspaceCapability } from './capabilities.js'
import {
  createLowPriorityExtensionRegistry,
  type ExtensionSnapshot,
} from './extensions/index.js'
import type {
  Agent_Message,
  AgentType,
  ApprovalDecision,
  Approval_Gate,
  Approval_Request,
  Approval_Response,
  LifecycleEvent,
  Lifecycle_State,
  MessageType,
} from '../domain/types.js'
import type {
  AuditLogEntry,
  CommunicationLogEntry,
  ProjectStateSnapshot,
} from '../registry/AgentRegistry.js'
import {
  bootOrchestratorShell,
  type OrchestratorShell,
  type RuntimeWorkerDescriptor,
} from '../runtime/orchestrator.js'
import type { RuntimeAppConfig } from './config.js'
import { getSubprocessEnvironment } from './config.js'

export type RuntimeJobKind =
  | 'message_dispatch'
  | 'handoff_retry'
  | 'approval_followup'
  | 'sla_scan'
  | 'heartbeat_scan'
  | 'report_generate'

export type RuntimeJobStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'retrying'

export type RuntimeJob = {
  job_id: string
  kind: RuntimeJobKind
  status: RuntimeJobStatus
  attempts: number
  max_attempts: number
  detail: string
  project_id?: string
  worker_id?: string
  scheduled_at: string
  started_at?: string
  finished_at?: string
  error?: string
}

export type OperatorAuditEntry = {
  timestamp: string
  action: string
  actor: string
  target: string
  detail: string
}

export type ProjectDetailSnapshot = {
  project: CompanyDashboardReadModel['projects'][number]
  history: ProjectStateSnapshot[]
  approvals: Approval_Request[]
  messages: CommunicationLogEntry[]
  jobs: RuntimeJob[]
}

export type RuntimeAppSnapshot = {
  generated_at: string
  dashboard: CompanyDashboardReadModel
  approvals: Approval_Request[]
  jobs: RuntimeJob[]
  messages: CommunicationLogEntry[]
  audit: OperatorAuditEntry[]
  projects: CompanyDashboardReadModel['projects']
  project_details: ProjectDetailSnapshot[]
  health: ReturnType<CeoRuntime['getHealthStatus']>
  readiness: ReturnType<CeoRuntime['getReadinessStatus']> & {
    reasons: string[]
    checklist: string[]
  }
  runtime: {
    runtime_id: string
    mode: string
    shell_status: OrchestratorShell['status']
    workers: RuntimeWorkerDescriptor[]
    started_at: string
  }
  environment: {
    env: RuntimeAppConfig['env']
    port: number
    ai_base_url: string
    ai_model: string
    ai_api_key_masked: string
  }
  extensions: ExtensionSnapshot[]
}

export type DirectiveSubmission = {
  input: string
  mode?: 'natural' | 'structured'
  confirm?: boolean
}

export type ApprovalResponseSubmission = {
  decision: ApprovalDecision
  notes?: string
  confirm?: boolean
}

export type ActionResult = {
  ok: boolean
  message: string
  requires_confirmation?: boolean
  artifactPath?: string
  snapshot: RuntimeAppSnapshot
}

type RetryMessageRecord = {
  original: Agent_Message
  retries: number
}

type RuntimeRunbookAction = 'check' | 'tests' | 'smoke'

export class RuntimeAppState {
  readonly config: RuntimeAppConfig
  readonly shell: OrchestratorShell
  readonly ceoRuntime: CeoRuntime
  readonly repository: UnifiedSqlRuntimeRepository
  readonly initPromise: Promise<void>

  private readonly jobs: RuntimeJob[]
  private readonly operatorAudit: OperatorAuditEntry[] = []
  private readonly approvalTimeline: Array<Approval_Request | Approval_Response> = []
  private readonly rejectedMessages: Map<string, RetryMessageRecord> = new Map()
  private readonly extensionRegistry = createLowPriorityExtensionRegistry()

  constructor(config: RuntimeAppConfig) {
    this.config = config
    this.shell = bootOrchestratorShell({
      shell_id: 'runtime-operator-shell',
      runtime: {
        runtime_id: 'runtime-dev-01',
        mode: 'local',
        workers: createWorkers(),
      },
      seed: createSeed(),
      notes: ['In-memory operator shell for local development.'],
    })
    this.ceoRuntime = new CeoRuntime(this.shell.app.getRegistry(), 'ceo-agent', {
      config: {
        owner_auth: {
          owner_id: 'owner',
          allowed_token_ids: [config.operatorToken],
          failed_attempt_threshold: 5,
          failed_attempt_window_seconds: 60,
          temporary_lock_minutes: 15,
        },
      },
      now: '2026-05-14T09:00:00.000Z',
    })
    this.jobs = createJobs()

    const repository = new UnifiedSqlRuntimeRepository(
      config.storage.mode,
      config.storage.databaseUrl,
      path.join(config.storage.operationalRoot, 'state.db')
    )
    this.repository = repository

    seedApprovals(this.shell, this.approvalTimeline)
    seedMessages(this.shell, this.rejectedMessages)
    seedCeoRuntime(this.ceoRuntime)
    this.audit('runtime_boot', 'operator-ui', this.shell.runtime.runtime_id, 'Runtime app state initialized.')

    this.initPromise = (async () => {
      await repository.init()
      await this.initPersistence()
    })()
  }

  getSnapshot(now = new Date().toISOString()): RuntimeAppSnapshot {
    const dashboard = this.shell.readDashboard(now)
    const readiness = this.ceoRuntime.getReadinessStatus(now)
    const projectDetails = dashboard.projects.map(project => ({
      project,
      history: this.shell.app.getRegistry().getProjectHistory(project.project_id),
      approvals: this.shell
        .buildSnapshot(now)
        .pending_approvals
        .filter(approval => approval.project_id === project.project_id),
      messages: this.shell
        .app
        .getRegistry()
        .getCommunicationLog()
        .filter(entry => entry.message.project_id === project.project_id),
      jobs: this.jobs.filter(job => job.project_id === project.project_id),
    }))

    return {
      generated_at: now,
      dashboard,
      approvals: this.shell.buildSnapshot(now).pending_approvals,
      jobs: this.jobs.map(cloneJob),
      messages: this.shell.app.getRegistry().getCommunicationLog(),
      audit: this.getMergedAudit(now),
      projects: dashboard.projects,
      project_details: projectDetails,
      health: this.ceoRuntime.getHealthStatus(now),
      readiness: {
        ...readiness,
        ready: readiness.ready && this.config.readiness.ready,
        reasons: [...this.config.readiness.reasons],
        checklist: [...this.config.readiness.checklist],
      },
      runtime: {
        runtime_id: this.shell.runtime.runtime_id,
        mode: this.shell.runtime.mode,
        shell_status: this.shell.status,
        workers: this.shell.runtime.workers.map(worker => ({ ...worker })),
        started_at: this.shell.runtime.started_at,
      },
      environment: {
        env: this.config.env,
        port: this.config.port,
        ai_base_url: this.config.ai.baseUrl,
        ai_model: this.config.ai.model,
        ai_api_key_masked: this.config.ai.apiKey ? redact(this.config.ai.apiKey) : '(missing)',
      },
      extensions: this.extensionRegistry.list(),
    }
  }

  getApprovalTimeline(): Array<Approval_Request | Approval_Response> {
    return [...this.approvalTimeline]
  }

  recordOperatorAction(action: string, detail: string): void {
    this.audit(action, 'operator-ui', this.shell.runtime.runtime_id, detail)
  }

  submitDirective(input: DirectiveSubmission): ActionResult {
    const trimmed = input.input.trim()
    if (!trimmed) {
      return this.result(false, 'Directive cannot be empty.')
    }

    const now = new Date().toISOString()

    const parsed = this.ceoRuntime.parseOwnerCommand(
      trimmed,
      input.mode ?? 'natural',
      now,
    )

    if (parsed.kind === 'parsed') {
      if (parsed.command.command_type === 'activity') {
        return this.describeCurrentActivity(now)
      }
      if (parsed.command.command_type === 'runbook') {
        return this.executeRunbookDirective(parsed.command, now)
      }
      if (parsed.command.command_type === 'workspace') {
        return this.executeWorkspaceDirective(parsed.command, now)
      }
      if (parsed.command.command_type === 'project_admin') {
        return this.executeProjectAdminDirective(parsed.command, now, input.confirm)
      }

      const risky =
        this.ceoRuntime
          .getRuntimeConfig()
          .commands_requiring_confirmation
          .includes(parsed.command.command_type)
      if (risky && !input.confirm) {
        return this.result(false, 'Directive requires confirmation before execution.', true)
      }
    }

    const execution = this.ceoRuntime.executeOwnerDirective(
      trimmed,
      {
        actor_id: 'owner',
        token_id: this.config.operatorToken,
        authenticated: true,
      },
      input.mode ?? 'natural',
      now,
    )

    this.audit(
      'directive_submitted',
      'owner',
      execution.directive.directive_id,
      execution.response,
    )

    return this.result(
      execution.ok,
      execution.response,
    )
  }

  respondToApproval(
    requestId: string,
    submission: ApprovalResponseSubmission,
  ): ActionResult {
    const pending = this.shell
      .buildSnapshot()
      .pending_approvals
      .find(approval => approval.request_id === requestId)

    if (!pending) {
      return this.result(false, `Approval not found: ${requestId}`)
    }

    if ((submission.decision === 'reject' || submission.decision === 'revise') && !submission.confirm) {
      return this.result(
        false,
        `Decision ${submission.decision} requires confirmation because it can block delivery.`,
        true,
      )
    }

    const response: Approval_Response = {
      request_id: pending.request_id,
      gate: pending.gate,
      timestamp: new Date().toISOString(),
      decision: submission.decision,
      notes: submission.notes,
    }

    this.shell.applyApprovalResponse(response)
    this.approvalTimeline.push(response)

    const linkedJob = this.jobs.find(
      job =>
        job.kind === 'approval_followup' &&
        job.project_id === pending.project_id &&
        job.status !== 'completed',
    )

    if (linkedJob) {
      linkedJob.status = 'completed'
      linkedJob.finished_at = response.timestamp
      linkedJob.error = undefined
    }

    this.audit(
      'approval_response',
      'owner',
      pending.request_id,
      `${submission.decision} for ${pending.summary}${submission.notes ? ` (${submission.notes})` : ''}`,
    )

    return this.result(true, `Approval ${submission.decision} recorded.`)
  }

  retryJob(jobId: string, confirm = false): ActionResult {
    const job = this.jobs.find(item => item.job_id === jobId)
    if (!job) {
      return this.result(false, `Job not found: ${jobId}`)
    }

    if (job.status !== 'failed') {
      return this.result(false, `Job ${jobId} is not failed.`)
    }

    if (!confirm) {
      return this.result(
        false,
        `Retrying ${jobId} can re-run operational side effects. Confirm to continue.`,
        true,
      )
    }

    const now = new Date().toISOString()
    job.status = 'retrying'
    job.attempts += 1
    job.started_at = now
    job.finished_at = undefined
    job.error = undefined
    job.detail = `${job.detail} Retried from operator UI.`

    if (job.kind === 'handoff_retry' || job.kind === 'message_dispatch') {
      job.status = 'completed'
      job.finished_at = now
      job.detail = `${job.detail} Retry completed successfully.`
    }

    this.audit('job_retry', 'operator-ui', jobId, `Job retried (${job.kind}).`)
    return this.result(true, `Job ${jobId} retried.`)
  }

  retryMessage(logId: string, confirm = false): ActionResult {
    const rejected = this.rejectedMessages.get(logId)
    if (!rejected) {
      return this.result(false, `Rejected message not found: ${logId}`)
    }

    if (!confirm) {
      return this.result(
        false,
        `Retrying rejected message ${logId} can re-dispatch cross-agent traffic. Confirm to continue.`,
        true,
      )
    }

    const retriedMessage: Agent_Message = {
      ...rejected.original,
      timestamp: new Date().toISOString(),
    }

    const reroute = this.shell.routeMessage(retriedMessage)
    rejected.retries += 1

    this.audit(
      'message_retry',
      'operator-ui',
      logId,
      reroute.allowed ? 'Rejected message rerouted successfully.' : reroute.reason,
    )

    if (reroute.allowed) {
      return this.result(true, `Message ${logId} retried successfully.`)
    }

    return this.result(false, reroute.reason)
  }

  private result(
    ok: boolean,
    message: string,
    requires_confirmation = false,
    artifactPath?: string,
  ): ActionResult {
    const snapshot = this.getSnapshot()
    persistOperationalSnapshot(this.config.env, snapshot)
    this.saveAllToPersistence().catch(err => console.warn('Failed to save state to DB', err))
    return {
      ok,
      message,
      requires_confirmation,
      artifactPath,
      snapshot,
    }
  }

  async saveAllToPersistence(): Promise<void> {
    await this.repository.init()

    // Save projects
    const registry = this.shell.app.getRegistry()
    for (const project of registry.listProjects()) {
      await this.repository.saveProject({
        project_id: project.project_id,
        client_id: project.client_id,
        lifecycle_state: project.lifecycle_state,
        current_milestone: project.current_milestone,
        active_agent_ids: project.active_agent_ids,
        updated_at: new Date().toISOString(),
      })
    }

    // Save approvals
    for (const item of this.approvalTimeline) {
      if ('gate' in item) {
        const requestId = item.request_id
        if ('summary' in item) {
          // Request
          const resp = this.approvalTimeline.find(x => !('summary' in x) && x.request_id === requestId) as Approval_Response | undefined
          await this.repository.saveApproval({
            request_id: item.request_id,
            project_id: item.project_id || 'proj-acme-web',
            gate: item.gate,
            from_agent: item.from_agent,
            timestamp: item.timestamp,
            summary: item.summary,
            recommendation: item.recommendation,
            risks: item.risks,
            options: [...item.options],
            artifact_ref: item.artifact_ref,
            decision: resp?.decision,
            decision_notes: resp?.notes,
            decision_timestamp: resp?.timestamp,
            decision_actor: 'owner',
          })
        }
      }
    }

    // Save jobs
    for (const job of this.jobs) {
      await this.repository.saveJob(job)
    }

    // Save rejected messages and communication log
    const commLog = registry.getCommunicationLog()
    for (const log of commLog) {
      const isRejected = Array.from(this.rejectedMessages.values()).some(rm => rm.original.timestamp === log.message.timestamp)
      await this.repository.saveMessage({
        message_id: log.log_id,
        project_id: log.message.project_id,
        from_agent: log.message.from,
        to_agent: log.message.to,
        message_type: log.message.message_type,
        timestamp: log.message.timestamp,
        payload: log.message.payload,
        status: isRejected ? 'rejected' : 'delivered',
        retries: 0,
      })
    }

    // Save audit log
    for (const entry of this.operatorAudit) {
      await this.repository.saveAuditEntry({
        audit_id: `audit-${entry.timestamp}-${Math.random().toString(36).slice(2)}`,
        ...entry,
      })
    }

    // Save decisions
    for (const dec of this.ceoRuntime.listDecisions()) {
      await this.repository.saveDecision({
        decision_id: dec.decision_id,
        timestamp: dec.timestamp,
        category: dec.category,
        context: dec.context,
        options_considered: dec.options_considered,
        chosen_option: dec.chosen_option,
        rationale: dec.rationale,
        expected_impact: dec.expected_impact,
        related_project_ids: dec.related_project_ids,
        related_agent_ids: dec.related_agent_ids as string[],
      })
    }

    // Save delegations
    for (const del of this.ceoRuntime.listDelegations()) {
      await this.repository.saveDelegation({
        task_id: del.task_id,
        target_agent: del.target_agent,
        instructions: del.instructions,
        priority: del.priority,
        success_criteria: del.success_criteria,
        project_id: del.project_id || 'proj-acme-web',
        status: (del.status === 'completed' ? 'completed' : del.status === 'failed' ? 'failed' : 'pending'),
        assigned_worker: del.assigned_agent_id || 'worker',
        notes: del.latest_result_summary || del.failure_reason || '',
        timestamp: del.created_at,
      })
    }
  }

  async initPersistence(): Promise<void> {
    // 1. Try to load from database
    const dbProjects = await this.repository.loadProjects()
    const dbApprovals = await this.repository.loadApprovals()
    const dbJobs = await this.repository.loadJobs()
    const dbMessages = await this.repository.loadMessages()
    const dbAudit = await this.repository.loadAuditEntries()
    const dbDecisions = await this.repository.loadDecisions()
    const dbDelegations = await this.repository.loadDelegations()

    // 2. If data exists in the database, reconstruct the in-memory arrays and objects from it!
    if (dbProjects.length > 0) {
      const registry = this.shell.app.getRegistry()
      for (const p of dbProjects) {
        registry.registerProject({
          project_id: p.project_id,
          client_id: p.client_id,
          lifecycle_state: p.lifecycle_state as any,
          current_milestone: p.current_milestone,
          active_agent_ids: p.active_agent_ids,
          updated_at: p.updated_at || new Date().toISOString(),
        })
      }
    } else {
      // Database is empty! Seed the database immediately so that it is persisted!
      await this.saveAllToPersistence()
      return
    }

    if (dbApprovals.length > 0) {
      this.approvalTimeline.length = 0
      for (const approval of dbApprovals) {
        const req: Approval_Request = {
          request_id: approval.request_id,
          gate: approval.gate as Approval_Gate,
          from_agent: approval.from_agent as any,
          timestamp: approval.timestamp,
          project_id: approval.project_id,
          summary: approval.summary,
          recommendation: approval.recommendation,
          risks: approval.risks,
          options: approval.options as readonly ApprovalDecision[],
          artifact_ref: approval.artifact_ref,
        }
        this.shell.recordApprovalRequest(req)
        this.approvalTimeline.push(req)

        if (approval.decision) {
          const res: Approval_Response = {
            request_id: approval.request_id,
            gate: approval.gate as Approval_Gate,
            timestamp: approval.decision_timestamp!,
            decision: approval.decision as any,
            notes: approval.decision_notes || '',
          }
          this.shell.applyApprovalResponse(res)
          this.approvalTimeline.push(res)
        }
      }
    }

    if (dbJobs.length > 0) {
      this.jobs.length = 0
      for (const job of dbJobs) {
        this.jobs.push(job)
      }
    }

    if (dbMessages.length > 0) {
      this.rejectedMessages.clear()
      const registry = this.shell.app.getRegistry()
      for (const msg of dbMessages) {
        if (msg.status === 'rejected') {
          this.rejectedMessages.set(msg.message_id, {
            original: {
              from: msg.from_agent as any,
              to: msg.to_agent as any,
              message_type: msg.message_type as MessageType,
              project_id: msg.project_id || 'proj-acme-web',
              timestamp: msg.timestamp,
              payload: msg.payload,
            },
            retries: msg.retries,
          })
        }
        registry.routeMessage({
          from: msg.from_agent as any,
          to: msg.to_agent as any,
          message_type: msg.message_type as any,
          project_id: msg.project_id || 'proj-acme-web',
          timestamp: msg.timestamp,
          payload: msg.payload,
        })
      }
    }

    if (dbAudit.length > 0) {
      this.operatorAudit.length = 0
      for (const entry of dbAudit) {
        this.operatorAudit.push(entry)
      }
    }

    if (dbDecisions.length > 0) {
      for (const dec of dbDecisions) {
        this.ceoRuntime.recordDecision({
          decision_id: dec.decision_id,
          timestamp: dec.timestamp,
          category: dec.category as any,
          context: dec.context,
          options_considered: dec.options_considered,
          chosen_option: dec.chosen_option,
          rationale: dec.rationale,
          expected_impact: dec.expected_impact,
          related_project_ids: dec.related_project_ids,
          related_agent_ids: dec.related_agent_ids as any[],
        })
      }
    }

    if (dbDelegations.length > 0) {
      for (const del of dbDelegations) {
        this.ceoRuntime.createDelegationTask({
          task_id: del.task_id,
          target_agent: del.target_agent as any,
          instructions: del.instructions,
          priority: del.priority as any,
          success_criteria: del.success_criteria,
          project_id: del.project_id,
        }, del.timestamp)

        if (del.status === 'completed') {
          this.ceoRuntime.completeDelegationTask({
            task_id: del.task_id,
            actor_agent_id: del.assigned_worker || 'worker',
            result_summary: del.notes || '',
          }, del.timestamp)
        } else if (del.status === 'failed') {
          this.ceoRuntime.failDelegationTask(del.task_id, del.assigned_worker || 'worker', del.notes || '', del.timestamp)
        }
      }
    }
  }

  private executeRunbookDirective(
    command: OwnerCommand,
    now: string,
  ): ActionResult {
    const action = normalizeRunbookAction(command.parameters['action'])
    if (!action) {
      return this.result(
        false,
        'Runbook action tidak dikenali. Gunakan salah satu: check, tests, smoke.',
      )
    }

    const directive = this.ceoRuntime.recordDirective(command, 'executing', now)
    const run = runWorkspaceCommand(action)
    const artifactPath = writeRunbookArtifact({
      env: this.config.env,
      directiveId: directive.directive_id,
      action,
      startedAt: now,
      ok: run.exitCode === 0,
      exitCode: run.exitCode,
      output: run.output,
    })

    this.ceoRuntime.updateDirectiveStatus(
      directive.directive_id,
      run.exitCode === 0 ? 'completed' : 'failed',
    )

    const excerpt = summarizeCommandOutput(run.output)

    this.audit(
      'directive_submitted',
      'owner',
      directive.directive_id,
      `runbook ${action} -> exit=${run.exitCode}`,
    )

    return this.result(
      run.exitCode === 0,
      [
        `Runbook ${action} ${run.exitCode === 0 ? 'berhasil' : 'gagal'}.`,
        `Exit code: ${run.exitCode ?? 'unknown'}`,
        `Artifact: ${artifactPath}`,
        excerpt ? `Output ringkas:\n${excerpt}` : '',
      ]
        .filter(Boolean)
        .join('\n\n'),
      false,
      artifactPath,
    )
  }

  private executeWorkspaceDirective(
    command: OwnerCommand,
    now: string,
  ): ActionResult {
    const directive = this.ceoRuntime.recordDirective(command, 'executing', now)
    const execution = executeWorkspaceCapability({
      command,
      env: this.config.env,
      now,
    })

    this.ceoRuntime.updateDirectiveStatus(
      directive.directive_id,
      execution.ok ? 'completed' : 'failed',
    )

    this.audit(
      'directive_submitted',
      'owner',
      directive.directive_id,
      `${command.command_type} ${String(command.parameters['action'] ?? 'unknown')} -> ${execution.ok ? 'ok' : 'failed'}`,
    )

    return this.result(
      execution.ok,
      [
        execution.summary,
        `Artifact: ${execution.artifactPath}`,
        execution.output ? `Output ringkas:\n${summarizeCommandOutput(execution.output)}` : '',
      ]
        .filter(Boolean)
        .join('\n\n'),
      false,
      execution.artifactPath,
    )
  }

  private executeProjectAdminDirective(
    command: OwnerCommand,
    now: string,
    confirm = false,
  ): ActionResult {
    const action = String(command.parameters['action'] ?? 'unknown')
    if (action !== 'close_all_projects') {
      return this.result(false, `Project admin action tidak dikenali: ${action}`)
    }

    if (!confirm) {
      return this.result(
        false,
        'Aksi ini akan menutup semua proyek aktif dan melepas assignment agent dari proyek. Ulangi dengan konfirmasi untuk melanjutkan.',
        true,
      )
    }

    const projects = this.shell.app.getRegistry().listProjects()
    const activeProjects = projects.filter(project => project.lifecycle_state !== 'closed')
    const closedProjectIds: string[] = []

    for (const project of activeProjects) {
      this.shell.app.getRegistry().updateProject(project.project_id, {
        lifecycle_state: 'closed',
        active_agent_ids: [],
        current_milestone: 'closed_by_owner_directive',
        updated_at: now,
      })
      closedProjectIds.push(project.project_id)
    }

    for (const agent of this.shell.app.getRegistry().listAgents()) {
      if (agent.current_project_id) {
        this.shell.app.getRegistry().updateAgent(agent.agent_id, {
          current_project_id: undefined,
          status: agent.agent_type === 'ceo_agent' ? agent.status : 'idle',
          last_activity_timestamp: now,
        })
      }
    }

    for (const worker of this.shell.runtime.workers) {
      if (worker.project_id) {
        worker.project_id = undefined
      }
      if (worker.status === 'busy') {
        worker.status = 'ready'
      }
    }

    this.audit(
      'project_admin_close_all',
      'owner',
      this.shell.runtime.runtime_id,
      `Closed projects: ${closedProjectIds.join(', ') || '(none)'}`,
    )

    return this.result(
      true,
      [
        'Semua proyek aktif berhasil ditutup.',
        `Total proyek ditutup: ${closedProjectIds.length}`,
        closedProjectIds.length > 0 ? `Project: ${closedProjectIds.join(', ')}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
    )
  }

  private describeCurrentActivity(now: string): ActionResult {
    const activeJobs = this.jobs.filter(job =>
      job.status === 'running' || job.status === 'retrying' || job.status === 'queued',
    )
    const latestAudit = this.getMergedAudit(now).slice(0, 5)

    const lines = [
      '# Current Activity',
      '',
      `Generated: ${now}`,
      '',
      '## Active Jobs',
      ...(activeJobs.length > 0
        ? activeJobs.map(job => `- ${job.job_id} · ${job.status} · ${job.kind}${job.project_id ? ` · ${job.project_id}` : ''}`)
        : ['- Tidak ada job aktif saat ini.']),
      '',
      '## Recent Activity',
      ...(latestAudit.length > 0
        ? latestAudit.map(entry => `- ${entry.timestamp} · ${entry.action} · ${entry.detail}`)
        : ['- Belum ada aktivitas tercatat.']),
    ]

    return this.result(true, lines.join('\n'))
  }

  private audit(action: string, actor: string, target: string, detail: string): void {
    const entry = {
      timestamp: new Date().toISOString(),
      action,
      actor,
      target,
      detail,
    }
    this.operatorAudit.unshift(entry)
    appendOperationalAudit(this.config.env, entry)
  }

  private getMergedAudit(now: string): OperatorAuditEntry[] {
    const registryAudit = this.shell
      .app
      .getRegistry()
      .getAuditLog()
      .slice(-20)
      .reverse()
      .map(entry => fromRegistryAudit(entry))
    const ceoAudit = this.ceoRuntime
      .getAuditLog(20)
      .map(entry => ({
        timestamp: entry.timestamp,
        action: entry.action_type,
        actor: entry.actor,
        target: entry.target,
        detail: JSON.stringify(entry.parameters),
      }))

    return [
      ...this.operatorAudit,
      ...ceoAudit,
      ...registryAudit,
      {
        timestamp: now,
        action: 'readiness_state',
        actor: 'runtime-app',
        target: this.shell.runtime.runtime_id,
        detail: this.config.readiness.ready
          ? 'Runtime reports ready.'
          : this.config.readiness.reasons.join(' '),
      },
    ]
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
      .slice(0, 40)
  }
}

function normalizeRunbookAction(value: unknown): RuntimeRunbookAction | undefined {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : ''
  switch (normalized) {
    case 'check':
      return 'check'
    case 'test':
    case 'tests':
      return 'tests'
    case 'smoke':
      return 'smoke'
    default:
      return undefined
  }
}

function runWorkspaceCommand(action: RuntimeRunbookAction): {
  exitCode: number | null
  output: string
} {
  const command = resolveRunbookCommand(action)
  const result = spawnSync(command[0], command.slice(1), {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: 300_000,
    env: getSubprocessEnvironment(),
  })

  return {
    exitCode: result.status,
    output: `${result.stdout ?? ''}\n${result.stderr ?? ''}`.trim(),
  }
}

function resolveRunbookCommand(action: RuntimeRunbookAction): [string, ...string[]] {
  switch (action) {
    case 'check':
      return ['bun', 'run', 'check']
    case 'tests':
      return ['bun', 'test']
    case 'smoke':
      return ['bun', 'run', 'runtime:smoke']
  }
}

function writeRunbookArtifact(input: {
  env: string
  directiveId: string
  action: RuntimeRunbookAction
  startedAt: string
  ok: boolean
  exitCode: number | null
  output: string
}): string {
  const dir = path.join(process.cwd(), 'runtime', input.env, 'artifacts', 'runbook')
  mkdirSync(dir, { recursive: true })
  const filePath = path.join(dir, `${input.directiveId}-${input.action}.md`)
  const content = [
    '# Runtime Runbook Result',
    '',
    `- Directive ID: ${input.directiveId}`,
    `- Action: ${input.action}`,
    `- Started At: ${input.startedAt}`,
    `- Status: ${input.ok ? 'PASS' : 'FAIL'}`,
    `- Exit Code: ${input.exitCode ?? 'unknown'}`,
    '',
    '## Output',
    '```text',
    input.output || '(no output)',
    '```',
    '',
  ].join('\n')
  writeFileSync(filePath, content, 'utf8')
  return filePath
}

function summarizeCommandOutput(text: string, limit = 1200): string {
  const compact = text.trim()
  if (!compact) {
    return '(no output)'
  }
  if (compact.length <= limit) {
    return compact
  }
  return `${compact.slice(0, limit).trim()}...`
}

function persistOperationalSnapshot(
  env: string,
  snapshot: RuntimeAppSnapshot,
): void {
  const dir = path.join(process.cwd(), 'runtime', env, 'operational', 'state')
  mkdirSync(dir, { recursive: true })
  const filePath = path.join(dir, 'runtime-app-state.json')
  writeFileSync(filePath, JSON.stringify(snapshot, null, 2), 'utf8')
}

function appendOperationalAudit(
  env: string,
  entry: OperatorAuditEntry,
): void {
  const dir = path.join(process.cwd(), 'runtime', env, 'operational', 'logs')
  mkdirSync(dir, { recursive: true })
  const filePath = path.join(dir, 'operator-actions.jsonl')
  appendFileSync(filePath, `${JSON.stringify(entry)}\n`, 'utf8')
}

function createWorkers(): RuntimeWorkerDescriptor[] {
  return [
    {
      worker_id: 'worker-sales-01',
      agent_id: 'sales-1',
      agent_type: 'sales_agent',
      status: 'busy',
      project_id: 'proj-acme-web',
    },
    {
      worker_id: 'worker-product-01',
      agent_id: 'product-1',
      agent_type: 'product_agent',
      status: 'ready',
      project_id: 'proj-acme-web',
    },
    {
      worker_id: 'worker-eng-01',
      agent_id: 'engineering-1',
      agent_type: 'engineering_agent',
      status: 'busy',
      project_id: 'proj-acme-web',
    },
    {
      worker_id: 'worker-support-01',
      agent_id: 'support-1',
      agent_type: 'support_agent',
      status: 'offline',
      project_id: 'proj-lotus-care',
    },
  ]
}

function createSeed(): CompanySnapshotSeed {
  return {
    agents: [
      buildAgent('ceo-agent', 'ceo_agent', 'idle'),
      buildAgent('sales-1', 'sales_agent', 'busy', 'proj-acme-web'),
      buildAgent('marketing-1', 'marketing_agent', 'idle', 'proj-orchid-growth'),
      buildAgent('product-1', 'product_agent', 'busy', 'proj-acme-web'),
      buildAgent('engineering-1', 'engineering_agent', 'busy', 'proj-acme-web'),
      buildAgent('pm-1', 'project_manager_agent', 'stale', 'proj-lotus-care'),
      buildAgent('support-1', 'support_agent', 'offline', 'proj-lotus-care'),
    ],
    projects: [
      buildProject('proj-acme-web', 'acme', 'implementation', 'qa hardening', [
        'sales-1',
        'product-1',
        'engineering-1',
      ]),
      buildProject('proj-lotus-care', 'lotus', 'support', 'incident triage', [
        'pm-1',
        'support-1',
      ]),
      buildProject('proj-orchid-growth', 'orchid', 'proposal', 'owner pricing review', [
        'marketing-1',
        'sales-1',
      ]),
    ],
    open_blockers: [
      {
        blocker_id: 'blocker-support-01',
        summary: 'Lotus support workflow degraded because support worker is offline.',
        severity: 'high',
        created_at: '2026-05-14T08:32:00.000Z',
        project_id: 'proj-lotus-care',
        owner_agent: 'support_agent',
      },
    ],
    support_ticket_count: 4,
  }
}

function seedApprovals(
  shell: OrchestratorShell,
  approvalTimeline: Array<Approval_Request | Approval_Response>,
): void {
  const approvals: Approval_Request[] = [
    {
      request_id: 'apr-proposal-001',
      gate: 'proposal_final',
      from_agent: 'sales_agent',
      timestamp: '2026-05-14T08:10:00.000Z',
      project_id: 'proj-orchid-growth',
      summary: 'Proposal ready for Orchid growth retainer.',
      recommendation: 'Approve and send after owner price check.',
      risks: ['Scope creep if analytics add-on remains undefined.'],
      options: ['approve', 'reject', 'revise'],
      artifact_ref: 'projects/orchid/proj-orchid-growth/proposal-v3.md',
    },
    {
      request_id: 'apr-spec-001',
      gate: 'spec_final',
      from_agent: 'product_agent',
      timestamp: '2026-05-14T08:20:00.000Z',
      project_id: 'proj-acme-web',
      summary: 'Discovery spec final for Acme runtime dashboard.',
      recommendation: 'Approve for build completion.',
      risks: ['Readiness API still depends on local proxy availability.'],
      options: ['approve', 'reject', 'revise'],
      artifact_ref: 'projects/acme/proj-acme-web/spec-v2.md',
    },
    {
      request_id: 'apr-delivery-001',
      gate: 'delivery_final',
      from_agent: 'engineering_agent',
      timestamp: '2026-05-14T08:42:00.000Z',
      project_id: 'proj-acme-web',
      summary: 'Operator shell delivery candidate is ready for owner validation.',
      recommendation: 'Approve after quick UI smoke pass.',
      risks: ['Support worker degradation still visible on dashboard.'],
      options: ['approve', 'reject', 'revise'],
      artifact_ref: 'projects/acme/proj-acme-web/delivery/package-v1.tgz',
    },
  ]

  for (const approval of approvals) {
    shell.recordApprovalRequest(approval)
    approvalTimeline.push(approval)
  }
}

function seedMessages(
  shell: OrchestratorShell,
  rejectedMessages: Map<string, RetryMessageRecord>,
): void {
  const messages: Agent_Message[] = [
    {
      from: 'sales_agent',
      to: 'product_agent',
      message_type: 'lead_handoff',
      project_id: 'proj-acme-web',
      timestamp: '2026-05-14T07:50:00.000Z',
      payload: {
        handoff_id: 'handoff-lead-001',
        lead_id: 'lead-acme-01',
        client_name: 'Acme',
        stakeholder_contacts: ['owner@acme.example'],
        proposal_artifact_ref: 'projects/acme/proj-acme-web/proposal.md',
        initial_scope: 'Operator dashboard and runtime shell',
        commercial_assumptions: ['Fixed scope for sprint 1'],
        initial_risks: ['API proxy readiness'],
      },
    },
    {
      from: 'product_agent',
      to: 'engineering_agent',
      message_type: 'discovery_handoff',
      project_id: 'proj-acme-web',
      timestamp: '2026-05-14T08:00:00.000Z',
      payload: {
        handoff_id: 'handoff-discovery-001',
        spec_artifact_ref: 'projects/acme/proj-acme-web/spec-v2.md',
        mvp_scope: ['dashboard', 'approvals', 'runtime logs'],
        tool_stack: ['bun', 'typescript'],
        acceptance_criteria: ['health endpoint', 'readiness endpoint', 'operator UI'],
        technical_constraints: ['in-memory persistence in dev'],
        implementation_risks: ['parallel code changes'],
      },
    },
    {
      from: 'support_agent',
      to: 'engineering_agent',
      message_type: 'ticket_escalation',
      project_id: 'proj-lotus-care',
      timestamp: '2026-05-14T08:25:00.000Z',
      payload: {
        ticket_id: 'ticket-404',
        severity: 'high',
        summary: 'Client incident requires engineering eyes',
        requested_action: 'Investigate missing worker heartbeat',
      },
    } as Agent_Message,
  ]

  for (const message of messages) {
    const result = shell.routeMessage(message)
    if (!result.allowed) {
      const last = shell.app.getRegistry().getCommunicationLog().at(-1)
      if (last) {
        rejectedMessages.set(last.log_id, { original: message, retries: 0 })
      }
    }
  }

  shell.acknowledgeHandoff('handoff-lead-001', '2026-05-14T07:50:20.000Z')
}

function seedCeoRuntime(ceoRuntime: CeoRuntime): void {
  ceoRuntime.recordDecision({
    decision_id: 'decision-001',
    timestamp: '2026-05-14T08:05:00.000Z',
    category: 'resource_allocation',
    context: 'Support coverage degraded for Lotus.',
    options_considered: ['Keep current staffing', 'Reassign PM coverage', 'Escalate to owner'],
    chosen_option: 'Reassign PM coverage',
    rationale: 'Fastest mitigation while support worker is offline.',
    expected_impact: ['Reduce response delay', 'Protect client trust'],
    related_project_ids: ['proj-lotus-care'],
    related_agent_ids: ['pm-1', 'support-1'],
  })

  ceoRuntime.createDelegationTask({
    task_id: 'delegation-001',
    target_agent: 'project_manager_agent',
    instructions: 'Coordinate temporary incident communications for Lotus.',
    priority: 'high',
    success_criteria: ['client communication sent', 'incident timeline updated'],
    project_id: 'proj-lotus-care',
  }, '2026-05-14T08:12:00.000Z')

  ceoRuntime.failDelegationTask(
    'delegation-001',
    'pm-1',
    'Awaiting fresh support status before client update can be finalized.',
    '2026-05-14T08:18:00.000Z',
  )
}

function createJobs(): RuntimeJob[] {
  return [
    {
      job_id: 'job-msg-001',
      kind: 'message_dispatch',
      status: 'completed',
      attempts: 1,
      max_attempts: 3,
      detail: 'Dispatch Acme discovery handoff to engineering.',
      project_id: 'proj-acme-web',
      worker_id: 'worker-eng-01',
      scheduled_at: '2026-05-14T08:00:00.000Z',
      started_at: '2026-05-14T08:00:03.000Z',
      finished_at: '2026-05-14T08:00:04.000Z',
    },
    {
      job_id: 'job-retry-001',
      kind: 'handoff_retry',
      status: 'failed',
      attempts: 2,
      max_attempts: 4,
      detail: 'Retry Lotus escalation after support worker timeout.',
      project_id: 'proj-lotus-care',
      worker_id: 'worker-support-01',
      scheduled_at: '2026-05-14T08:25:00.000Z',
      started_at: '2026-05-14T08:26:00.000Z',
      finished_at: '2026-05-14T08:26:30.000Z',
      error: 'Target worker offline.',
    },
    {
      job_id: 'job-approval-001',
      kind: 'approval_followup',
      status: 'running',
      attempts: 1,
      max_attempts: 2,
      detail: 'Wait for owner decision on Acme delivery approval.',
      project_id: 'proj-acme-web',
      worker_id: 'worker-product-01',
      scheduled_at: '2026-05-14T08:42:00.000Z',
      started_at: '2026-05-14T08:43:00.000Z',
    },
    {
      job_id: 'job-sla-001',
      kind: 'sla_scan',
      status: 'queued',
      attempts: 0,
      max_attempts: 1,
      detail: 'Scan for overdue acknowledgment and approval backlog.',
      scheduled_at: '2026-05-14T09:05:00.000Z',
      worker_id: 'scheduler-01',
    },
    {
      job_id: 'job-report-001',
      kind: 'report_generate',
      status: 'completed',
      attempts: 1,
      max_attempts: 2,
      detail: 'Generate morning KPI report.',
      scheduled_at: '2026-05-14T09:00:00.000Z',
      started_at: '2026-05-14T09:00:02.000Z',
      finished_at: '2026-05-14T09:00:05.000Z',
      worker_id: 'scheduler-01',
    },
  ]
}

function buildAgent(
  agent_id: string,
  agent_type: AgentType,
  status: 'idle' | 'busy' | 'offline' | 'error' | 'stale',
  current_project_id?: string,
) {
  return {
    agent_id,
    agent_type,
    status,
    current_project_id,
    last_activity_timestamp: '2026-05-14T08:40:00.000Z',
  }
}

function buildProject(
  project_id: string,
  client_id: string,
  lifecycle_state: Lifecycle_State,
  current_milestone: string,
  active_agent_ids: string[],
) {
  return {
    project_id,
    client_id,
    lifecycle_state,
    current_milestone,
    active_agent_ids,
    updated_at: '2026-05-14T08:45:00.000Z',
  }
}

function cloneJob(job: RuntimeJob): RuntimeJob {
  return { ...job }
}

function fromRegistryAudit(entry: AuditLogEntry): OperatorAuditEntry {
  return {
    timestamp: entry.timestamp,
    action: entry.event,
    actor: entry.agent_id ?? 'registry',
    target: entry.project_id ?? 'runtime',
    detail: entry.detail,
  }
}

function redact(secret: string): string {
  if (secret.length <= 6) {
    return `${secret.slice(0, 1)}***${secret.slice(-1)}`
  }

  return `${secret.slice(0, 3)}***${secret.slice(-3)}`
}
