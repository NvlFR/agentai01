/**
 * Product Department Sub-Agents — Barrel Index
 *
 * File implementasi:
 * - productHead.ts        — Product Head config + baton chains
 * - userResearcher.ts     — UserResearcher specialist
 * - featurePrioritizer.ts — FeaturePrioritizer specialist
 * - prdWriter.ts          — PRDWriter specialist
 * - roadmapBuilder.ts     — RoadmapBuilder specialist
 * - feedbackAnalyzer.ts   — FeedbackAnalyzer specialist
 */

export {
  PRODUCT_HEAD_CONFIG,
  PRODUCT_DISCOVERY_CHAIN,
  PRODUCT_PLANNING_CHAIN,
} from './productHead.js'
export { USER_RESEARCHER_CONFIG } from './userResearcher.js'
export { FEATURE_PRIORITIZER_CONFIG } from './featurePrioritizer.js'
export { PRD_WRITER_CONFIG } from './prdWriter.js'
export { ROADMAP_BUILDER_CONFIG } from './roadmapBuilder.js'
export { FEEDBACK_ANALYZER_CONFIG } from './feedbackAnalyzer.js'

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import type { SubAgentRegistry } from '../../../registry/subAgentRegistry.js'
import { PRODUCT_HEAD_CONFIG } from './productHead.js'
import { USER_RESEARCHER_CONFIG } from './userResearcher.js'
import { FEATURE_PRIORITIZER_CONFIG } from './featurePrioritizer.js'
import { PRD_WRITER_CONFIG } from './prdWriter.js'
import { ROADMAP_BUILDER_CONFIG } from './roadmapBuilder.js'
import { FEEDBACK_ANALYZER_CONFIG } from './feedbackAnalyzer.js'

export const PRODUCT_DEPARTMENT_CONFIGS: AgentHierarchyConfig[] = [
  PRODUCT_HEAD_CONFIG,
  USER_RESEARCHER_CONFIG,
  FEATURE_PRIORITIZER_CONFIG,
  PRD_WRITER_CONFIG,
  ROADMAP_BUILDER_CONFIG,
  FEEDBACK_ANALYZER_CONFIG,
]

export function registerProductDepartment(registry: SubAgentRegistry): void {
  registry.registerBatch(PRODUCT_DEPARTMENT_CONFIGS)
}
