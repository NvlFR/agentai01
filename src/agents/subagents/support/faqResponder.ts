/**
 * FAQResponder Sub-Agent — Support Department
 *
 * Fungsi: Menjawab pertanyaan umum berdasarkan knowledge base.
 * Input:  Pertanyaan user dari WhatsApp atau email
 * Output: Respons template dengan link ke dokumentasi
 * Tools:  notion, whatsapp_api, gmail
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import { makeSpecialistConfig } from '../../../domain/hierarchy.js'

export const FAQ_RESPONDER_CONFIG: AgentHierarchyConfig = makeSpecialistConfig({
  agentId: 'support-faq-responder',
  parentAgentId: 'support-head',
  departmentName: 'support',
  allowedMcpTools: ['notion', 'whatsapp_api', 'gmail'],
  roleDescription:
    'Menjawab pertanyaan umum berdasarkan knowledge base. ' +
    'Output: respons template dan link ke dokumentasi.',
})
export { executeSupportFaqResponderFile as execute } from '../../../runtime/subagents/fileExecuteBindings.js'
