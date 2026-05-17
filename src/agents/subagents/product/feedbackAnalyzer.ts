/**
 * FeedbackAnalyzer Sub-Agent — Product Department
 *
 * Fungsi: Mengelompokkan tiket komplain dan masukan menjadi tema dan insight.
 * Input:  Tiket yang sudah diselesaikan dari Support Department
 * Output: Cluster feedback dengan frekuensi dan dampak
 * Tools:  anthropic_api, google_sheets
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import { makeSpecialistConfig } from '../../../domain/hierarchy.js'

export const FEEDBACK_ANALYZER_CONFIG: AgentHierarchyConfig = makeSpecialistConfig({
  agentId: 'product-feedback-analyzer',
  parentAgentId: 'product-head',
  departmentName: 'product',
  allowedMcpTools: ['anthropic_api', 'google_sheets'],
  roleDescription:
    'Mengelompokkan tiket komplain dan masukan menjadi tema dan insight produk. ' +
    'Output: cluster feedback dengan frekuensi dan dampak.',
})
export { executeProductFeedbackAnalyzerFile as execute } from '../../../runtime/subagents/fileExecuteBindings.js'
