/**
 * PM Department Head Config
 *
 * Pusat koordinasi seluruh task perusahaan.
 * Semua task harus tercatat di sini.
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import {
  executeDepartmentHeadWorkflow,
  type DepartmentHeadExecutionArgs,
} from '../../../runtime/subagents/headRuntime.js'

export const PM_HEAD_CONFIG: AgentHierarchyConfig = {
  agentId: 'pm-head',
  roleType: 'head',
  parentAgentId: 'ceo-agent',
  departmentName: 'project-manager',
  subAgentIds: [
    'pm-task-coordinator',
    'pm-risk-analyzer',
    'pm-sprint-planner',
    'pm-progress-reporter',
    'pm-deadline-watcher',
  ],
  allowedMcpTools: ['notion', 'slack', 'google_calendar', 'github', 'google_sheets'],
  roleDescription:
    'Pusat koordinasi seluruh task perusahaan. Semua task harus tercatat di sini.',
}

/** Chain sprint planning: analyze risks → plan sprint → watch deadlines */
export const PM_SPRINT_CHAIN = [
  'pm-risk-analyzer',
  'pm-sprint-planner',
  'pm-deadline-watcher',
] as const

/** Chain reporting: coordinate tasks → report progress */
export const PM_REPORTING_CHAIN = [
  'pm-task-coordinator',
  'pm-progress-reporter',
] as const

export async function execute(
  args: DepartmentHeadExecutionArgs,
) {
  return executeDepartmentHeadWorkflow({
    ...args,
    headConfig: PM_HEAD_CONFIG,
    defaultWorkflow: 'sprint',
    workflows: {
      sprint: PM_SPRINT_CHAIN,
      reporting: PM_REPORTING_CHAIN,
    },
  })
}
