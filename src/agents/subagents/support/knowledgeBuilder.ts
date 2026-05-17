/**
 * KnowledgeBuilder Sub-Agent — Support Department
 *
 * Fungsi: Memperbarui artikel knowledge base dari tiket yang sudah diselesaikan.
 * Input:  Tiket resolved yang berisi solusi baru atau FAQ baru
 * Output: Artikel FAQ baru atau update di Notion knowledge base
 * Trigger: Setiap kali ada tiket resolved yang berisi informasi baru
 * Tools:  notion, google_drive
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import { makeSpecialistConfig } from '../../../domain/hierarchy.js'

export const KNOWLEDGE_BUILDER_CONFIG: AgentHierarchyConfig = makeSpecialistConfig({
  agentId: 'support-knowledge-builder',
  parentAgentId: 'support-head',
  departmentName: 'support',
  allowedMcpTools: ['notion', 'google_drive'],
  roleDescription:
    'Memperbarui artikel knowledge base dari tiket yang sudah diselesaikan. ' +
    'Output: artikel FAQ baru atau update di Notion.',
})
export { executeSupportKnowledgeBuilderFile as execute } from '../../../runtime/subagents/fileExecuteBindings.js'
