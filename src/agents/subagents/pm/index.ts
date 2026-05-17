/**
 * PM Department Sub-Agents — Barrel Index
 *
 * File implementasi:
 * - pmHead.ts            — PM Head config + baton chains
 * - taskCoordinator.ts  — TaskCoordinator specialist
 * - riskAnalyzer.ts     — RiskAnalyzer specialist
 * - sprintPlanner.ts    — SprintPlanner specialist
 * - progressReporter.ts — ProgressReporter specialist
 * - deadlineWatcher.ts  — DeadlineWatcher specialist
 */

export { PM_HEAD_CONFIG, PM_SPRINT_CHAIN, PM_REPORTING_CHAIN } from './pmHead.js'
export { TASK_COORDINATOR_CONFIG } from './taskCoordinator.js'
export { RISK_ANALYZER_CONFIG } from './riskAnalyzer.js'
export { SPRINT_PLANNER_CONFIG } from './sprintPlanner.js'
export { PROGRESS_REPORTER_CONFIG } from './progressReporter.js'
export { DEADLINE_WATCHER_CONFIG } from './deadlineWatcher.js'

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import type { SubAgentRegistry } from '../../../registry/subAgentRegistry.js'
import { PM_HEAD_CONFIG, PM_SPRINT_CHAIN } from './pmHead.js'
import { TASK_COORDINATOR_CONFIG } from './taskCoordinator.js'
import { RISK_ANALYZER_CONFIG } from './riskAnalyzer.js'
import { SPRINT_PLANNER_CONFIG } from './sprintPlanner.js'
import { PROGRESS_REPORTER_CONFIG } from './progressReporter.js'
import { DEADLINE_WATCHER_CONFIG } from './deadlineWatcher.js'

export const PM_DEPARTMENT_CONFIGS: AgentHierarchyConfig[] = [
  PM_HEAD_CONFIG,
  TASK_COORDINATOR_CONFIG,
  RISK_ANALYZER_CONFIG,
  SPRINT_PLANNER_CONFIG,
  PROGRESS_REPORTER_CONFIG,
  DEADLINE_WATCHER_CONFIG,
]

export function registerPMDepartment(registry: SubAgentRegistry): void {
  registry.registerBatch(PM_DEPARTMENT_CONFIGS)
}

/**
 * Jalankan sprint chain PM end-to-end (risk → plan → deadlines).
 */
export async function runPMSprintChain(
  registry: SubAgentRegistry,
  payload: unknown,
  options?: { mode?: import('../../../runtime/subagents/specialistExecutor.js').SubAgentExecutorMode },
) {
  const { SubAgentSpecialistExecutor } = await import('../../../runtime/subagents/specialistExecutor.js')
  const { runBatonChain } = await import('../../../runtime/subagents/departmentRunner.js')
  const executor = new SubAgentSpecialistExecutor({
    registry,
    mode: options?.mode ?? 'deterministic',
  })
  return runBatonChain({
    registry,
    executor,
    delegatorId: PM_HEAD_CONFIG.agentId,
    departmentName: 'project-manager',
    agentChain: PM_SPRINT_CHAIN,
    payload,
  })
}
