/**
 * Sales Department Sub-Agents — Barrel Index
 *
 * File implementasi:
 * - salesHead.ts          — Sales Head config + baton chains
 * - leadQualifier.ts      — LeadQualifier specialist
 * - proposalGenerator.ts  — ProposalGenerator specialist
 * - followUpDrafter.ts    — FollowUpDrafter specialist
 * - pipelineTracker.ts    — PipelineTracker specialist
 * - competitorWatcher.ts  — CompetitorWatcher specialist
 */

export {
  SALES_HEAD_CONFIG,
  SALES_QUALIFICATION_CHAIN,
  SALES_INTELLIGENCE_CHAIN,
} from './salesHead.js'
export { LEAD_QUALIFIER_CONFIG } from './leadQualifier.js'
export { PROPOSAL_GENERATOR_CONFIG } from './proposalGenerator.js'
export { FOLLOWUP_DRAFTER_CONFIG } from './followUpDrafter.js'
export { PIPELINE_TRACKER_CONFIG } from './pipelineTracker.js'
export { COMPETITOR_WATCHER_CONFIG } from './competitorWatcher.js'

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import type { SubAgentRegistry } from '../../../registry/subAgentRegistry.js'
import { SALES_HEAD_CONFIG } from './salesHead.js'
import { LEAD_QUALIFIER_CONFIG } from './leadQualifier.js'
import { PROPOSAL_GENERATOR_CONFIG } from './proposalGenerator.js'
import { FOLLOWUP_DRAFTER_CONFIG } from './followUpDrafter.js'
import { PIPELINE_TRACKER_CONFIG } from './pipelineTracker.js'
import { COMPETITOR_WATCHER_CONFIG } from './competitorWatcher.js'

export const SALES_DEPARTMENT_CONFIGS: AgentHierarchyConfig[] = [
  SALES_HEAD_CONFIG,
  LEAD_QUALIFIER_CONFIG,
  PROPOSAL_GENERATOR_CONFIG,
  FOLLOWUP_DRAFTER_CONFIG,
  PIPELINE_TRACKER_CONFIG,
  COMPETITOR_WATCHER_CONFIG,
]

export function registerSalesDepartment(registry: SubAgentRegistry): void {
  registry.registerBatch(SALES_DEPARTMENT_CONFIGS)
}
