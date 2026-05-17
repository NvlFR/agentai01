/**
 * CEO Agent Config — CEO Department Head (Tier 2)
 *
 * Orchestrator strategis perusahaan.
 * Menerima arahan dari Owner (Human), memutuskan strategi,
 * mendelegasikan ke Department Heads, memastikan OKR dikejar.
 *
 * CEO TIDAK mengeksekusi langsung — hanya memutuskan dan mendelegasikan.
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import {
  executeDepartmentHeadWorkflow,
  type DepartmentHeadExecutionArgs,
} from '../../../runtime/subagents/headRuntime.js'

export const CEO_AGENT_CONFIG: AgentHierarchyConfig = {
  agentId: 'ceo-agent',
  roleType: 'ceo',
  departmentName: 'executive',
  subAgentIds: [
    'ceo-strategy-analyst',
    'ceo-report-summarizer',
    'ceo-decision-logger',
    'ceo-okr-tracker',
  ],
  allowedMcpTools: ['notion', 'slack', 'google_sheets', 'gmail', 'google_calendar', 'anthropic_api'],
  roleDescription:
    'Orchestrator strategis perusahaan. Menerima arahan dari Owner (Human), ' +
    'memutuskan strategi, mendelegasikan ke Department Heads, memastikan OKR dikejar. ' +
    'CEO tidak mengeksekusi langsung — hanya memutuskan dan mendelegasikan.',
}

/**
 * Chain analitik → ringkasan untuk CEO briefing harian.
 * Strategy Analyst → Report Summarizer
 */
export const CEO_BRIEFING_CHAIN = [
  'ceo-strategy-analyst',
  'ceo-report-summarizer',
] as const

/**
 * Chain pengambilan keputusan.
 * Strategy Analyst → Decision Logger → OKR Tracker
 */
export const CEO_DECISION_CHAIN = [
  'ceo-strategy-analyst',
  'ceo-decision-logger',
  'ceo-okr-tracker',
] as const

export async function execute(
  args: DepartmentHeadExecutionArgs,
) {
  return executeDepartmentHeadWorkflow({
    ...args,
    headConfig: CEO_AGENT_CONFIG,
    defaultWorkflow: 'decision',
    workflows: {
      briefing: CEO_BRIEFING_CHAIN,
      decision: CEO_DECISION_CHAIN,
    },
  })
}
