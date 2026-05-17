/**
 * Marketing Department Integration Tests — Task 3.7
 */

import { describe, it, expect, beforeEach } from 'bun:test'
import { SubAgentRegistry } from '../../../registry/subAgentRegistry.js'
import {
  MARKETING_DEPARTMENT_CONFIGS,
  MARKETING_HEAD_CONFIG,
  CONTENT_CREATOR_CONFIG,
  SEO_SPECIALIST_CONFIG,
  CAMPAIGN_MANAGER_CONFIG,
  ANALYTICS_READER_CONFIG,
  SOCIAL_SCHEDULER_CONFIG,
  TREND_WATCHER_CONFIG,
  MARKETING_CAMPAIGN_CHAIN,
  MARKETING_PLANNING_CHAIN,
  registerMarketingDepartment,
} from './index.js'
import { BatonPassingOrchestrator } from '../../../runtime/batonPassing.js'
import { IntraDepartmentScratchpad } from '../../../runtime/scratchpad.js'

describe('Marketing Department Sub-Agents', () => {
  let registry: SubAgentRegistry

  beforeEach(() => {
    registry = new SubAgentRegistry()
  })

  // ---------------------------------------------------------------------------
  // Config completeness
  // ---------------------------------------------------------------------------

  it('semua 7 konfigurasi marketing terdefinisi', () => {
    expect(MARKETING_DEPARTMENT_CONFIGS).toHaveLength(7)
  })

  it('Marketing Head memiliki 6 sub-agent IDs', () => {
    expect(MARKETING_HEAD_CONFIG.subAgentIds).toHaveLength(6)
  })

  it('semua specialist punya parentAgentId = marketing-head', () => {
    const specialists = [
      CONTENT_CREATOR_CONFIG,
      SEO_SPECIALIST_CONFIG,
      CAMPAIGN_MANAGER_CONFIG,
      ANALYTICS_READER_CONFIG,
      SOCIAL_SCHEDULER_CONFIG,
      TREND_WATCHER_CONFIG,
    ]
    for (const config of specialists) {
      expect(config.roleType).toBe('specialist')
      expect(config.parentAgentId).toBe('marketing-head')
      expect(config.departmentName).toBe('marketing')
    }
  })

  it('MCP tools setiap specialist sesuai spec', () => {
    expect(CONTENT_CREATOR_CONFIG.allowedMcpTools).toContain('canva_mcp')
    expect(SEO_SPECIALIST_CONFIG.allowedMcpTools).toContain('web_search')
    expect(CAMPAIGN_MANAGER_CONFIG.allowedMcpTools).toContain('whatsapp_api')
    expect(ANALYTICS_READER_CONFIG.allowedMcpTools).toContain('google_sheets')
    expect(SOCIAL_SCHEDULER_CONFIG.allowedMcpTools).toContain('google_calendar')
    expect(TREND_WATCHER_CONFIG.allowedMcpTools).toContain('web_search')
  })

  // ---------------------------------------------------------------------------
  // Registration
  // ---------------------------------------------------------------------------

  it('registerMarketingDepartment mendaftarkan semua agen tanpa error', () => {
    // Daftarkan CEO sebagai parent dulu
    registry.register({
      agentId: 'ceo-agent',
      roleType: 'ceo',
      departmentName: 'executive',
      subAgentIds: ['marketing-head'],
      allowedMcpTools: ['notion'],
    })
    expect(() => registerMarketingDepartment(registry)).not.toThrow()
    expect(registry.size).toBe(8) // 1 CEO + 7 marketing
  })

  it('getByDepartment mengembalikan 7 agen marketing', () => {
    registry.register({
      agentId: 'ceo-agent',
      roleType: 'ceo',
      departmentName: 'executive',
      subAgentIds: ['marketing-head'],
      allowedMcpTools: ['notion'],
    })
    registerMarketingDepartment(registry)
    const agents = registry.getByDepartment('marketing')
    expect(agents).toHaveLength(7)
  })

  it('getChildrenOf marketing-head mengembalikan 6 specialist', () => {
    registry.register({
      agentId: 'ceo-agent',
      roleType: 'ceo',
      departmentName: 'executive',
      subAgentIds: ['marketing-head'],
      allowedMcpTools: ['notion'],
    })
    registerMarketingDepartment(registry)
    const children = registry.getChildrenOf('marketing-head')
    expect(children).toHaveLength(6)
    expect(children.every(c => c.roleType === 'specialist')).toBe(true)
  })

  // ---------------------------------------------------------------------------
  // Baton chain integration
  // ---------------------------------------------------------------------------

  it('MARKETING_CAMPAIGN_CHAIN berisi 3 agen yang benar', () => {
    expect(MARKETING_CAMPAIGN_CHAIN).toHaveLength(3)
    expect(MARKETING_CAMPAIGN_CHAIN[0]).toBe('marketing-content-creator')
    expect(MARKETING_CAMPAIGN_CHAIN[1]).toBe('marketing-seo-specialist')
    expect(MARKETING_CAMPAIGN_CHAIN[2]).toBe('marketing-campaign-manager')
  })

  it('simulasi full campaign baton chain berhasil', () => {
    const pad = new IntraDepartmentScratchpad('marketing')
    const orch = new BatonPassingOrchestrator(pad)

    const NOW = '2026-05-17T10:00:00.000Z'
    const delegateResult = orch.delegate({
      delegatorId: 'marketing-head',
      departmentName: 'marketing',
      agentChain: [...MARKETING_CAMPAIGN_CHAIN],
      payload: { brief: 'Q2 Product Launch Campaign' },
      now: NOW,
    })
    expect(delegateResult.success).toBe(true)
    if (!delegateResult.success) return

    const { taskId } = delegateResult

    // Content Creator menulis draf
    orch.pass({ taskId, agentId: 'marketing-content-creator', output: { draft: 'Launch Article' }, now: NOW })
    // SEO Specialist mengoptimasi
    orch.pass({ taskId, agentId: 'marketing-seo-specialist', output: { optimizedDraft: 'Launch Article (SEO)', keywords: ['product', 'launch'] }, now: NOW })
    // Campaign Manager mengeksekusi
    const finalPass = orch.pass({ taskId, agentId: 'marketing-campaign-manager', output: { campaignId: 'camp-001', sent: 1200 }, now: NOW })

    expect(finalPass.success).toBe(true)
    if (!finalPass.success) return
    expect(finalPass.taskComplete).toBe(true)

    const task = orch.getTask(taskId)
    expect(task?.status).toBe('completed')
    expect(task?.results).toHaveLength(3)

    const finalOutput = orch.getFinalOutput(taskId)
    expect((finalOutput as { campaignId: string }).campaignId).toBe('camp-001')
  })

  it('MARKETING_PLANNING_CHAIN berisi 3 agen perencanaan', () => {
    expect(MARKETING_PLANNING_CHAIN).toHaveLength(3)
    expect(MARKETING_PLANNING_CHAIN[0]).toBe('marketing-trend-watcher')
    expect(MARKETING_PLANNING_CHAIN[1]).toBe('marketing-analytics-reader')
    expect(MARKETING_PLANNING_CHAIN[2]).toBe('marketing-social-scheduler')
  })
})
