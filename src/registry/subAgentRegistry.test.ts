/**
 * SubAgentRegistry Tests — Task 1.3
 */

import { describe, it, expect, beforeEach } from 'bun:test'
import { SubAgentRegistry, SubAgentRegistryError } from './subAgentRegistry.js'
import type { AgentHierarchyConfig } from '../domain/hierarchy.js'

const CEO_CONFIG: AgentHierarchyConfig = {
  agentId: 'ceo-agent',
  roleType: 'ceo',
  departmentName: 'executive',
  subAgentIds: ['ceo-strategy-analyst', 'ceo-report-summarizer'],
  allowedMcpTools: ['notion', 'slack', 'google_sheets', 'gmail', 'google_calendar', 'anthropic_api'],
  roleDescription: 'Orchestrator strategis perusahaan',
}

const STRATEGY_CONFIG: AgentHierarchyConfig = {
  agentId: 'ceo-strategy-analyst',
  roleType: 'specialist',
  parentAgentId: 'ceo-agent',
  departmentName: 'executive',
  subAgentIds: [],
  allowedMcpTools: ['web_search', 'notion', 'google_sheets'],
}

const REPORT_CONFIG: AgentHierarchyConfig = {
  agentId: 'ceo-report-summarizer',
  roleType: 'specialist',
  parentAgentId: 'ceo-agent',
  departmentName: 'executive',
  subAgentIds: [],
  allowedMcpTools: ['notion', 'slack', 'anthropic_api'],
}

const MARKETING_HEAD: AgentHierarchyConfig = {
  agentId: 'marketing-head',
  roleType: 'head',
  parentAgentId: 'ceo-agent',
  departmentName: 'marketing',
  subAgentIds: ['marketing-content-creator', 'marketing-seo-specialist'],
  allowedMcpTools: ['notion', 'slack', 'google_sheets'],
}

describe('SubAgentRegistry', () => {
  let registry: SubAgentRegistry

  beforeEach(() => {
    registry = new SubAgentRegistry()
  })

  // ---------------------------------------------------------------------------
  // Register single
  // ---------------------------------------------------------------------------

  it('mendaftarkan agen valid tanpa error', () => {
    expect(() => registry.register(CEO_CONFIG)).not.toThrow()
    expect(registry.size).toBe(1)
  })

  it('melempar INVALID_CONFIG jika config tidak valid', () => {
    let err: SubAgentRegistryError | undefined
    try {
      registry.register({ agentId: '', roleType: 'ceo', departmentName: 'x', subAgentIds: [], allowedMcpTools: [] })
    } catch (e) {
      err = e as SubAgentRegistryError
    }
    expect(err).toBeDefined()
    expect(err?.code).toBe('INVALID_CONFIG')
  })

  it('melempar INVALID_CONFIG jika MCP tool tidak valid', () => {
    let err: SubAgentRegistryError | undefined
    try {
      registry.register({ ...CEO_CONFIG, allowedMcpTools: ['invalid_tool_xyz'] })
    } catch (e) {
      err = e as SubAgentRegistryError
    }
    expect(err).toBeDefined()
    expect(err?.code).toBe('INVALID_CONFIG')
  })

  it('melempar DUPLICATE_ID jika ID sudah terdaftar', () => {
    registry.register(CEO_CONFIG)
    let err: SubAgentRegistryError | undefined
    try {
      registry.register(CEO_CONFIG)
    } catch (e) {
      err = e as SubAgentRegistryError
    }
    expect(err).toBeDefined()
    expect(err?.code).toBe('DUPLICATE_ID')
  })

  // ---------------------------------------------------------------------------
  // Register batch
  // ---------------------------------------------------------------------------

  it('mendaftarkan batch valid sekaligus', () => {
    registry.registerBatch([CEO_CONFIG, STRATEGY_CONFIG, REPORT_CONFIG])
    expect(registry.size).toBe(3)
  })

  it('membatalkan seluruh batch jika satu config invalid', () => {
    const badConfig = { agentId: '', roleType: 'specialist', departmentName: 'x', subAgentIds: [], allowedMcpTools: [] }
    let err: SubAgentRegistryError | undefined
    try {
      registry.registerBatch([CEO_CONFIG, badConfig])
    } catch (e) {
      err = e as SubAgentRegistryError
    }
    expect(err?.code).toBe('INVALID_CONFIG')
    // Batch dibatalkan — registry kosong
    expect(registry.size).toBe(0)
  })

  it('melempar DUPLICATE_ID jika ada duplikasi dalam batch', () => {
    let err: SubAgentRegistryError | undefined
    try {
      registry.registerBatch([CEO_CONFIG, CEO_CONFIG])
    } catch (e) {
      err = e as SubAgentRegistryError
    }
    expect(err?.code).toBe('DUPLICATE_ID')
  })

  // ---------------------------------------------------------------------------
  // Lookup
  // ---------------------------------------------------------------------------

  it('get mengembalikan config yang terdaftar', () => {
    registry.register(CEO_CONFIG)
    const result = registry.get('ceo-agent')
    expect(result.found).toBe(true)
    if (result.found) {
      expect(result.config.agentId).toBe('ceo-agent')
      expect(result.config.roleType).toBe('ceo')
    }
  })

  it('get mengembalikan found:false untuk ID tidak terdaftar', () => {
    const result = registry.get('unknown-agent')
    expect(result.found).toBe(false)
  })

  it('getOrThrow melempar NOT_FOUND untuk ID tidak terdaftar', () => {
    let err: SubAgentRegistryError | undefined
    try {
      registry.getOrThrow('unknown')
    } catch (e) {
      err = e as SubAgentRegistryError
    }
    expect(err?.code).toBe('NOT_FOUND')
  })

  it('getChildrenOf mengembalikan semua sub-agen langsung', () => {
    registry.registerBatch([CEO_CONFIG, STRATEGY_CONFIG, REPORT_CONFIG])
    const children = registry.getChildrenOf('ceo-agent')
    expect(children).toHaveLength(2)
    const ids = children.map(c => c.agentId).sort()
    expect(ids).toEqual(['ceo-report-summarizer', 'ceo-strategy-analyst'])
  })

  it('getChildrenOf mengembalikan array kosong jika tidak ada children', () => {
    registry.register(CEO_CONFIG)
    const children = registry.getChildrenOf('ceo-strategy-analyst')
    expect(children).toHaveLength(0)
  })

  it('getByDepartment mengembalikan semua agen dalam departemen', () => {
    registry.registerBatch([CEO_CONFIG, STRATEGY_CONFIG, REPORT_CONFIG, MARKETING_HEAD])
    const executiveDept = registry.getByDepartment('executive')
    expect(executiveDept).toHaveLength(3)
    const marketing = registry.getByDepartment('marketing')
    expect(marketing).toHaveLength(1)
  })

  it('getByRole mengembalikan agen berdasarkan role', () => {
    registry.registerBatch([CEO_CONFIG, STRATEGY_CONFIG, REPORT_CONFIG, MARKETING_HEAD])
    expect(registry.getByRole('ceo')).toHaveLength(1)
    expect(registry.getByRole('head')).toHaveLength(1)
    expect(registry.getByRole('specialist')).toHaveLength(2)
  })

  it('getByMcpTool mengembalikan agen yang punya akses ke tool', () => {
    registry.registerBatch([CEO_CONFIG, STRATEGY_CONFIG, REPORT_CONFIG])
    const notionAgents = registry.getByMcpTool('notion')
    expect(notionAgents.length).toBeGreaterThanOrEqual(2)
  })

  // ---------------------------------------------------------------------------
  // Config immutability
  // ---------------------------------------------------------------------------

  it('mutasi pada config hasil get tidak mempengaruhi registry', () => {
    registry.register(CEO_CONFIG)
    const result = registry.get('ceo-agent')
    if (result.found) {
      result.config.subAgentIds.push('hacked-agent')
    }
    const fresh = registry.get('ceo-agent')
    if (fresh.found) {
      expect(fresh.config.subAgentIds).not.toContain('hacked-agent')
    }
  })

  // ---------------------------------------------------------------------------
  // Integrity validation
  // ---------------------------------------------------------------------------

  it('validateIntegrity mengembalikan kosong jika semua valid', () => {
    registry.registerBatch([CEO_CONFIG, STRATEGY_CONFIG, REPORT_CONFIG])
    const errors = registry.validateIntegrity()
    expect(errors).toHaveLength(0)
  })

  it('validateIntegrity mendeteksi CEO dengan parentAgentId', () => {
    registry.register({ ...CEO_CONFIG, parentAgentId: 'some-parent' })
    const errors = registry.validateIntegrity()
    expect(errors.some(e => e.includes('CEO'))).toBe(true)
  })

  it('validateIntegrity mendeteksi specialist tanpa parentAgentId', () => {
    registry.register({ ...STRATEGY_CONFIG, parentAgentId: undefined })
    const errors = registry.validateIntegrity()
    expect(errors.some(e => e.includes('parentAgentId'))).toBe(true)
  })

  // ---------------------------------------------------------------------------
  // has / clear
  // ---------------------------------------------------------------------------

  it('has mengembalikan true jika terdaftar', () => {
    registry.register(CEO_CONFIG)
    expect(registry.has('ceo-agent')).toBe(true)
    expect(registry.has('unknown')).toBe(false)
  })

  it('clear menghapus semua agen', () => {
    registry.registerBatch([CEO_CONFIG, STRATEGY_CONFIG])
    registry.clear()
    expect(registry.size).toBe(0)
  })
})
