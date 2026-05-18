import chalk from 'chalk'
import type { RuntimeAppSnapshot } from './state.js'
import type { AgentCreationManifest } from './agent-creation/index.js'
import type { SubAgentRegistry } from '../registry/subAgentRegistry.js'
import type { AgentHierarchyConfig } from '../domain/hierarchy.js'
import type { AgentRegistryEntry } from '../domain/types.js'
import type { ActionResult } from './state.js'

export type DepartmentSummary = {
  departmentName: string
  headCount: number
  specialistCount: number
  totalCount: number
  heads: string[]
}

export function renderSnapshotSummary(snapshot: RuntimeAppSnapshot): string {
  return [
    `${chalk.bold('Runtime')} ${snapshot.runtime.runtime_id}`,
    `${chalk.cyan('Env')}: ${snapshot.environment.env}`,
    `${chalk.cyan('Ready')}: ${snapshot.readiness.ready ? chalk.green('yes') : chalk.yellow('no')}`,
    `${chalk.cyan('Projects')}: ${snapshot.projects.length}`,
    `${chalk.cyan('Approvals')}: ${snapshot.approvals.length}`,
    `${chalk.cyan('Jobs')}: ${snapshot.jobs.length}`,
    `${chalk.cyan('Messages')}: ${snapshot.messages.length}`,
    `${chalk.cyan('AI Model')}: ${snapshot.environment.ai_model}`,
  ].join('\n')
}

export function summarizeDepartments(registry: SubAgentRegistry): DepartmentSummary[] {
  const grouped = new Map<string, DepartmentSummary>()
  for (const config of registry.listAll()) {
    const summary = grouped.get(config.departmentName) ?? {
      departmentName: config.departmentName,
      headCount: 0,
      specialistCount: 0,
      totalCount: 0,
      heads: [],
    }
    summary.totalCount += 1
    if (config.roleType === 'head') {
      summary.headCount += 1
      summary.heads.push(config.agentId)
    } else if (config.roleType === 'specialist') {
      summary.specialistCount += 1
    }
    grouped.set(config.departmentName, summary)
  }
  return [...grouped.values()].sort((a, b) => a.departmentName.localeCompare(b.departmentName))
}

export function renderDepartmentSummary(summary: DepartmentSummary): string {
  const heads = summary.heads.length > 0 ? summary.heads.join(', ') : '-'
  return [
    chalk.bold(summary.departmentName),
    `Heads: ${summary.headCount}`,
    `Specialists: ${summary.specialistCount}`,
    `Total: ${summary.totalCount}`,
    `Lead IDs: ${heads}`,
  ].join('\n')
}

export function renderDraftList(items: readonly AgentCreationManifest[]): string {
  if (items.length === 0) {
    return 'Belum ada draft agent di lokasi ini.'
  }

  return items
    .map(item =>
      [
        `${chalk.bold(item.agentType)} ${chalk.gray(`(${item.location})`)}`,
        `${chalk.cyan('Method')}: ${item.method}`,
        `${chalk.cyan('Model')}: ${item.model ?? 'default'}`,
        `${chalk.cyan('Tools')}: ${item.tools?.join(', ') ?? 'all canonical tools'}`,
        `${chalk.cyan('Path')}: ${item.markdownPath}`,
      ].join('\n'),
    )
    .join('\n\n')
}

export function renderRuntimeAgentsList(items: readonly AgentRegistryEntry[]): string {
  if (items.length === 0) {
    return 'Belum ada runtime agent terdaftar.'
  }

  return items
    .map(
      item =>
        `${chalk.bold(item.agent_id)} | ${item.agent_type} | status=${item.status} | project=${item.current_project_id ?? '-'} | last=${item.last_activity_timestamp}`,
    )
    .join('\n')
}

export function renderRuntimeAgentDetail(agent: AgentRegistryEntry): string {
  return [
    chalk.bold(agent.agent_id),
    `Type: ${agent.agent_type}`,
    `Status: ${agent.status}`,
    `Project: ${agent.current_project_id ?? '-'}`,
    `Last activity: ${agent.last_activity_timestamp}`,
  ].join('\n')
}

export function renderSubAgentDetail(agent: AgentHierarchyConfig): string {
  return [
    chalk.bold(agent.agentId),
    `Role: ${agent.roleType}`,
    `Department: ${agent.departmentName}`,
    `Parent: ${agent.parentAgentId ?? '-'}`,
    `Children: ${agent.subAgentIds.join(', ') || '-'}`,
    `Allowed MCP: ${agent.allowedMcpTools.join(', ') || '-'}`,
    `Role description: ${agent.roleDescription ?? '-'}`,
  ].join('\n')
}

export function renderApprovalsList(snapshot: RuntimeAppSnapshot): string {
  if (snapshot.approvals.length === 0) {
    return 'Tidak ada pending approval.'
  }

  return snapshot.approvals
    .map(
      approval =>
        `${chalk.bold(approval.request_id)} | gate=${approval.gate} | project=${approval.project_id} | from=${approval.from_agent}\n${approval.summary}`,
    )
    .join('\n\n')
}

export function renderLiveOperationsPane(snapshot: RuntimeAppSnapshot): string {
  const recentMessages = snapshot.messages.slice(-5)
  const recentJobs = snapshot.jobs.slice(-5)
  const recentAudit = snapshot.audit.slice(-5)

  return [
    chalk.bold('Operator Console Live Pane'),
    `${chalk.cyan('Generated')}: ${snapshot.generated_at}`,
    `${chalk.cyan('Projects')}: ${snapshot.projects.length} | ${chalk.cyan('Approvals')}: ${snapshot.approvals.length} | ${chalk.cyan('Jobs')}: ${snapshot.jobs.length} | ${chalk.cyan('Messages')}: ${snapshot.messages.length}`,
    '',
    chalk.bold('Recent Messages'),
    recentMessages.length === 0
      ? 'No message events yet.'
      : recentMessages
          .map(
            item =>
              `${item.recorded_at} | ${item.message.from} -> ${item.message.to} | ${item.message.message_type} | ${item.status}`,
          )
          .join('\n'),
    '',
    chalk.bold('Recent Jobs'),
    recentJobs.length === 0
      ? 'No runtime jobs yet.'
      : recentJobs
          .map(item => `${item.job_id} | ${item.kind} | ${item.status} | attempts=${item.attempts}`)
          .join('\n'),
    '',
    chalk.bold('Recent Audit'),
    recentAudit.length === 0
      ? 'No audit entries yet.'
      : recentAudit
          .map(item => `${item.timestamp} | ${item.action} | ${item.target} | ${item.detail}`)
          .join('\n'),
    '',
    chalk.gray('Auto refresh 2s. Press q to exit, r to force refresh.'),
  ].join('\n')
}

export type LivePaneTab = 'messages' | 'jobs' | 'audit'

export type OperatorConsoleHistoryEntry = {
  at: string
  input: string
  mode: 'natural' | 'structured'
  ok: boolean
  requiresConfirmation: boolean
  response: string
}

export function renderOperatorHistory(entries: readonly OperatorConsoleHistoryEntry[]): string {
  if (entries.length === 0) {
    return 'Belum ada history percakapan operator di sesi ini.'
  }

  return entries
    .map(entry =>
      [
        `${chalk.bold(entry.at)} | mode=${entry.mode} | ok=${entry.ok ? 'yes' : 'no'} | confirm=${entry.requiresConfirmation ? 'yes' : 'no'}`,
        `${chalk.cyan('Input')}: ${entry.input}`,
        `${chalk.cyan('Response')}: ${entry.response}`,
      ].join('\n'),
    )
    .join('\n\n')
}

export function historyEntryFromResult(args: {
  at: string
  input: string
  mode: 'natural' | 'structured'
  result: ActionResult
}): OperatorConsoleHistoryEntry {
  return {
    at: args.at,
    input: args.input,
    mode: args.mode,
    ok: args.result.ok,
    requiresConfirmation: args.result.requires_confirmation === true,
    response: args.result.message,
  }
}

export function renderLiveOperationsPaneTab(
  snapshot: RuntimeAppSnapshot,
  tab: LivePaneTab,
): string {
  const recentMessages = snapshot.messages.slice(-8)
  const recentJobs = snapshot.jobs.slice(-8)
  const recentAudit = snapshot.audit.slice(-8)
  const tabLine = [
    tab === 'messages' ? chalk.green('[messages]') : '[messages]',
    tab === 'jobs' ? chalk.green('[jobs]') : '[jobs]',
    tab === 'audit' ? chalk.green('[audit]') : '[audit]',
  ].join(' ')

  const body =
    tab === 'messages'
      ? recentMessages.length === 0
        ? 'No message events yet.'
        : recentMessages
            .map(
              item =>
                `${item.recorded_at} | ${item.message.from} -> ${item.message.to} | ${item.message.message_type} | ${item.status}`,
            )
            .join('\n')
      : tab === 'jobs'
        ? recentJobs.length === 0
          ? 'No runtime jobs yet.'
          : recentJobs
              .map(
                item =>
                  `${item.job_id} | ${item.kind} | ${item.status} | attempts=${item.attempts} | project=${item.project_id ?? '-'}`,
              )
              .join('\n')
        : recentAudit.length === 0
          ? 'No audit entries yet.'
          : recentAudit
              .map(item => `${item.timestamp} | ${item.action} | ${item.target} | ${item.detail}`)
              .join('\n')

  return [
    chalk.bold('Operator Console Live Pane'),
    `${chalk.cyan('Generated')}: ${snapshot.generated_at}`,
    `${chalk.cyan('Projects')}: ${snapshot.projects.length} | ${chalk.cyan('Approvals')}: ${snapshot.approvals.length} | ${chalk.cyan('Jobs')}: ${snapshot.jobs.length} | ${chalk.cyan('Messages')}: ${snapshot.messages.length}`,
    '',
    `Tabs: ${tabLine}`,
    '',
    body,
    '',
    chalk.gray('Auto refresh 2s. Press 1=messages, 2=jobs, 3=audit, r=refresh, q=exit.'),
  ].join('\n')
}
