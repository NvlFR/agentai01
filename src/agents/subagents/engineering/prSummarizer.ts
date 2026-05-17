/**
 * PRSummarizer Sub-Agent — Engineering Department
 *
 * Fungsi: Membuat ringkasan perubahan kode untuk release notes dan komunikasi tim.
 * Input:  Merged PR list dari GitHub
 * Output: Changelog dan summary PR di Notion (untuk release notes dan founder briefing)
 * Trigger: Setiap kali ada merge ke main branch
 * Tools:  github, notion, slack
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import { makeSpecialistConfig } from '../../../domain/hierarchy.js'

export const PR_SUMMARIZER_CONFIG: AgentHierarchyConfig = makeSpecialistConfig({
  agentId: 'eng-pr-summarizer',
  parentAgentId: 'engineering-head',
  departmentName: 'engineering',
  allowedMcpTools: ['github', 'notion', 'slack'],
  roleDescription:
    'Membuat ringkasan perubahan kode untuk release notes dan komunikasi tim. ' +
    'Output: changelog dan summary PR di Notion.',
})
export { executeEngPrSummarizerFile as execute } from '../../../runtime/subagents/fileExecuteBindings.js'
