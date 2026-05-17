/**
 * SEOSpecialist Sub-Agent — Marketing Department (Task 3.2)
 *
 * Fungsi: Riset kata kunci, audit artikel, dan strategi konten organik.
 * Input:  Draf konten dari Content Creator
 * Output: Konten teroptimasi dengan rekomendasi kata kunci
 * Tools:  web_search, google_sheets
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import { makeSpecialistConfig } from '../../../domain/hierarchy.js'

export const SEO_SPECIALIST_CONFIG: AgentHierarchyConfig = makeSpecialistConfig({
  agentId: 'marketing-seo-specialist',
  parentAgentId: 'marketing-head',
  departmentName: 'marketing',
  allowedMcpTools: ['web_search', 'google_sheets'],
  roleDescription:
    'Riset kata kunci, audit SEO artikel, dan merumuskan strategi konten organik. ' +
    'Input: draf konten dari Content Creator. ' +
    'Output: konten yang dioptimasi dengan rekomendasi kata kunci.',
})
export { executeMarketingSeoSpecialistFile as execute } from '../../../runtime/subagents/fileExecuteBindings.js'
