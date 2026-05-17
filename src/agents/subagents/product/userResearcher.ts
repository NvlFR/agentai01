/**
 * UserResearcher Sub-Agent — Product Department
 *
 * Fungsi: Analisis masukan pengguna, pain points, dan ulasan produk.
 * Input:  Feedback dari Support, survey, ulasan app store
 * Output: User insight report dengan top pain points
 * Tools:  web_search, google_sheets, notion
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import { makeSpecialistConfig } from '../../../domain/hierarchy.js'

export const USER_RESEARCHER_CONFIG: AgentHierarchyConfig = makeSpecialistConfig({
  agentId: 'product-user-researcher',
  parentAgentId: 'product-head',
  departmentName: 'product',
  allowedMcpTools: ['web_search', 'google_sheets', 'notion'],
  roleDescription:
    'Menganalisis masukan pengguna, pain points, dan ulasan produk. ' +
    'Output: user insight report dengan top pain points.',
})
export { executeProductUserResearcherFile as execute } from '../../../runtime/subagents/fileExecuteBindings.js'
