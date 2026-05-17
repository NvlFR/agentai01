/**
 * FollowUpDrafter Sub-Agent — Sales Department
 *
 * Fungsi: Membuat draf pesan tindak lanjut dan email negosiasi.
 * Input:  Status deal dan konteks percakapan sebelumnya
 * Output: Draf email siap kirim
 * Tools:  gmail, slack, anthropic_api
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import { makeSpecialistConfig } from '../../../domain/hierarchy.js'

export const FOLLOWUP_DRAFTER_CONFIG: AgentHierarchyConfig = makeSpecialistConfig({
  agentId: 'sales-followup-drafter',
  parentAgentId: 'sales-head',
  departmentName: 'sales',
  allowedMcpTools: ['gmail', 'slack', 'anthropic_api'],
  roleDescription:
    'Membuat draf pesan tindak lanjut, email negosiasi, dan reminder klien. ' +
    'Output: draf email siap kirim.',
})
export { executeSalesFollowUpDrafterFile as execute } from '../../../runtime/subagents/fileExecuteBindings.js'
