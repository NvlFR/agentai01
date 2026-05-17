/**
 * SocialScheduler Sub-Agent — Marketing Department (Task 3.5)
 *
 * Fungsi: Penjadwalan dan antrian konten ke kalender editorial.
 * Input:  Konten yang sudah dioptimasi
 * Output: Jadwal konten terpublikasi di Notion dan Google Calendar
 * Tools:  notion, google_calendar, slack
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import { makeSpecialistConfig } from '../../../domain/hierarchy.js'

export const SOCIAL_SCHEDULER_CONFIG: AgentHierarchyConfig = makeSpecialistConfig({
  agentId: 'marketing-social-scheduler',
  parentAgentId: 'marketing-head',
  departmentName: 'marketing',
  allowedMcpTools: ['notion', 'google_calendar', 'slack'],
  roleDescription:
    'Menjadwalkan konten ke kalender editorial dan mengantrekan posting media sosial. ' +
    'Output: jadwal konten terpublikasi di Notion dan Google Calendar.',
})
export { executeMarketingSocialSchedulerFile as execute } from '../../../runtime/subagents/fileExecuteBindings.js'
