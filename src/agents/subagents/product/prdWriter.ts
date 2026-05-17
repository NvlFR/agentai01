/**
 * PRDWriter Sub-Agent — Product Department
 *
 * Fungsi: Menulis dokumen PRD lengkap untuk fitur prioritas tinggi.
 * Input:  Backlog prioritas dari Feature Prioritizer + user insight
 * Output: PRD siap review Engineering (problem statement, user stories, AC, referensi desain)
 * Tools:  notion, google_drive, figma_mcp
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import { makeSpecialistConfig } from '../../../domain/hierarchy.js'

export const PRD_WRITER_CONFIG: AgentHierarchyConfig = makeSpecialistConfig({
  agentId: 'product-prd-writer',
  parentAgentId: 'product-head',
  departmentName: 'product',
  allowedMcpTools: ['notion', 'google_drive', 'figma_mcp'],
  roleDescription:
    'Menulis dokumen PRD lengkap: problem statement, user stories, acceptance criteria, referensi desain. ' +
    'Output: PRD siap review Engineering.',
})
export { executeProductPrdWriterFile as execute } from '../../../runtime/subagents/fileExecuteBindings.js'
