/**
 * ProposalGenerator Sub-Agent — Sales Department
 *
 * Fungsi: Menyusun draf penawaran komersial.
 * Input:  Data lead yang sudah dikualifikasi
 * Output: Proposal dengan kalkulasi harga, scope, dan timeline
 * Tools:  google_sheets, google_drive, notion
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import { makeSpecialistConfig } from '../../../domain/hierarchy.js'

export const PROPOSAL_GENERATOR_CONFIG: AgentHierarchyConfig = makeSpecialistConfig({
  agentId: 'sales-proposal-generator',
  parentAgentId: 'sales-head',
  departmentName: 'sales',
  allowedMcpTools: ['google_sheets', 'google_drive', 'notion'],
  roleDescription:
    'Menyusun draf penawaran komersial dengan kalkulasi harga, scope, dan timeline. ' +
    'Output: proposal siap presentasi.',
})
export { executeSalesProposalGeneratorFile as execute } from '../../../runtime/subagents/fileExecuteBindings.js'
