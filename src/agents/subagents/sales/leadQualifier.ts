/**
 * LeadQualifier Sub-Agent — Sales Department
 *
 * Fungsi: Verifikasi kecocokan lead (BANT framework).
 * Input:  Data lead dari pipeline atau web form
 * Output: Lead score dan rekomendasi tindak lanjut
 * Tools:  web_search, google_sheets, gmail
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import { makeSpecialistConfig } from '../../../domain/hierarchy.js'

export const LEAD_QUALIFIER_CONFIG: AgentHierarchyConfig = makeSpecialistConfig({
  agentId: 'sales-lead-qualifier',
  parentAgentId: 'sales-head',
  departmentName: 'sales',
  allowedMcpTools: ['web_search', 'google_sheets', 'gmail'],
  roleDescription:
    'Verifikasi kecocokan lead: anggaran (BANT), kebutuhan, authority, timeline. ' +
    'Output: lead score dan rekomendasi tindak lanjut.',
})
export { executeSalesLeadQualifierFile as execute } from '../../../runtime/subagents/fileExecuteBindings.js'
