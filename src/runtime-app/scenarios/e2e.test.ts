import { describe, expect, it } from 'bun:test'
import { createRuntimeOperationalApp } from '../orchestration/runtimeApp.js'
import {
  runLeadIntakeToDeliveredScenario,
  runOwnerDirectiveToDashboardScenario,
} from './e2e.js'

describe('runtime-app E2E scenarios', () => {
  it('runs owner directive through runtime and updates dashboard state', async () => {
    const app = createRuntimeOperationalApp({
      now: '2026-05-14T09:00:00Z',
    })

    const result = await runOwnerDirectiveToDashboardScenario(
      app,
      '2026-05-14T09:00:00Z',
    )

    expect(result.directiveResponse).toContain('Company Status')
    expect(
      result.dashboard.projects.find(
        project => project.project_id === 'proj-owner-dashboard',
      )?.current_milestone,
    ).toBe('owner_directive_dispatched')
  })

  it('runs lead intake through approval gates until delivered', async () => {
    const app = createRuntimeOperationalApp({
      now: '2026-05-14T10:00:00Z',
    })

    const dashboard = await runLeadIntakeToDeliveredScenario(
      app,
      '2026-05-14T10:00:00Z',
    )

    expect(
      dashboard.projects.find(project => project.project_id === 'proj-acme-runtime')
        ?.lifecycle_state,
    ).toBe('delivered')
    expect(dashboard.approvals.pending_count).toBe(0)
  })
})
