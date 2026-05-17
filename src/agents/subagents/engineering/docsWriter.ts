/**
 * DocsWriter Sub-Agent — Engineering Department
 *
 * Fungsi: Menyusun dokumentasi teknis yang lengkap dan terstruktur.
 * Input:  Source code, API spec, atau penjelasan fitur baru
 * Output: Dokumentasi di Notion dan GitHub (API docs, arsitektur, setup guide, changelog)
 * Tools:  notion, github, google_drive
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import { makeSpecialistConfig } from '../../../domain/hierarchy.js'

export const DOCS_WRITER_CONFIG: AgentHierarchyConfig = makeSpecialistConfig({
  agentId: 'eng-docs-writer',
  parentAgentId: 'engineering-head',
  departmentName: 'engineering',
  allowedMcpTools: ['notion', 'github', 'google_drive'],
  roleDescription:
    'Menyusun dokumentasi teknis: API docs, arsitektur, setup guide, dan changelog. ' +
    'Output: dokumentasi di Notion dan GitHub.',
})
export { executeEngDocsWriterFile as execute } from '../../../runtime/subagents/fileExecuteBindings.js'
