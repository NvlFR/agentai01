/**
 * CSATAnalyzer Sub-Agent — Support Department
 *
 * Fungsi: Menganalisis kepuasan pelanggan dari survey dan feedback.
 * Input:  Survey CSAT dan rating dari tiket yang sudah ditutup
 * Output: CSAT score, trend mingguan, dan rekomendasi perbaikan
 * Trigger: Mingguan otomatis, setiap Senin pagi
 * Tools:  google_sheets, notion, anthropic_api
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import { makeSpecialistConfig } from '../../../domain/hierarchy.js'

export const CSAT_ANALYZER_CONFIG: AgentHierarchyConfig = makeSpecialistConfig({
  agentId: 'support-csat-analyzer',
  parentAgentId: 'support-head',
  departmentName: 'support',
  allowedMcpTools: ['google_sheets', 'notion', 'anthropic_api'],
  roleDescription:
    'Menganalisis kepuasan pelanggan dari survey dan feedback. ' +
    'Output: CSAT score, trend, dan rekomendasi perbaikan.',
})
export { executeSupportCsatAnalyzerFile as execute } from '../../../runtime/subagents/fileExecuteBindings.js'
