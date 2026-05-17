/**
 * Marketing Department Sub-Agents — Barrel Index
 *
 * Re-exports semua specialist configs, head config, baton chains,
 * dan registration helper.
 *
 * Implementasi tiap specialist ada di file masing-masing:
 * - contentCreator.ts
 * - seoSpecialist.ts
 * - campaignManager.ts
 * - analyticsReader.ts
 * - socialScheduler.ts
 * - trendWatcher.ts
 * - marketingHead.ts
 */

export { CONTENT_CREATOR_CONFIG } from './contentCreator.js'
export { SEO_SPECIALIST_CONFIG } from './seoSpecialist.js'
export { CAMPAIGN_MANAGER_CONFIG } from './campaignManager.js'
export { ANALYTICS_READER_CONFIG } from './analyticsReader.js'
export { SOCIAL_SCHEDULER_CONFIG } from './socialScheduler.js'
export { TREND_WATCHER_CONFIG } from './trendWatcher.js'
export {
  MARKETING_HEAD_CONFIG,
  MARKETING_CAMPAIGN_CHAIN,
  MARKETING_PLANNING_CHAIN,
} from './marketingHead.js'

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import type { SubAgentRegistry } from '../../../registry/subAgentRegistry.js'
import { CONTENT_CREATOR_CONFIG } from './contentCreator.js'
import { SEO_SPECIALIST_CONFIG } from './seoSpecialist.js'
import { CAMPAIGN_MANAGER_CONFIG } from './campaignManager.js'
import { ANALYTICS_READER_CONFIG } from './analyticsReader.js'
import { SOCIAL_SCHEDULER_CONFIG } from './socialScheduler.js'
import { TREND_WATCHER_CONFIG } from './trendWatcher.js'
import { MARKETING_HEAD_CONFIG } from './marketingHead.js'

export const MARKETING_DEPARTMENT_CONFIGS: AgentHierarchyConfig[] = [
  MARKETING_HEAD_CONFIG,
  CONTENT_CREATOR_CONFIG,
  SEO_SPECIALIST_CONFIG,
  CAMPAIGN_MANAGER_CONFIG,
  ANALYTICS_READER_CONFIG,
  SOCIAL_SCHEDULER_CONFIG,
  TREND_WATCHER_CONFIG,
]

/**
 * Daftarkan semua agen marketing ke SubAgentRegistry.
 * Dipanggil saat bootstrap sistem.
 */
export function registerMarketingDepartment(registry: SubAgentRegistry): void {
  registry.registerBatch(MARKETING_DEPARTMENT_CONFIGS)
}
