import type { CompanyDashboardReadModel } from '../../app/index.js'
import { createRuntimeOperationalApp } from '../orchestration/runtimeApp.js'
import type { RuntimeOperationalApp } from '../orchestration/runtimeApp.js'

export async function runOwnerDirectiveToDashboardScenario(
  app: RuntimeOperationalApp,
  now = '2026-05-14T09:00:00Z',
): Promise<{
  directiveResponse: string
  dashboard: CompanyDashboardReadModel
}> {
  app.ensureProject({
    project_id: 'proj-owner-dashboard',
    client_id: 'owner-demo',
    lifecycle_state: 'implementation',
    milestone: 'awaiting_owner_directive',
    now,
  })
  app.assignProjectAgents('proj-owner-dashboard', now)

  const directiveResponse = app.executeOwnerDirective('status perusahaan', now)
  await app.dispatch({
    from: 'ceo_agent',
    to: 'project_manager_agent',
    message_type: 'status_update',
    project_id: 'proj-owner-dashboard',
    timestamp: now,
    payload: {
      status: 'owner_directive_received',
      summary: 'Owner requested an operational dashboard refresh.',
      milestone: 'owner_directive_dispatched',
    },
  })

  return {
    directiveResponse,
    dashboard: app.shell.readDashboard(now),
  }
}

export async function runLeadIntakeToDeliveredScenario(
  app: RuntimeOperationalApp,
  now = '2026-05-14T10:00:00Z',
): Promise<CompanyDashboardReadModel> {
  await app.executeAgentTask(
    'marketing_agent',
    'capture_inbound_lead',
    {
      lead_id: 'lead-acme',
      company_name: 'Acme Health',
      contact_name: 'Alya',
      contact_email: 'alya@acme.test',
      contact_channel: 'email',
      source_channel: 'website',
      campaign_id: 'cmp-acme',
      segment_id: 'healthcare-ops',
      project_id: 'proj-acme-runtime',
      initial_need_summary: 'Need an AI runtime that coordinates company agents.',
      tags: ['ops', 'automation', 'dashboard'],
    },
    now,
  )

  await app.respondToPendingApproval(
    'proj-acme-runtime',
    'proposal_final',
    'approve',
    '2026-05-14T10:05:00Z',
    'Proposal aligns with the commercial plan.',
  )
  await app.respondToPendingApproval(
    'proj-acme-runtime',
    'spec_final',
    'approve',
    '2026-05-14T10:10:00Z',
    'Spec is clear enough for engineering.',
  )
  await app.respondToPendingApproval(
    'proj-acme-runtime',
    'delivery_final',
    'approve',
    '2026-05-14T10:15:00Z',
    'Delivery package is ready.',
  )

  return app.shell.readDashboard('2026-05-14T10:16:00Z')
}

async function runLeadToDeliveredScenario(input: {
  runtimeId: string
  now?: string
}): Promise<{
  snapshot: ReturnType<RuntimeOperationalApp['shell']['buildSnapshot']>
  communicationEvents: number
  recoveryStatePath: string
}> {
  const now = input.now ?? '2026-05-14T10:00:00Z'
  const app = createRuntimeOperationalApp({
    now,
  })
  void input.runtimeId
  await runLeadIntakeToDeliveredScenario(app, now)
  const snapshot = app.shell.buildSnapshot('2026-05-14T10:16:00Z')
  const engineeringState = app.stores.engineeringProjects.get('proj-acme-runtime')

  return {
    snapshot,
    communicationEvents: snapshot.communication_log.length,
    recoveryStatePath:
      engineeringState?.workspace_root
        ? `${engineeringState.workspace_root}/audit/recovery-snapshot.json`
        : '',
  }
}
