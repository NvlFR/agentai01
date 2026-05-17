/**
 * Product Department Head Config
 *
 * Sumber kebenaran untuk roadmap produk.
 * Mengorkestrasi riset user, prioritisasi fitur, dan penulisan PRD.
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import {
  executeDepartmentHeadWorkflow,
  type DepartmentHeadExecutionArgs,
} from '../../../runtime/subagents/headRuntime.js'

export const PRODUCT_HEAD_CONFIG: AgentHierarchyConfig = {
  agentId: 'product-head',
  roleType: 'head',
  parentAgentId: 'ceo-agent',
  departmentName: 'product',
  subAgentIds: [
    'product-user-researcher',
    'product-feature-prioritizer',
    'product-prd-writer',
    'product-roadmap-builder',
    'product-feedback-analyzer',
  ],
  allowedMcpTools: ['notion', 'slack', 'google_sheets', 'figma_mcp'],
  roleDescription:
    'Sumber kebenaran untuk roadmap produk. ' +
    'Mengorkestrasi riset user, prioritisasi fitur, dan penulisan PRD.',
}

/** Chain riset → prioritisasi → PRD */
export const PRODUCT_DISCOVERY_CHAIN = [
  'product-user-researcher',
  'product-feature-prioritizer',
  'product-prd-writer',
] as const

/** Chain feedback → roadmap */
export const PRODUCT_PLANNING_CHAIN = [
  'product-feedback-analyzer',
  'product-feature-prioritizer',
  'product-roadmap-builder',
] as const

export async function execute(
  args: DepartmentHeadExecutionArgs,
) {
  return executeDepartmentHeadWorkflow({
    ...args,
    headConfig: PRODUCT_HEAD_CONFIG,
    defaultWorkflow: 'discovery',
    workflows: {
      discovery: PRODUCT_DISCOVERY_CHAIN,
      planning: PRODUCT_PLANNING_CHAIN,
    },
  })
}
