/**
 * InfraMonitor Sub-Agent — Engineering Department
 *
 * Fungsi: Memantau metrik server, uptime, penggunaan cloud, dan alert sistem.
 * Input:  Metrics dari server/cloud monitoring
 * Output: Status report dan alert ke Slack channel engineering
 * Trigger: Otomatis setiap 6 jam, atau on-demand jika alert masuk
 * Tools:  slack, github, bash_tool
 */

import type { AgentHierarchyConfig } from '../../../domain/hierarchy.js'
import { makeSpecialistConfig } from '../../../domain/hierarchy.js'

export const INFRA_MONITOR_CONFIG: AgentHierarchyConfig = makeSpecialistConfig({
  agentId: 'eng-infra-monitor',
  parentAgentId: 'engineering-head',
  departmentName: 'engineering',
  allowedMcpTools: ['slack', 'github', 'bash_tool'],
  roleDescription:
    'Memantau metrik server, uptime, penggunaan cloud, dan alert. ' +
    'Output: status report dan alert ke channel Slack.',
})
export { executeEngInfraMonitorFile as execute } from '../../../runtime/subagents/fileExecuteBindings.js'
