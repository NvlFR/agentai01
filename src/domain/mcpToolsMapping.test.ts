import { describe, expect, it } from 'bun:test'
import type { AgentHierarchyConfig } from './hierarchy.js'
import {
  AGENT_MCP_TOOL_PROFILES,
  ALL_MAPPED_AGENT_IDS,
  DESIGN_CANONICAL_TOOLS,
  LOGICAL_TOOL_TO_MCP_SERVERS,
  MCP_SERVER_IDS,
  REPOSITORY_CATALOG,
  getAgentMcpToolProfile,
  resolveMcpServersForTools,
  toolsEqual,
  validateAgentMcpToolBinding,
  validateRegistryMcpToolBindings,
} from './mcpToolsMapping.js'
import { MCP_TOOL_IDS } from './hierarchy.js'
import { CEO_DEPARTMENT_CONFIGS } from '../agents/subagents/ceo/index.js'
import { MARKETING_DEPARTMENT_CONFIGS } from '../agents/subagents/marketing/index.js'
import { SALES_DEPARTMENT_CONFIGS } from '../agents/subagents/sales/index.js'
import { PRODUCT_DEPARTMENT_CONFIGS } from '../agents/subagents/product/index.js'
import { ENGINEERING_DEPARTMENT_CONFIGS } from '../agents/subagents/engineering/index.js'
import { PM_DEPARTMENT_CONFIGS } from '../agents/subagents/pm/index.js'
import { SUPPORT_DEPARTMENT_CONFIGS } from '../agents/subagents/support/index.js'

const ALL_DEPARTMENT_CONFIGS: AgentHierarchyConfig[] = [
  ...CEO_DEPARTMENT_CONFIGS,
  ...MARKETING_DEPARTMENT_CONFIGS,
  ...SALES_DEPARTMENT_CONFIGS,
  ...PRODUCT_DEPARTMENT_CONFIGS,
  ...ENGINEERING_DEPARTMENT_CONFIGS,
  ...PM_DEPARTMENT_CONFIGS,
  ...SUPPORT_DEPARTMENT_CONFIGS,
]

describe('mcpToolsMapping', () => {
  it('memetakan setiap McpToolId master list ke minimal satu MCP server', () => {
    for (const toolId of MCP_TOOL_IDS) {
      expect(LOGICAL_TOOL_TO_MCP_SERVERS[toolId].length).toBeGreaterThan(0)
    }
  })

  it('resolveMcpServersForTools mengembalikan server yang terurut dan unik', () => {
    const servers = resolveMcpServersForTools(['web_search', 'notion', 'github'])
    expect(servers).toEqual(
      [...new Set(servers)].sort(),
    )
    expect(servers).toContain('brave-search')
    expect(servers).toContain('notion')
    expect(servers).toContain('github')
  })

  it('memiliki profil untuk setiap agen di design canonical table', () => {
    for (const agentId of Object.keys(DESIGN_CANONICAL_TOOLS)) {
      expect(getAgentMcpToolProfile(agentId)).toBeDefined()
    }
  })

  it('CEO orchestrator memiliki repositori antigravity-awesome-skills', () => {
    const profile = getAgentMcpToolProfile('ceo-agent')
    expect(profile?.repositories.map(r => r.id)).toContain('antigravity-awesome-skills')
    expect(profile?.mcpServers).toContain('notion')
  })

  it('marketing trend watcher dipetakan ke Lead Hunter dengan OpenOutreach', () => {
    const profile = getAgentMcpToolProfile('marketing-trend-watcher')
    expect(profile?.specRoleName).toBe('Lead Hunter Agent')
    expect(profile?.repositories.map(r => r.id)).toContain('open-outreach')
  })

  it('ALL_MAPPED_AGENT_IDS selaras dengan jumlah konfigurasi departemen', () => {
    expect(ALL_MAPPED_AGENT_IDS.length).toBe(ALL_DEPARTMENT_CONFIGS.length)
    expect(Object.keys(AGENT_MCP_TOOL_PROFILES).length).toBe(ALL_DEPARTMENT_CONFIGS.length)
  })

  it('setiap profil memiliki mcpServers yang merupakan subset MCP_SERVER_IDS', () => {
    for (const profile of Object.values(AGENT_MCP_TOOL_PROFILES)) {
      for (const serverId of profile.mcpServers) {
        expect(MCP_SERVER_IDS).toContain(serverId)
      }
    }
  })

  it('REPOSITORY_CATALOG berisi URL GitHub yang valid', () => {
    for (const repo of Object.values(REPOSITORY_CATALOG)) {
      expect(repo.url.startsWith('https://github.com/')).toBe(true)
    }
  })
})

describe('validateAgentMcpToolBinding', () => {
  it('semua konfigurasi departemen selaras dengan design.md', () => {
    const errors = validateRegistryMcpToolBindings(ALL_DEPARTMENT_CONFIGS, {
      requireFullCoverage: true,
    })
    expect(errors).toEqual([])
  })

  it('mendeteksi mismatch allowedMcpTools', () => {
    const config: AgentHierarchyConfig = {
      agentId: 'ceo-strategy-analyst',
      roleType: 'specialist',
      parentAgentId: 'ceo-agent',
      departmentName: 'executive',
      subAgentIds: [],
      allowedMcpTools: ['notion'],
    }
    const errors = validateAgentMcpToolBinding(config)
    expect(errors.some(e => e.includes('allowedMcpTools mismatch'))).toBe(true)
  })

  it('toolsEqual mengabaikan urutan', () => {
    expect(toolsEqual(['notion', 'slack'], ['slack', 'notion'])).toBe(true)
    expect(toolsEqual(['notion'], ['slack'])).toBe(false)
  })
})
