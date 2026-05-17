/**
 * SprintPlanner Sub-Agent — Project Manager Department
 *
 * Fungsi: Menyusun cakupan sprint dan alokasi kapasitas tim.
 * Input:  Backlog prioritas dari Product Head + kapasitas developer
 * Output: Sprint plan di Notion dengan estimasi kapasitas dan task distribution
 * Trigger: Setiap awal sprint (bi-weekly)
 * Tools:  notion, google_calendar, google_sheets
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import { makeSpecialistConfig } from '../../../domain/hierarchy.js'

export const SPRINT_PLANNER_CONFIG: AgentHierarchyConfig = makeSpecialistConfig({
  agentId: 'pm-sprint-planner',
  parentAgentId: 'pm-head',
  departmentName: 'project-manager',
  allowedMcpTools: ['notion', 'google_calendar', 'google_sheets'],
  roleDescription:
    'Menyusun cakupan sprint dan alokasi kapasitas tim. ' +
    'Output: sprint plan di Notion dengan estimasi kapasitas.',
})
export { executePmSprintPlannerFile as execute } from '../../../runtime/subagents/fileExecuteBindings.js'
