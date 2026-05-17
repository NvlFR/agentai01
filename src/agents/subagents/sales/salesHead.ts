/**
 * Sales Department Head Config
 *
 * Orkestrasi pipeline penjualan dari lead ke closing.
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import {
  executeDepartmentHeadWorkflow,
  type DepartmentHeadExecutionArgs,
} from '../../../runtime/subagents/headRuntime.js'

export const SALES_HEAD_CONFIG: AgentHierarchyConfig = {
  agentId: 'sales-head',
  roleType: 'head',
  parentAgentId: 'ceo-agent',
  departmentName: 'sales',
  subAgentIds: [
    'sales-lead-qualifier',
    'sales-proposal-generator',
    'sales-followup-drafter',
    'sales-pipeline-tracker',
    'sales-competitor-watcher',
  ],
  allowedMcpTools: ['notion', 'slack', 'google_sheets', 'gmail'],
  roleDescription: 'Orkestrasi pipeline penjualan dari lead ke closing.',
}

/** Chain standar: kualifikasi → proposal → follow-up */
export const SALES_QUALIFICATION_CHAIN = [
  'sales-lead-qualifier',
  'sales-proposal-generator',
  'sales-followup-drafter',
] as const

/** Chain riset kompetitor → tracking pipeline */
export const SALES_INTELLIGENCE_CHAIN = [
  'sales-competitor-watcher',
  'sales-pipeline-tracker',
] as const

export async function execute(
  args: DepartmentHeadExecutionArgs,
) {
  return executeDepartmentHeadWorkflow({
    ...args,
    headConfig: SALES_HEAD_CONFIG,
    defaultWorkflow: 'qualification',
    workflows: {
      qualification: SALES_QUALIFICATION_CHAIN,
      intelligence: SALES_INTELLIGENCE_CHAIN,
    },
  })
}
