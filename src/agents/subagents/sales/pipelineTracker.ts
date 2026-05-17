/**
 * PipelineTracker Sub-Agent — Sales Department
 *
 * Fungsi: Memantau pergerakan prospek di setiap tahap sales pipeline.
 * Input:  Google Sheets / Notion database pipeline
 * Output: Status pipeline dan flag yang stagnan > 7 hari
 * Tools:  notion, google_sheets
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import { makeSpecialistConfig } from '../../../domain/hierarchy.js'

export const PIPELINE_TRACKER_CONFIG: AgentHierarchyConfig = makeSpecialistConfig({
  agentId: 'sales-pipeline-tracker',
  parentAgentId: 'sales-head',
  departmentName: 'sales',
  allowedMcpTools: ['notion', 'google_sheets'],
  roleDescription:
    'Memantau pergerakan prospek di setiap tahap sales pipeline. ' +
    'Output: status pipeline dan flag yang stagnan.',
})
export { executeSalesPipelineTrackerFile as execute } from '../../../runtime/subagents/fileExecuteBindings.js'
