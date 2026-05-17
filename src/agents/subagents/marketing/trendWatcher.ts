/**
 * TrendWatcher Sub-Agent — Marketing Department (Task 3.6)
 *
 * Fungsi: Pemantauan tren harian dan peluang konten viral.
 * Input:  Web search dari sumber industri dan media sosial
 * Output: Laporan tren dengan rekomendasi peluang konten
 * Tools:  web_search, slack
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import { makeSpecialistConfig } from '../../../domain/hierarchy.js'

export const TREND_WATCHER_CONFIG: AgentHierarchyConfig = makeSpecialistConfig({
  agentId: 'marketing-trend-watcher',
  parentAgentId: 'marketing-head',
  departmentName: 'marketing',
  allowedMcpTools: ['web_search', 'slack'],
  roleDescription:
    'Memantau tren harian di industri, media sosial, dan kompetitor. ' +
    'Output: laporan tren dengan rekomendasi peluang konten viral.',
})
export { executeMarketingTrendWatcherFile as execute } from '../../../runtime/subagents/fileExecuteBindings.js'
