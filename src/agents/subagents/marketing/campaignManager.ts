/**
 * CampaignManager Sub-Agent — Marketing Department (Task 3.3)
 *
 * Fungsi: Merancang kampanye, WA blast, dan mengelola iklan berbayar.
 * Input:  Konten final dari SEO Specialist
 * Output: Laporan eksekusi kampanye dan metrik awal
 * Tools:  whatsapp_api, google_sheets, gmail
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import { makeSpecialistConfig } from '../../../domain/hierarchy.js'

export const CAMPAIGN_MANAGER_CONFIG: AgentHierarchyConfig = makeSpecialistConfig({
  agentId: 'marketing-campaign-manager',
  parentAgentId: 'marketing-head',
  departmentName: 'marketing',
  allowedMcpTools: ['whatsapp_api', 'google_sheets', 'gmail'],
  roleDescription:
    'Merancang jadwal kampanye, mengirim WA blast, dan mengelola iklan berbayar. ' +
    'Input: konten final dari SEO Specialist. ' +
    'Output: laporan eksekusi kampanye dan metrik awal.',
})
export { executeMarketingCampaignManagerFile as execute } from '../../../runtime/subagents/fileExecuteBindings.js'
