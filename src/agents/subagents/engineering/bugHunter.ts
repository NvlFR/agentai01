/**
 * BugHunter Sub-Agent — Engineering Department
 *
 * Fungsi: Analisis laporan bug, stack trace, dan log sistem untuk root cause.
 * Input:  Bug report, stack trace, atau log sistem
 * Output: Bug report terstruktur dengan reproduction steps dan fix recommendation
 * Tools:  github, bash_tool, web_search
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import { makeSpecialistConfig } from '../../../domain/hierarchy.js'

export const BUG_HUNTER_CONFIG: AgentHierarchyConfig = makeSpecialistConfig({
  agentId: 'eng-bug-hunter',
  parentAgentId: 'engineering-head',
  departmentName: 'engineering',
  allowedMcpTools: ['github', 'bash_tool', 'web_search'],
  roleDescription:
    'Menganalisis laporan bug, stack trace, dan log sistem untuk mengidentifikasi root cause. ' +
    'Output: bug report terstruktur dengan reproduction steps dan fix recommendation.',
})
export { executeEngBugHunterFile as execute } from '../../../runtime/subagents/fileExecuteBindings.js'
