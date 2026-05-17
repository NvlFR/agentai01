/**
 * CEO Department Sub-Agents — Barrel Index
 *
 * Re-exports semua specialist configs, CEO agent config, baton chains,
 * dan registration helper.
 *
 * File implementasi:
 * - ceoAgent.ts         — CEO Agent config (roleType: 'ceo')
 * - strategyAnalyst.ts  — StrategyAnalyst specialist
 * - reportSummarizer.ts — ReportSummarizer specialist
 * - decisionLogger.ts   — DecisionLogger specialist
 * - okrTracker.ts       — OKRTracker specialist
 */

export { CEO_AGENT_CONFIG, CEO_BRIEFING_CHAIN, CEO_DECISION_CHAIN } from './ceoAgent.js'
export { STRATEGY_ANALYST_CONFIG } from './strategyAnalyst.js'
export { REPORT_SUMMARIZER_CONFIG } from './reportSummarizer.js'
export { DECISION_LOGGER_CONFIG } from './decisionLogger.js'
export { OKR_TRACKER_CONFIG } from './okrTracker.js'

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import type { SubAgentRegistry } from '../../../registry/subAgentRegistry.js'
import { CEO_AGENT_CONFIG } from './ceoAgent.js'
import { STRATEGY_ANALYST_CONFIG } from './strategyAnalyst.js'
import { REPORT_SUMMARIZER_CONFIG } from './reportSummarizer.js'
import { DECISION_LOGGER_CONFIG } from './decisionLogger.js'
import { OKR_TRACKER_CONFIG } from './okrTracker.js'

export const CEO_DEPARTMENT_CONFIGS: AgentHierarchyConfig[] = [
  CEO_AGENT_CONFIG,
  STRATEGY_ANALYST_CONFIG,
  REPORT_SUMMARIZER_CONFIG,
  DECISION_LOGGER_CONFIG,
  OKR_TRACKER_CONFIG,
]

export function registerCEODepartment(registry: SubAgentRegistry): void {
  registry.registerBatch(CEO_DEPARTMENT_CONFIGS)
}
