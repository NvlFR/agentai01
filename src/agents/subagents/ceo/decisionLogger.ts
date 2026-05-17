/**
 * DecisionLogger Sub-Agent — CEO Department
 *
 * Fungsi: Mencatat setiap keputusan strategis CEO ke Notion.
 * Input:  Output keputusan dari CEO Agent
 * Output: Database keputusan di Notion (konteks, alternatif, outcome)
 * Trigger: Setiap kali CEO Agent menghasilkan keputusan baru
 * Tools:  notion, google_drive
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import { makeSpecialistConfig } from '../../../domain/hierarchy.js'

export const DECISION_LOGGER_CONFIG: AgentHierarchyConfig = makeSpecialistConfig({
  agentId: 'ceo-decision-logger',
  parentAgentId: 'ceo-agent',
  departmentName: 'executive',
  allowedMcpTools: ['notion', 'google_drive'],
  roleDescription:
    'Mencatat setiap keputusan strategis CEO ke Notion: konteks, alternatif yang dipertimbangkan, ' +
    'dan outcome yang diharapkan. Berguna sebagai audit trail dan bahan retrospective.',
})
export { executeCeoDecisionLoggerFile as execute } from '../../../runtime/subagents/fileExecuteBindings.js'
