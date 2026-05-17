/**
 * TestGenerator Sub-Agent — Engineering Department
 *
 * Fungsi: Membuat unit test, integration test, dan skenario pengujian otomatis.
 * Input:  Kode sumber atau PR yang perlu di-test
 * Output: File test siap di-merge ke repositori
 * Tools:  github, bash_tool, anthropic_api
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import { makeSpecialistConfig } from '../../../domain/hierarchy.js'

export const TEST_GENERATOR_CONFIG: AgentHierarchyConfig = makeSpecialistConfig({
  agentId: 'eng-test-generator',
  parentAgentId: 'engineering-head',
  departmentName: 'engineering',
  allowedMcpTools: ['github', 'bash_tool', 'anthropic_api'],
  roleDescription:
    'Membuat unit test, integration test, dan skenario pengujian otomatis. ' +
    'Output: file test siap di-merge ke repositori.',
})
export { executeEngTestGeneratorFile as execute } from '../../../runtime/subagents/fileExecuteBindings.js'
