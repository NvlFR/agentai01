/**
 * Sub-Agent Hierarchy — Barrel Index
 *
 * Re-exports semua sub-agent configs dan registration helpers
 * dari seluruh departemen.
 */

export * from './ceo/index.js'
export * from './marketing/index.js'
export * from './sales/index.js'
export * from './product/index.js'
export * from './engineering/index.js'
export * from './pm/index.js'
export * from './support/index.js'

import type { SubAgentRegistry } from '../../registry/subAgentRegistry.js'
import { execute as executeCeoHead } from './ceo/ceoAgent.js'
import { registerCEODepartment } from './ceo/index.js'
import { execute as executeMarketingHead } from './marketing/marketingHead.js'
import { registerMarketingDepartment } from './marketing/index.js'
import { execute as executeSalesHead } from './sales/salesHead.js'
import { registerSalesDepartment } from './sales/index.js'
import { execute as executeProductHead } from './product/productHead.js'
import { registerProductDepartment } from './product/index.js'
import { execute as executeEngineeringHead } from './engineering/engineeringHead.js'
import { registerEngineeringDepartment } from './engineering/index.js'
import { execute as executePmHead } from './pm/pmHead.js'
import { registerPMDepartment } from './pm/index.js'
import { execute as executeSupportHead } from './support/supportHead.js'
import { registerSupportDepartment } from './support/index.js'
import type { DepartmentHeadExecutionArgs } from '../../runtime/subagents/headRuntime.js'
import type { SpecialistExecutionResult } from '../../runtime/subagents/types.js'

/** Daftarkan seluruh pohon sub-agen (7 departemen + CEO). */
export function registerAllSubAgentDepartments(registry: SubAgentRegistry): void {
  registerCEODepartment(registry)
  registerMarketingDepartment(registry)
  registerSalesDepartment(registry)
  registerProductDepartment(registry)
  registerEngineeringDepartment(registry)
  registerPMDepartment(registry)
  registerSupportDepartment(registry)
}

export type DepartmentHeadAgentId =
  | 'ceo-agent'
  | 'marketing-head'
  | 'sales-head'
  | 'product-head'
  | 'engineering-head'
  | 'pm-head'
  | 'support-head'

const DEPARTMENT_HEAD_EXECUTORS: Record<
  DepartmentHeadAgentId,
  (args: DepartmentHeadExecutionArgs) => Promise<SpecialistExecutionResult>
> = {
  'ceo-agent': executeCeoHead,
  'marketing-head': executeMarketingHead,
  'sales-head': executeSalesHead,
  'product-head': executeProductHead,
  'engineering-head': executeEngineeringHead,
  'pm-head': executePmHead,
  'support-head': executeSupportHead,
}

export async function executeDepartmentHeadAgent(
  headAgentId: DepartmentHeadAgentId,
  args: DepartmentHeadExecutionArgs,
) {
  return DEPARTMENT_HEAD_EXECUTORS[headAgentId](args)
}

export {
  getAgentMcpToolProfile,
  resolveMcpServersForTools,
  validateAgentMcpToolBinding,
  AGENT_MCP_TOOL_PROFILES,
  DESIGN_CANONICAL_TOOLS,
  MCP_SERVER_CATALOG,
} from '../../domain/mcpToolsMapping.js'

export {
  SubAgentSpecialistExecutor,
  runBatonChain,
  type BatonChainRunResult,
  type SpecialistExecutionResult,
  type SubAgentExecutorMode,
} from '../../runtime/subagents/index.js'
