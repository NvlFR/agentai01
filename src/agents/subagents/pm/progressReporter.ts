/**
 * ProgressReporter Sub-Agent — Project Manager Department
 *
 * Fungsi: Menyusun laporan kemajuan proyek mingguan untuk CEO.
 * Input:  Status task dari semua departemen via Notion
 * Output: Laporan progress di Notion + digest ke CEO via Slack
 * Trigger: Jumat sore otomatis
 * Tools:  notion, slack, gmail
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import { makeSpecialistConfig } from '../../../domain/hierarchy.js'

export const PROGRESS_REPORTER_CONFIG: AgentHierarchyConfig = makeSpecialistConfig({
  agentId: 'pm-progress-reporter',
  parentAgentId: 'pm-head',
  departmentName: 'project-manager',
  allowedMcpTools: ['notion', 'slack', 'gmail'],
  roleDescription:
    'Menyusun laporan kemajuan proyek mingguan untuk CEO. ' +
    'Output: laporan progress di Notion + digest ke CEO via Slack.',
})
export { executePmProgressReporterFile as execute } from '../../../runtime/subagents/fileExecuteBindings.js'
