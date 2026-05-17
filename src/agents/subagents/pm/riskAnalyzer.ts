/**
 * RiskAnalyzer Sub-Agent — Project Manager Department
 *
 * Fungsi: Mengidentifikasi potensi blocker dan risiko sprint.
 * Input:  Sprint backlog dan dependency map dari departemen
 * Output: Risk register dengan mitigasi plan dan severity score
 * Tools:  github, notion, slack
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import { makeSpecialistConfig } from '../../../domain/hierarchy.js'

export const RISK_ANALYZER_CONFIG: AgentHierarchyConfig = makeSpecialistConfig({
  agentId: 'pm-risk-analyzer',
  parentAgentId: 'pm-head',
  departmentName: 'project-manager',
  allowedMcpTools: ['github', 'notion', 'slack'],
  roleDescription:
    'Mengidentifikasi potensi blocker dan risiko sprint. ' +
    'Output: risk register dengan mitigasi plan.',
})
export { executePmRiskAnalyzerFile as execute } from '../../../runtime/subagents/fileExecuteBindings.js'
