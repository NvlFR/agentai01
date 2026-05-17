/**
 * CodeReviewer Sub-Agent — Engineering Department
 *
 * Fungsi: Meninjau pull request dari sisi kualitas kode, keamanan, performa.
 * Input:  PR link atau diff dari GitHub
 * Output: Review report dengan skor kualitas dan rekomendasi
 * Tools:  github, bash_tool
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import { makeSpecialistConfig } from '../../../domain/hierarchy.js'

export const CODE_REVIEWER_CONFIG: AgentHierarchyConfig = makeSpecialistConfig({
  agentId: 'eng-code-reviewer',
  parentAgentId: 'engineering-head',
  departmentName: 'engineering',
  allowedMcpTools: ['github', 'bash_tool'],
  roleDescription:
    'Meninjau pull request: kualitas kode, keamanan, performa, dan kepatuhan standar. ' +
    'Output: review report dengan skor dan rekomendasi.',
})
export { executeEngCodeReviewerFile as execute } from '../../../runtime/subagents/fileExecuteBindings.js'
