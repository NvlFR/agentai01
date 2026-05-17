/**
 * EscalationRouter Sub-Agent — Support Department
 *
 * Fungsi: Meneruskan masalah kritis ke departemen yang tepat.
 * Input:  Tiket high/critical dari Ticket Classifier
 * Output: Eskalasi tercatat dengan severity, assignee, dan SLA
 * Tools:  slack, github, gmail
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import { makeSpecialistConfig } from '../../../domain/hierarchy.js'

export const ESCALATION_ROUTER_CONFIG: AgentHierarchyConfig = makeSpecialistConfig({
  agentId: 'support-escalation-router',
  parentAgentId: 'support-head',
  departmentName: 'support',
  allowedMcpTools: ['slack', 'github', 'gmail'],
  roleDescription:
    'Meneruskan masalah kritis ke Engineering (bug) atau PM (blocker project). ' +
    'Output: eskalasi tercatat dengan severity dan assigned agent.',
})
export { executeSupportEscalationRouterFile as execute } from '../../../runtime/subagents/fileExecuteBindings.js'
