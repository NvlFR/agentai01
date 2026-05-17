/**
 * Support Department Head Config
 *
 * Satu-satunya departemen yang berkomunikasi langsung dengan user akhir.
 * Mengelola tiket, FAQ, eskalasi, CSAT, dan WA bot.
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import {
  executeDepartmentHeadWorkflow,
  type DepartmentHeadExecutionArgs,
} from '../../../runtime/subagents/headRuntime.js'

export const SUPPORT_HEAD_CONFIG: AgentHierarchyConfig = {
  agentId: 'support-head',
  roleType: 'head',
  parentAgentId: 'ceo-agent',
  departmentName: 'support',
  subAgentIds: [
    'support-ticket-classifier',
    'support-faq-responder',
    'support-escalation-router',
    'support-csat-analyzer',
    'support-knowledge-builder',
    'support-wa-bot-handler',
  ],
  allowedMcpTools: ['notion', 'slack', 'gmail', 'whatsapp_api', 'google_sheets'],
  roleDescription:
    'Satu-satunya departemen yang berkomunikasi langsung dengan user akhir. ' +
    'Mengelola tiket, FAQ, eskalasi, dan CSAT.',
}

/** Chain triage tiket masuk: classify → FAQ → escalate jika perlu */
export const SUPPORT_TRIAGE_CHAIN = [
  'support-ticket-classifier',
  'support-faq-responder',
  'support-escalation-router',
] as const

/** Chain knowledge improvement: CSAT analyze → knowledge build */
export const SUPPORT_KNOWLEDGE_CHAIN = [
  'support-csat-analyzer',
  'support-knowledge-builder',
] as const

export async function execute(
  args: DepartmentHeadExecutionArgs,
) {
  return executeDepartmentHeadWorkflow({
    ...args,
    headConfig: SUPPORT_HEAD_CONFIG,
    defaultWorkflow: 'triage',
    workflows: {
      triage: SUPPORT_TRIAGE_CHAIN,
      knowledge: SUPPORT_KNOWLEDGE_CHAIN,
    },
  })
}
