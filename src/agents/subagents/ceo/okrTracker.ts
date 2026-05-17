/**
 * OKRTracker Sub-Agent — CEO Department
 *
 * Fungsi: Monitor progress OKR perusahaan secara periodik.
 * Input:  Google Sheets (data KPI), Notion (task completion)
 * Output: Alert ke CEO, reminder ke department agent terkait
 * Trigger: Mingguan otomatis setiap Rabu
 * Tools:  google_sheets, notion, slack, gmail
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import { makeSpecialistConfig } from '../../../domain/hierarchy.js'

export const OKR_TRACKER_CONFIG: AgentHierarchyConfig = makeSpecialistConfig({
  agentId: 'ceo-okr-tracker',
  parentAgentId: 'ceo-agent',
  departmentName: 'executive',
  allowedMcpTools: ['notion', 'google_sheets', 'slack'],
  roleDescription:
    'Monitor progress OKR perusahaan. Menghitung persentase pencapaian tiap Key Result, ' +
    'mengidentifikasi yang at-risk, dan mengirim alert ke department terkait.',
})
export { executeCeoOkrTrackerFile as execute } from '../../../runtime/subagents/fileExecuteBindings.js'
