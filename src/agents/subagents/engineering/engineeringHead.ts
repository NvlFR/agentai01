/**
 * Engineering Department Head Config
 *
 * Memimpin seluruh alur kerja engineering:
 * code review, bug tracking, dokumentasi, dan infra monitoring.
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import {
  executeDepartmentHeadWorkflow,
  type DepartmentHeadExecutionArgs,
} from '../../../runtime/subagents/headRuntime.js'

export const ENGINEERING_HEAD_CONFIG: AgentHierarchyConfig = {
  agentId: 'engineering-head',
  roleType: 'head',
  parentAgentId: 'ceo-agent',
  departmentName: 'engineering',
  subAgentIds: [
    'eng-code-reviewer',
    'eng-bug-hunter',
    'eng-docs-writer',
    'eng-infra-monitor',
    'eng-test-generator',
    'eng-pr-summarizer',
  ],
  allowedMcpTools: ['github', 'slack', 'notion', 'bash_tool'],
  roleDescription:
    'Memimpin seluruh alur kerja engineering: review kode, bug tracking, dokumentasi, dan infra monitoring.',
}

/** Chain review PR: code review → generate test → summarize */
export const ENGINEERING_PR_CHAIN = [
  'eng-code-reviewer',
  'eng-test-generator',
  'eng-pr-summarizer',
] as const

/** Chain bug investigation → dokumentasi */
export const ENGINEERING_BUG_CHAIN = [
  'eng-bug-hunter',
  'eng-docs-writer',
] as const

export async function execute(
  args: DepartmentHeadExecutionArgs,
) {
  return executeDepartmentHeadWorkflow({
    ...args,
    headConfig: ENGINEERING_HEAD_CONFIG,
    defaultWorkflow: 'pr',
    workflows: {
      pr: ENGINEERING_PR_CHAIN,
      bug: ENGINEERING_BUG_CHAIN,
    },
  })
}
