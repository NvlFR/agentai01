import { describe, expect, it } from 'bun:test'
import { createRuntimeOperationalApp } from './runtimeApp.js'

describe('RuntimeOperationalApp', () => {
  it('boots all worker-backed agents into the runtime shell', () => {
    const app = createRuntimeOperationalApp({
      now: '2026-05-14T08:00:00Z',
    })

    expect(app.shell.buildSnapshot().agents).toHaveLength(7)
    expect(app.events[0]?.kind).toBe('boot')
  })

  it('escalates and raises a blocker after repeated adapter failures', async () => {
    const app = createRuntimeOperationalApp({
      now: '2026-05-14T08:30:00Z',
    })
    app.ensureProject({
      project_id: 'proj-fail',
      client_id: 'failure-labs',
      lifecycle_state: 'lead',
      now: '2026-05-14T08:30:00Z',
    })
    app.assignProjectAgents('proj-fail', '2026-05-14T08:30:00Z')

    app.adapters.product_agent.executeMessage = () => {
      throw new Error('simulated product failure')
    }

    await expect(
      app.dispatch({
        from: 'sales_agent',
        to: 'product_agent',
        message_type: 'lead_handoff',
        project_id: 'proj-fail',
        timestamp: '2026-05-14T08:31:00Z',
        payload: {
          handoff_id: 'handoff-fail',
          lead_id: 'lead-fail',
          client_name: 'Failure Labs',
          stakeholder_contacts: ['owner@fail.test'],
          proposal_artifact_ref: 'lead-fail/proposal-v1.md',
          initial_scope: 'runtime integration',
          commercial_assumptions: ['Approval in one day'],
          initial_risks: ['Adapter instability'],
        },
      }),
    ).rejects.toThrow('simulated product failure')

    expect(app.events.some(event => event.kind === 'retry')).toBe(true)
    expect(app.events.some(event => event.kind === 'escalation')).toBe(true)
    expect(app.shell.buildSnapshot().open_blockers).toHaveLength(1)
  })
})
