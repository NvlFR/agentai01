/**
 * DeadlineWatcher Sub-Agent — Project Manager Department
 *
 * Fungsi: Memantau tenggat waktu dan mengirim reminder otomatis ke departemen terkait.
 * Input:  Google Calendar + Notion deadline database
 * Output: Alert Slack + update Google Calendar jika ada pergeseran jadwal
 * Trigger: Harian otomatis, setiap pagi pukul 08.00
 * Tools:  slack, google_calendar, notion
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import { makeSpecialistConfig } from '../../../domain/hierarchy.js'

export const DEADLINE_WATCHER_CONFIG: AgentHierarchyConfig = makeSpecialistConfig({
  agentId: 'pm-deadline-watcher',
  parentAgentId: 'pm-head',
  departmentName: 'project-manager',
  allowedMcpTools: ['slack', 'google_calendar', 'notion'],
  roleDescription:
    'Memantau tenggat waktu dan mengirim reminder otomatis ke department terkait. ' +
    'Output: alert Slack + update Google Calendar.',
})
export { executePmDeadlineWatcherFile as execute } from '../../../runtime/subagents/fileExecuteBindings.js'
