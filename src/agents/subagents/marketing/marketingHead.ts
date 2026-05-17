/**
 * Marketing Department Head Config
 *
 * Orkestrasi seluruh alur kerja departemen marketing.
 * Menerima target dari CEO Agent, memecah menjadi sub-tasks,
 * dan mendelegasikan ke sub-agen via BatonPassingOrchestrator.
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import {
  executeDepartmentHeadWorkflow,
  type DepartmentHeadExecutionArgs,
} from '../../../runtime/subagents/headRuntime.js'

export const MARKETING_HEAD_CONFIG: AgentHierarchyConfig = {
  agentId: 'marketing-head',
  roleType: 'head',
  parentAgentId: 'ceo-agent',
  departmentName: 'marketing',
  subAgentIds: [
    'marketing-content-creator',
    'marketing-seo-specialist',
    'marketing-campaign-manager',
    'marketing-analytics-reader',
    'marketing-social-scheduler',
    'marketing-trend-watcher',
  ],
  allowedMcpTools: ['notion', 'slack', 'google_sheets'],
  roleDescription:
    'Orkestrasi seluruh alur kerja departemen marketing. ' +
    'Menerima target dari CEO Agent, memecah menjadi sub-tasks, dan mendelegasikan ke sub-agen.',
}

/**
 * Chain standar untuk kampanye marketing penuh.
 * Content Creator → SEO Specialist → Campaign Manager
 */
export const MARKETING_CAMPAIGN_CHAIN = [
  'marketing-content-creator',
  'marketing-seo-specialist',
  'marketing-campaign-manager',
] as const

/**
 * Chain untuk analitik dan perencanaan konten.
 * Trend Watcher → Analytics Reader → Social Scheduler
 */
export const MARKETING_PLANNING_CHAIN = [
  'marketing-trend-watcher',
  'marketing-analytics-reader',
  'marketing-social-scheduler',
] as const

export async function execute(
  args: DepartmentHeadExecutionArgs,
) {
  return executeDepartmentHeadWorkflow({
    ...args,
    headConfig: MARKETING_HEAD_CONFIG,
    defaultWorkflow: 'campaign',
    workflows: {
      campaign: MARKETING_CAMPAIGN_CHAIN,
      planning: MARKETING_PLANNING_CHAIN,
    },
  })
}
