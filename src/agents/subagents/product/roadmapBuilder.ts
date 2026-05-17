/**
 * RoadmapBuilder Sub-Agent — Product Department
 *
 * Fungsi: Menyusun dan memperbarui roadmap produk jangka pendek dan panjang.
 * Input:  PRD dari PRD Writer + OKR dari CEO Agent
 * Output: Roadmap terbarui di Notion (sprint & kuartal)
 * Tools:  notion, google_sheets, slack
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import { makeSpecialistConfig } from '../../../domain/hierarchy.js'

export const ROADMAP_BUILDER_CONFIG: AgentHierarchyConfig = makeSpecialistConfig({
  agentId: 'product-roadmap-builder',
  parentAgentId: 'product-head',
  departmentName: 'product',
  allowedMcpTools: ['notion', 'google_sheets', 'slack'],
  roleDescription:
    'Menyusun dan memperbarui roadmap produk jangka pendek (sprint) dan panjang (kuartal). ' +
    'Output: roadmap terbarui di Notion.',
})
export { executeProductRoadmapBuilderFile as execute } from '../../../runtime/subagents/fileExecuteBindings.js'
