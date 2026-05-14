/**
 * Unit tests for AgentRegistry (src/registry/AgentRegistry.ts)
 *
 * Covers all four sub-tasks of Task 2:
 *   2.1 Agent state management
 *   2.2 Project state management
 *   2.3 Access validation (agent ↔ project)
 *   2.4 Append-only state history
 *
 * Requirements validated:
 *   - Req 10 (Dashboard dan State Terpadu): AC 2, 3, 4
 *   - Req 11 (Keamanan dan Isolasi Lintas Proyek): AC 2, 3, 5
 */

import { describe, expect, it, beforeEach } from 'bun:test'
import { AgentRegistry } from './AgentRegistry.js'
import type { AgentRegistryEntry, ProjectRegistryEntry, Agent_Message } from '../domain/types.js'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeAgent(overrides: Partial<AgentRegistryEntry> = {}): AgentRegistryEntry {
  return {
    agent_id: 'sales-1',
    agent_type: 'sales_agent',
    status: 'idle',
    current_project_id: 'proj-001',
    last_activity_timestamp: '2026-05-14T09:00:00Z',
    ...overrides,
  }
}

function makeProject(overrides: Partial<ProjectRegistryEntry> = {}): ProjectRegistryEntry {
  return {
    project_id: 'proj-001',
    client_id: 'acme-corp',
    lifecycle_state: 'lead',
    active_agent_ids: ['sales-1'],
    current_milestone: 'lead_created',
    updated_at: '2026-05-14T09:00:00Z',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// 2.1 Agent state management
// ---------------------------------------------------------------------------

describe('AgentRegistry — 2.1 Agent state management', () => {
  let registry: AgentRegistry

  beforeEach(() => {
    registry = new AgentRegistry()
  })

  it('registers a new agent and retrieves it by ID', () => {
    const agent = makeAgent()
    registry.registerAgent(agent)

    const retrieved = registry.getAgent('sales-1')
    expect(retrieved).toBeDefined()
    expect(retrieved!.agent_id).toBe('sales-1')
    expect(retrieved!.agent_type).toBe('sales_agent')
    expect(retrieved!.status).toBe('idle')
    expect(retrieved!.current_project_id).toBe('proj-001')
    expect(retrieved!.last_activity_timestamp).toBe('2026-05-14T09:00:00Z')
  })

  it('returns undefined for an unregistered agent', () => {
    expect(registry.getAgent('nonexistent')).toBeUndefined()
  })

  it('overwrites an existing agent on re-registration', () => {
    registry.registerAgent(makeAgent({ status: 'idle' }))
    registry.registerAgent(makeAgent({ status: 'busy' }))

    expect(registry.getAgent('sales-1')!.status).toBe('busy')
  })

  it('updates specific fields of an existing agent', () => {
    registry.registerAgent(makeAgent({ status: 'idle' }))
    registry.updateAgent('sales-1', { status: 'busy', last_activity_timestamp: '2026-05-14T10:00:00Z' })

    const updated = registry.getAgent('sales-1')!
    expect(updated.status).toBe('busy')
    expect(updated.last_activity_timestamp).toBe('2026-05-14T10:00:00Z')
    // Unchanged fields remain
    expect(updated.agent_type).toBe('sales_agent')
    expect(updated.current_project_id).toBe('proj-001')
  })

  it('throws when updating a non-existent agent', () => {
    expect(() => registry.updateAgent('ghost', { status: 'offline' })).toThrow(
      'Agent not found: ghost',
    )
  })

  it('agent_id cannot be changed via updateAgent', () => {
    registry.registerAgent(makeAgent())
    // TypeScript prevents passing agent_id in updates, but we verify runtime safety
    registry.updateAgent('sales-1', { status: 'error' })
    expect(registry.getAgent('sales-1')!.agent_id).toBe('sales-1')
  })

  it('lists all registered agents', () => {
    registry.registerAgent(makeAgent({ agent_id: 'sales-1', agent_type: 'sales_agent' }))
    registry.registerAgent(makeAgent({ agent_id: 'eng-1', agent_type: 'engineering_agent' }))

    const agents = registry.listAgents()
    expect(agents).toHaveLength(2)
    const ids = agents.map(a => a.agent_id)
    expect(ids).toContain('sales-1')
    expect(ids).toContain('eng-1')
  })

  it('returns an empty list when no agents are registered', () => {
    expect(registry.listAgents()).toHaveLength(0)
  })

  it('getAgent returns a copy — mutations do not affect registry state', () => {
    registry.registerAgent(makeAgent({ status: 'idle' }))
    const copy = registry.getAgent('sales-1')!
    copy.status = 'error'
    expect(registry.getAgent('sales-1')!.status).toBe('idle')
  })

  it('supports all AgentStatus values', () => {
    const statuses = ['idle', 'busy', 'offline', 'error', 'stale'] as const
    for (const status of statuses) {
      registry.registerAgent(makeAgent({ agent_id: `agent-${status}`, status }))
      expect(registry.getAgent(`agent-${status}`)!.status).toBe(status)
    }
  })

  it('supports agent without current_project_id (optional field)', () => {
    const agent = makeAgent({ current_project_id: undefined })
    registry.registerAgent(agent)
    expect(registry.getAgent('sales-1')!.current_project_id).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// 2.2 Project state management
// ---------------------------------------------------------------------------

describe('AgentRegistry — 2.2 Project state management', () => {
  let registry: AgentRegistry

  beforeEach(() => {
    registry = new AgentRegistry()
  })

  it('registers a new project and retrieves it by ID', () => {
    const project = makeProject()
    registry.registerProject(project)

    const retrieved = registry.getProject('proj-001')
    expect(retrieved).toBeDefined()
    expect(retrieved!.project_id).toBe('proj-001')
    expect(retrieved!.client_id).toBe('acme-corp')
    expect(retrieved!.lifecycle_state).toBe('lead')
    expect(retrieved!.active_agent_ids).toEqual(['sales-1'])
    expect(retrieved!.current_milestone).toBe('lead_created')
    expect(retrieved!.updated_at).toBe('2026-05-14T09:00:00Z')
  })

  it('returns undefined for an unregistered project', () => {
    expect(registry.getProject('nonexistent')).toBeUndefined()
  })

  it('overwrites an existing project on re-registration', () => {
    registry.registerProject(makeProject({ lifecycle_state: 'lead' }))
    registry.registerProject(makeProject({ lifecycle_state: 'qualified' }))

    expect(registry.getProject('proj-001')!.lifecycle_state).toBe('qualified')
  })

  it('updates specific fields of an existing project', () => {
    registry.registerProject(makeProject({ lifecycle_state: 'lead' }))
    registry.updateProject('proj-001', {
      lifecycle_state: 'qualified',
      current_milestone: 'lead_qualified',
      updated_at: '2026-05-14T11:00:00Z',
    })

    const updated = registry.getProject('proj-001')!
    expect(updated.lifecycle_state).toBe('qualified')
    expect(updated.current_milestone).toBe('lead_qualified')
    expect(updated.updated_at).toBe('2026-05-14T11:00:00Z')
    // Unchanged fields remain
    expect(updated.client_id).toBe('acme-corp')
  })

  it('throws when updating a non-existent project', () => {
    expect(() =>
      registry.updateProject('ghost-proj', { lifecycle_state: 'won' }),
    ).toThrow('Project not found: ghost-proj')
  })

  it('project_id cannot be changed via updateProject', () => {
    registry.registerProject(makeProject())
    registry.updateProject('proj-001', { lifecycle_state: 'qualified' })
    expect(registry.getProject('proj-001')!.project_id).toBe('proj-001')
  })

  it('lists all registered projects', () => {
    registry.registerProject(makeProject({ project_id: 'proj-001' }))
    registry.registerProject(makeProject({ project_id: 'proj-002' }))

    const projects = registry.listProjects()
    expect(projects).toHaveLength(2)
    const ids = projects.map(p => p.project_id)
    expect(ids).toContain('proj-001')
    expect(ids).toContain('proj-002')
  })

  it('returns an empty list when no projects are registered', () => {
    expect(registry.listProjects()).toHaveLength(0)
  })

  it('getProject returns a copy — mutations do not affect registry state', () => {
    registry.registerProject(makeProject({ lifecycle_state: 'lead' }))
    const copy = registry.getProject('proj-001')!
    copy.lifecycle_state = 'closed'
    expect(registry.getProject('proj-001')!.lifecycle_state).toBe('lead')
  })

  it('active_agent_ids is a copy — external mutations do not affect registry', () => {
    registry.registerProject(makeProject({ active_agent_ids: ['sales-1'] }))
    const copy = registry.getProject('proj-001')!
    copy.active_agent_ids.push('eng-1')
    expect(registry.getProject('proj-001')!.active_agent_ids).toHaveLength(1)
  })

  it('supports all Lifecycle_State values', () => {
    const states = [
      'lead', 'qualified', 'proposal', 'won', 'discovery',
      'implementation', 'qa', 'delivered', 'support', 'closed',
    ] as const
    for (const state of states) {
      registry.registerProject(makeProject({ project_id: `proj-${state}`, lifecycle_state: state }))
      expect(registry.getProject(`proj-${state}`)!.lifecycle_state).toBe(state)
    }
  })

  it('getState returns a snapshot of all agents and projects', () => {
    registry.registerAgent(makeAgent())
    registry.registerProject(makeProject())

    const state = registry.getState()
    expect(state.agents['sales-1']).toBeDefined()
    expect(state.projects['proj-001']).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// 2.3 Access validation
// ---------------------------------------------------------------------------

describe('AgentRegistry — 2.3 Access validation', () => {
  let registry: AgentRegistry

  beforeEach(() => {
    registry = new AgentRegistry()
    registry.registerAgent(makeAgent({ agent_id: 'sales-1', agent_type: 'sales_agent', current_project_id: 'proj-001' }))
    registry.registerAgent(makeAgent({ agent_id: 'prod-1', agent_type: 'product_agent', current_project_id: 'proj-001' }))
    registry.registerProject(makeProject({ project_id: 'proj-001' }))
  })

  // validateAgentProjectAccess

  it('allows access when agent current_project_id matches requested projectId', () => {
    const result = registry.validateAgentProjectAccess('sales-1', 'proj-001')
    expect(result.allowed).toBe(true)
  })

  it('denies access when agent current_project_id does not match', () => {
    const result = registry.validateAgentProjectAccess('sales-1', 'proj-999')
    expect(result.allowed).toBe(false)
    if (!result.allowed) {
      expect(result.reason).toContain('proj-999')
    }
  })

  it('denies access when agent has no current_project_id', () => {
    registry.registerAgent(makeAgent({ agent_id: 'idle-agent', current_project_id: undefined }))
    const result = registry.validateAgentProjectAccess('idle-agent', 'proj-001')
    expect(result.allowed).toBe(false)
  })

  it('denies access when agent is not registered', () => {
    const result = registry.validateAgentProjectAccess('ghost-agent', 'proj-001')
    expect(result.allowed).toBe(false)
    if (!result.allowed) {
      expect(result.reason).toContain('ghost-agent')
    }
  })

  it('logs denied access to the audit log', () => {
    registry.validateAgentProjectAccess('sales-1', 'proj-999')
    const log = registry.getAuditLog()
    const denied = log.filter(e => e.event === 'access_denied')
    expect(denied.length).toBeGreaterThan(0)
    expect(denied[0]!.agent_id).toBe('sales-1')
    expect(denied[0]!.project_id).toBe('proj-999')
  })

  // validateMessageAccess

  it('allows a message when both sender and receiver are authorised for the project', () => {
    const message: Agent_Message = {
      from: 'sales_agent',
      to: 'product_agent',
      message_type: 'lead_handoff',
      project_id: 'proj-001',
      timestamp: '2026-05-14T09:30:00Z',
      payload: {},
    }
    const result = registry.validateMessageAccess(message)
    expect(result.allowed).toBe(true)
  })

  it('denies a message when sender is not authorised for the project', () => {
    // sales-1 is on proj-001, message targets proj-999
    const message: Agent_Message = {
      from: 'sales_agent',
      to: 'product_agent',
      message_type: 'lead_handoff',
      project_id: 'proj-999',
      timestamp: '2026-05-14T09:30:00Z',
      payload: {},
    }
    const result = registry.validateMessageAccess(message)
    expect(result.allowed).toBe(false)
  })

  it('denies a message when receiver is not authorised for the project', () => {
    // Register a product agent on a different project
    registry.registerAgent(makeAgent({
      agent_id: 'prod-2',
      agent_type: 'product_agent',
      current_project_id: 'proj-002',
    }))
    // Now there are two product_agent entries; the first one found (prod-1) is on proj-001
    // but we want to test the case where the receiver is on a different project
    // Register a new registry with only the mismatched agents
    const isolated = new AgentRegistry()
    isolated.registerAgent(makeAgent({ agent_id: 'sales-x', agent_type: 'sales_agent', current_project_id: 'proj-001' }))
    isolated.registerAgent(makeAgent({ agent_id: 'prod-x', agent_type: 'product_agent', current_project_id: 'proj-002' }))

    const message: Agent_Message = {
      from: 'sales_agent',
      to: 'product_agent',
      message_type: 'lead_handoff',
      project_id: 'proj-001',
      timestamp: '2026-05-14T09:30:00Z',
      payload: {},
    }
    const result = isolated.validateMessageAccess(message)
    expect(result.allowed).toBe(false)
  })

  it('denies a message when sender agent type is not registered', () => {
    const message: Agent_Message = {
      from: 'ceo_agent', // not registered
      to: 'product_agent',
      message_type: 'status_update',
      project_id: 'proj-001',
      timestamp: '2026-05-14T09:30:00Z',
      payload: {},
    }
    const result = registry.validateMessageAccess(message)
    expect(result.allowed).toBe(false)
    if (!result.allowed) {
      expect(result.reason).toContain('ceo_agent')
    }
  })

  it('denies a message when receiver agent type is not registered', () => {
    const message: Agent_Message = {
      from: 'sales_agent',
      to: 'engineering_agent', // not registered
      message_type: 'lead_handoff',
      project_id: 'proj-001',
      timestamp: '2026-05-14T09:30:00Z',
      payload: {},
    }
    const result = registry.validateMessageAccess(message)
    expect(result.allowed).toBe(false)
    if (!result.allowed) {
      expect(result.reason).toContain('engineering_agent')
    }
  })

  it('logs denied message access to the audit log', () => {
    const message: Agent_Message = {
      from: 'sales_agent',
      to: 'product_agent',
      message_type: 'lead_handoff',
      project_id: 'proj-999',
      timestamp: '2026-05-14T09:30:00Z',
      payload: {},
    }
    registry.validateMessageAccess(message)
    const log = registry.getAuditLog()
    const denied = log.filter(e => e.event === 'access_denied')
    expect(denied.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// 2.4 State history (append-only)
// ---------------------------------------------------------------------------

describe('AgentRegistry — 2.4 State history', () => {
  let registry: AgentRegistry

  beforeEach(() => {
    registry = new AgentRegistry()
  })

  it('records a snapshot when an agent is first registered', () => {
    registry.registerAgent(makeAgent({ status: 'idle' }))
    const history = registry.getAgentHistory('sales-1')
    expect(history).toHaveLength(1)
    expect(history[0]!.status).toBe('idle')
    expect(history[0]!.recorded_at).toBeTruthy()
  })

  it('appends a new snapshot on each agent update without removing old ones', () => {
    registry.registerAgent(makeAgent({ status: 'idle' }))
    registry.updateAgent('sales-1', { status: 'busy' })
    registry.updateAgent('sales-1', { status: 'offline' })

    const history = registry.getAgentHistory('sales-1')
    expect(history).toHaveLength(3)
    expect(history[0]!.status).toBe('idle')
    expect(history[1]!.status).toBe('busy')
    expect(history[2]!.status).toBe('offline')
  })

  it('re-registration appends a new snapshot (does not reset history)', () => {
    registry.registerAgent(makeAgent({ status: 'idle' }))
    registry.registerAgent(makeAgent({ status: 'error' })) // re-register same agent_id

    const history = registry.getAgentHistory('sales-1')
    expect(history).toHaveLength(2)
    expect(history[0]!.status).toBe('idle')
    expect(history[1]!.status).toBe('error')
  })

  it('returns empty history for an agent that was never registered', () => {
    expect(registry.getAgentHistory('ghost')).toHaveLength(0)
  })

  it('getAgentHistory returns a copy — mutations do not affect stored history', () => {
    registry.registerAgent(makeAgent({ status: 'idle' }))
    const history = registry.getAgentHistory('sales-1')
    history.push({ ...makeAgent(), recorded_at: 'tampered' })
    expect(registry.getAgentHistory('sales-1')).toHaveLength(1)
  })

  it('records a snapshot when a project is first registered', () => {
    registry.registerProject(makeProject({ lifecycle_state: 'lead' }))
    const history = registry.getProjectHistory('proj-001')
    expect(history).toHaveLength(1)
    expect(history[0]!.lifecycle_state).toBe('lead')
    expect(history[0]!.recorded_at).toBeTruthy()
  })

  it('appends a new snapshot on each project update without removing old ones', () => {
    registry.registerProject(makeProject({ lifecycle_state: 'lead' }))
    registry.updateProject('proj-001', { lifecycle_state: 'qualified', updated_at: '2026-05-14T10:00:00Z' })
    registry.updateProject('proj-001', { lifecycle_state: 'proposal', updated_at: '2026-05-14T11:00:00Z' })

    const history = registry.getProjectHistory('proj-001')
    expect(history).toHaveLength(3)
    expect(history[0]!.lifecycle_state).toBe('lead')
    expect(history[1]!.lifecycle_state).toBe('qualified')
    expect(history[2]!.lifecycle_state).toBe('proposal')
  })

  it('re-registration appends a new project snapshot (does not reset history)', () => {
    registry.registerProject(makeProject({ lifecycle_state: 'lead' }))
    registry.registerProject(makeProject({ lifecycle_state: 'won' }))

    const history = registry.getProjectHistory('proj-001')
    expect(history).toHaveLength(2)
    expect(history[0]!.lifecycle_state).toBe('lead')
    expect(history[1]!.lifecycle_state).toBe('won')
  })

  it('returns empty history for a project that was never registered', () => {
    expect(registry.getProjectHistory('ghost-proj')).toHaveLength(0)
  })

  it('getProjectHistory returns a copy — mutations do not affect stored history', () => {
    registry.registerProject(makeProject({ lifecycle_state: 'lead' }))
    const history = registry.getProjectHistory('proj-001')
    history.push({ ...makeProject(), recorded_at: 'tampered' })
    expect(registry.getProjectHistory('proj-001')).toHaveLength(1)
  })

  it('project history active_agent_ids is a copy — mutations do not affect stored snapshots', () => {
    registry.registerProject(makeProject({ active_agent_ids: ['sales-1'] }))
    const history = registry.getProjectHistory('proj-001')
    history[0]!.active_agent_ids.push('tampered')
    expect(registry.getProjectHistory('proj-001')[0]!.active_agent_ids).toHaveLength(1)
  })

  it('each snapshot has a recorded_at timestamp', () => {
    registry.registerAgent(makeAgent())
    registry.updateAgent('sales-1', { status: 'busy' })
    const history = registry.getAgentHistory('sales-1')
    for (const snapshot of history) {
      expect(typeof snapshot.recorded_at).toBe('string')
      expect(snapshot.recorded_at.length).toBeGreaterThan(0)
    }
  })

  it('histories for different agents are independent', () => {
    registry.registerAgent(makeAgent({ agent_id: 'sales-1', status: 'idle' }))
    registry.registerAgent(makeAgent({ agent_id: 'eng-1', agent_type: 'engineering_agent', status: 'busy' }))

    expect(registry.getAgentHistory('sales-1')).toHaveLength(1)
    expect(registry.getAgentHistory('eng-1')).toHaveLength(1)
    expect(registry.getAgentHistory('sales-1')[0]!.status).toBe('idle')
    expect(registry.getAgentHistory('eng-1')[0]!.status).toBe('busy')
  })

  it('histories for different projects are independent', () => {
    registry.registerProject(makeProject({ project_id: 'proj-001', lifecycle_state: 'lead' }))
    registry.registerProject(makeProject({ project_id: 'proj-002', lifecycle_state: 'won' }))

    expect(registry.getProjectHistory('proj-001')).toHaveLength(1)
    expect(registry.getProjectHistory('proj-002')).toHaveLength(1)
    expect(registry.getProjectHistory('proj-001')[0]!.lifecycle_state).toBe('lead')
    expect(registry.getProjectHistory('proj-002')[0]!.lifecycle_state).toBe('won')
  })
})

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

describe('AgentRegistry — Audit log', () => {
  let registry: AgentRegistry

  beforeEach(() => {
    registry = new AgentRegistry()
  })

  it('records agent_registered events', () => {
    registry.registerAgent(makeAgent())
    const log = registry.getAuditLog()
    const entry = log.find(e => e.event === 'agent_registered')
    expect(entry).toBeDefined()
    expect(entry!.agent_id).toBe('sales-1')
  })

  it('records project_registered events', () => {
    registry.registerProject(makeProject())
    const log = registry.getAuditLog()
    const entry = log.find(e => e.event === 'project_registered')
    expect(entry).toBeDefined()
    expect(entry!.project_id).toBe('proj-001')
  })

  it('records state_updated events for agents', () => {
    registry.registerAgent(makeAgent())
    registry.updateAgent('sales-1', { status: 'busy' })
    const log = registry.getAuditLog()
    const updates = log.filter(e => e.event === 'state_updated')
    expect(updates.length).toBeGreaterThan(0)
  })

  it('records state_updated events for projects', () => {
    registry.registerProject(makeProject())
    registry.updateProject('proj-001', { lifecycle_state: 'qualified' })
    const log = registry.getAuditLog()
    const updates = log.filter(e => e.event === 'state_updated')
    expect(updates.length).toBeGreaterThan(0)
  })

  it('all audit entries have a timestamp', () => {
    registry.registerAgent(makeAgent())
    registry.registerProject(makeProject())
    for (const entry of registry.getAuditLog()) {
      expect(typeof entry.timestamp).toBe('string')
      expect(entry.timestamp.length).toBeGreaterThan(0)
    }
  })

  it('getAuditLog returns a copy — mutations do not affect stored log', () => {
    registry.registerAgent(makeAgent())
    const log = registry.getAuditLog()
    log.push({ timestamp: 'tampered', event: 'access_denied', detail: 'injected' })
    expect(registry.getAuditLog()).toHaveLength(1)
  })
})
