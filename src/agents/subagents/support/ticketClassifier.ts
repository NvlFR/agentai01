/**
 * TicketClassifier Sub-Agent — Support Department
 *
 * Fungsi: Mengklasifikasikan tiket masuk berdasarkan kategori dan prioritas.
 * Input:  Tiket dari Gmail, WhatsApp, atau form web
 * Output: Tiket terklasifikasi (kategori + prioritas + departemen tujuan)
 * Tools:  notion, google_sheets, gmail
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import { makeSpecialistConfig } from '../../../domain/hierarchy.js'

export const TICKET_CLASSIFIER_CONFIG: AgentHierarchyConfig = makeSpecialistConfig({
  agentId: 'support-ticket-classifier',
  parentAgentId: 'support-head',
  departmentName: 'support',
  allowedMcpTools: ['notion', 'google_sheets', 'gmail'],
  roleDescription:
    'Mengklasifikasikan tiket masuk: kategori (bug/pertanyaan/feature request), ' +
    'prioritas (low/medium/high/critical), dan departemen tujuan.',
})
export { executeSupportTicketClassifierFile as execute } from '../../../runtime/subagents/fileExecuteBindings.js'
