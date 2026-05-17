/**
 * Engineering Department Sub-Agents — Barrel Index
 *
 * File implementasi:
 * - engineeringHead.ts — Engineering Head config + baton chains
 * - codeReviewer.ts   — CodeReviewer specialist
 * - bugHunter.ts      — BugHunter specialist
 * - docsWriter.ts     — DocsWriter specialist
 * - infraMonitor.ts   — InfraMonitor specialist
 * - testGenerator.ts  — TestGenerator specialist
 * - prSummarizer.ts   — PRSummarizer specialist
 */

export {
  ENGINEERING_HEAD_CONFIG,
  ENGINEERING_PR_CHAIN,
  ENGINEERING_BUG_CHAIN,
} from './engineeringHead.js'
export { CODE_REVIEWER_CONFIG } from './codeReviewer.js'
export { BUG_HUNTER_CONFIG } from './bugHunter.js'
export { DOCS_WRITER_CONFIG } from './docsWriter.js'
export { INFRA_MONITOR_CONFIG } from './infraMonitor.js'
export { TEST_GENERATOR_CONFIG } from './testGenerator.js'
export { PR_SUMMARIZER_CONFIG } from './prSummarizer.js'

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import type { SubAgentRegistry } from '../../../registry/subAgentRegistry.js'
import { ENGINEERING_HEAD_CONFIG } from './engineeringHead.js'
import { CODE_REVIEWER_CONFIG } from './codeReviewer.js'
import { BUG_HUNTER_CONFIG } from './bugHunter.js'
import { DOCS_WRITER_CONFIG } from './docsWriter.js'
import { INFRA_MONITOR_CONFIG } from './infraMonitor.js'
import { TEST_GENERATOR_CONFIG } from './testGenerator.js'
import { PR_SUMMARIZER_CONFIG } from './prSummarizer.js'

export const ENGINEERING_DEPARTMENT_CONFIGS: AgentHierarchyConfig[] = [
  ENGINEERING_HEAD_CONFIG,
  CODE_REVIEWER_CONFIG,
  BUG_HUNTER_CONFIG,
  DOCS_WRITER_CONFIG,
  INFRA_MONITOR_CONFIG,
  TEST_GENERATOR_CONFIG,
  PR_SUMMARIZER_CONFIG,
]

export function registerEngineeringDepartment(registry: SubAgentRegistry): void {
  registry.registerBatch(ENGINEERING_DEPARTMENT_CONFIGS)
}
