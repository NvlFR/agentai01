/**
 * WABotHandler Sub-Agent — Support Department
 *
 * Fungsi: Mengelola alur otomatisasi chatbot WhatsApp.
 * Input:  Pesan masuk dari WhatsApp API
 * Output: Respons otomatis (greeting, triage, FAQ) dan handoff ke agen manusia jika perlu
 * Trigger: Real-time, setiap pesan masuk ke nomor WA bisnis
 * Tools:  whatsapp_api, notion
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import { makeSpecialistConfig } from '../../../domain/hierarchy.js'

export const WA_BOT_HANDLER_CONFIG: AgentHierarchyConfig = makeSpecialistConfig({
  agentId: 'support-wa-bot-handler',
  parentAgentId: 'support-head',
  departmentName: 'support',
  allowedMcpTools: ['whatsapp_api', 'notion'],
  roleDescription:
    'Mengelola alur otomatisasi chatbot WhatsApp: greeting, triage, dan handoff ke agen manusia. ' +
    'Output: alur bot tereksekusi dan riwayat percakapan tersimpan.',
})
export { executeSupportWaBotHandlerFile as execute } from '../../../runtime/subagents/fileExecuteBindings.js'
