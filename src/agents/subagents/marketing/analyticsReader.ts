/**
 * AnalyticsReader Sub-Agent — Marketing Department (Task 3.4)
 *
 * Fungsi: Analisis performa kampanye mingguan dan metrik konversi.
 * Input:  Data dari Google Sheets (CTR, konversi, ROI, engagement)
 * Output: Ringkasan metrik dengan rekomendasi optimasi
 * Tools:  google_sheets, web_search
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import { makeSpecialistConfig } from '../../../domain/hierarchy.js'

export const ANALYTICS_READER_CONFIG: AgentHierarchyConfig = makeSpecialistConfig({
  agentId: 'marketing-analytics-reader',
  parentAgentId: 'marketing-head',
  departmentName: 'marketing',
  allowedMcpTools: ['google_sheets', 'web_search'],
  roleDescription:
    'Menganalisis performa kampanye mingguan: CTR, konversi, ROI, dan engagement. ' +
    'Output: ringkasan metrik dengan rekomendasi optimasi.',
})
export { executeMarketingAnalyticsReaderFile as execute } from '../../../runtime/subagents/fileExecuteBindings.js'
