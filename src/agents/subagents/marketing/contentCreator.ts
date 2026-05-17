/**
 * ContentCreator Sub-Agent — Marketing Department (Task 3.1)
 *
 * Fungsi: Penulisan caption media sosial, artikel blog, dan naskah kampanye.
 * Input:  Brief kampanye dari Marketing Head
 * Output: Draf konten siap review SEO Specialist
 * Tools:  canva_mcp, notion, google_drive
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import { makeSpecialistConfig } from '../../../domain/hierarchy.js'

export const CONTENT_CREATOR_CONFIG: AgentHierarchyConfig = makeSpecialistConfig({
  agentId: 'marketing-content-creator',
  parentAgentId: 'marketing-head',
  departmentName: 'marketing',
  allowedMcpTools: ['canva_mcp', 'notion', 'google_drive'],
  roleDescription:
    'Menulis caption media sosial, artikel blog, dan naskah kampanye pemasaran. ' +
    'Input: brief kampanye dari Marketing Head. ' +
    'Output: draf konten yang siap direview SEO Specialist.',
})
export { executeMarketingContentCreatorFile as execute } from '../../../runtime/subagents/fileExecuteBindings.js'
