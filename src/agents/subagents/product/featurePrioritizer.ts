/**
 * FeaturePrioritizer Sub-Agent — Product Department
 *
 * Fungsi: Evaluasi backlog fitur menggunakan kerangka RICE/ICE.
 * Input:  Backlog dari Notion dan input dari User Researcher
 * Output: Backlog yang diprioritaskan dengan skor RICE
 * Tools:  notion, google_sheets
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import { makeSpecialistConfig } from '../../../domain/hierarchy.js'

export const FEATURE_PRIORITIZER_CONFIG: AgentHierarchyConfig = makeSpecialistConfig({
  agentId: 'product-feature-prioritizer',
  parentAgentId: 'product-head',
  departmentName: 'product',
  allowedMcpTools: ['notion', 'google_sheets'],
  roleDescription:
    'Mengevaluasi backlog fitur menggunakan kerangka RICE/ICE. ' +
    'Output: backlog yang diprioritaskan dengan skor.',
})
export { executeProductFeaturePrioritizerFile as execute } from '../../../runtime/subagents/fileExecuteBindings.js'
