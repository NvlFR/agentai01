/**
 * StrategyAnalyst Sub-Agent — CEO Department
 *
 * Fungsi: Mengolah data dari semua departemen menjadi insight strategis.
 * Input:  Laporan mingguan dari semua agent
 * Output: Briefing deck untuk CEO, ringkasan insight di Notion
 * Trigger: Setiap Senin pagi otomatis, atau on-demand
 * Tools:  web_search, notion, google_sheets
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import { makeSpecialistConfig } from '../../../domain/hierarchy.js'

export const STRATEGY_ANALYST_CONFIG: AgentHierarchyConfig = makeSpecialistConfig({
  agentId: 'ceo-strategy-analyst',
  parentAgentId: 'ceo-agent',
  departmentName: 'executive',
  allowedMcpTools: ['web_search', 'notion', 'google_sheets'],
  roleDescription:
    'Menganalisis data dari semua departemen menjadi insight strategis. ' +
    'Membandingkan performa aktual vs OKR, mengidentifikasi bottleneck, ' +
    'dan menyiapkan rekomendasi untuk CEO.',
})
export { executeCeoStrategyAnalystFile as execute } from '../../../runtime/subagents/fileExecuteBindings.js'
