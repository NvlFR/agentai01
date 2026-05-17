/**
 * CompetitorWatcher Sub-Agent — Sales Department
 *
 * Fungsi: Menganalisis penawaran, harga, dan kelemahan kompetitor.
 * Input:  Nama kompetitor dari Sales Head
 * Output: Briefing kompetitif untuk Sales Head
 * Trigger: Mingguan atau on-demand sebelum proposal besar
 * Tools:  web_search, notion
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import { makeSpecialistConfig } from '../../../domain/hierarchy.js'

export const COMPETITOR_WATCHER_CONFIG: AgentHierarchyConfig = makeSpecialistConfig({
  agentId: 'sales-competitor-watcher',
  parentAgentId: 'sales-head',
  departmentName: 'sales',
  allowedMcpTools: ['web_search', 'notion'],
  roleDescription:
    'Menganalisis penawaran, harga, dan kelemahan kompetitor. ' +
    'Output: briefing kompetitif untuk Sales Head.',
})
export { executeSalesCompetitorWatcherFile as execute } from '../../../runtime/subagents/fileExecuteBindings.js'
