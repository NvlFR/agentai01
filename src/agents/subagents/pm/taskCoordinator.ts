/**
 * TaskCoordinator Sub-Agent — Project Manager Department
 *
 * Fungsi: Mengalokasikan task ke departemen dan melacak tiket.
 * Input:  Arahan dari PM Head atau escalation dari departemen lain
 * Output: Task assignment terdokumentasi di Notion dengan assignee dan deadline
 * Tools:  notion, slack, github
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import { makeSpecialistConfig } from '../../../domain/hierarchy.js'

export const TASK_COORDINATOR_CONFIG: AgentHierarchyConfig = makeSpecialistConfig({
  agentId: 'pm-task-coordinator',
  parentAgentId: 'pm-head',
  departmentName: 'project-manager',
  allowedMcpTools: ['notion', 'slack', 'github'],
  roleDescription:
    'Mengalokasikan task ke departemen dan melacak tiket. ' +
    'Output: task assignment terdokumentasi di Notion.',
})

export { executePmTaskCoordinatorFile as execute } from '../../../runtime/subagents/fileExecuteBindings.js'
