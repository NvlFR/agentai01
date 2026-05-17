/**
 * ReportSummarizer Sub-Agent — CEO Department
 *
 * Fungsi: Meringkas laporan panjang semua departemen menjadi executive summary 2 menit.
 * Input:  Laporan dari Engineering, Marketing, Sales, Support, Product, PM
 * Output: Executive summary di CEO inbox, Gmail digest ke founder
 * Trigger: Jumat sore otomatis (end-of-week digest)
 * Tools:  notion, slack, anthropic_api
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import { makeSpecialistConfig } from '../../../domain/hierarchy.js'

export const REPORT_SUMMARIZER_CONFIG: AgentHierarchyConfig = makeSpecialistConfig({
  agentId: 'ceo-report-summarizer',
  parentAgentId: 'ceo-agent',
  departmentName: 'executive',
  allowedMcpTools: ['notion', 'slack', 'anthropic_api'],
  roleDescription:
    'Meringkas laporan panjang dari semua departemen menjadi executive summary 2 menit. ' +
    'Output: digest ke CEO inbox dan Gmail weekly digest ke founder.',
})
export { executeCeoReportSummarizerFile as execute } from '../../../runtime/subagents/fileExecuteBindings.js'
