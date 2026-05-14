import { describe, expect, it } from 'bun:test'
import type { ProjectRegistryEntry } from '../../domain/types.js'
import {
  acknowledgeEscalation,
  appendResolutionNote,
  buildEscalationMessage,
  buildEscalationPayload,
  buildSupportMetrics,
  buildRiskAlertMessage,
  classifyTicketCategory,
  createClientFacingUpdate,
  createSupportTask,
  createEscalationRecord,
  createSupportTicket,
  deriveTicketPriority,
  evaluateSupportRisk,
  findKnownIssue,
  generateSupportReport,
  requestClarificationIfNeeded,
  resolveWithKnowledge,
  recoverSupportTasks,
  routeEscalationTarget,
  timeoutEscalation,
  updateTicketStatus,
} from './index.js'

function makeProject(
  overrides: Partial<ProjectRegistryEntry> = {},
): ProjectRegistryEntry {
  return {
    project_id: 'proj-123',
    client_id: 'acme',
    lifecycle_state: 'delivered',
    active_agent_ids: ['support-1'],
    current_milestone: 'delivered',
    updated_at: '2026-05-14T09:00:00Z',
    ...overrides,
  }
}

describe('support intake and classification', () => {
  it('creates a ticket and maps delivered projects into support context', () => {
    const created = createSupportTicket(
      {
        project_id: 'proj-123',
        client_contact: 'ops@acme.test',
        summary: 'Production incident: automation is down',
        urgency: 'high',
        business_impact: 'critical',
        requested_outcome: 'Restore service',
      },
      makeProject(),
      '2026-05-14T10:00:00Z',
    )

    expect(created.ticket.category).toBe('incident')
    expect(created.ticket.priority).toBe('critical')
    expect(created.ticket.lifecycle_context).toBe('support')
    expect(created.lifecycle_transition).toEqual({
      from: 'delivered',
      to: 'support',
    })
  })

  it('asks for clarification when troubleshooting context is incomplete', () => {
    const created = createSupportTicket(
      {
        project_id: 'proj-123',
        client_contact: 'ops@acme.test',
        summary: 'bug',
        urgency: 'medium',
      },
      makeProject({ lifecycle_state: 'support' }),
      '2026-05-14T10:00:00Z',
    )

    const questions = requestClarificationIfNeeded(
      created.ticket,
      {
        project_id: 'proj-123',
        client_contact: 'ops@acme.test',
        summary: 'bug',
        urgency: 'medium',
      },
      '2026-05-14T10:05:00Z',
    )

    expect(questions.length).toBeGreaterThan(0)
  })

  it('keeps category and priority heuristics predictable', () => {
    expect(classifyTicketCategory('Change request for a new dashboard')).toBe(
      'change_request',
    )
    expect(deriveTicketPriority('low', 'high')).toBe('high')
  })
})

describe('support escalation flow', () => {
  it('routes technical incidents to engineering', () => {
    const created = createSupportTicket(
      {
        project_id: 'proj-123',
        client_contact: 'ops@acme.test',
        summary: 'Critical bug causing failures',
        urgency: 'critical',
        business_impact: 'high',
        requested_outcome: 'Provide a fix',
      },
      makeProject({ lifecycle_state: 'support' }),
      '2026-05-14T10:00:00Z',
    )

    const target = routeEscalationTarget(created.ticket)
    const payload = buildEscalationPayload(created.ticket, {
      business_impact: 'Checkout automation is blocked.',
      attempted_actions: ['Restarted worker', 'Checked runbook'],
      conversation_history: ['Client reported an outage'],
      requested_outcome: 'Need root cause and fix ETA',
      reproduction_steps: ['Run nightly job', 'Observe failure'],
    })
    const message = buildEscalationMessage(
      target,
      created.ticket.project_id,
      '2026-05-14T10:10:00Z',
      payload,
    )

    expect(target).toBe('engineering_agent')
    expect(message.message_type).toBe('ticket_escalation')
    expect(message.to).toBe('engineering_agent')
  })

  it('routes timeline and scope issues to the project manager', () => {
    const created = createSupportTicket(
      {
        project_id: 'proj-123',
        client_contact: 'ops@acme.test',
        summary: 'Change request: move the delivery timeline and scope',
        urgency: 'medium',
        business_impact: 'medium',
        requested_outcome: 'Need a delivery decision',
      },
      makeProject({ lifecycle_state: 'support' }),
      '2026-05-14T10:00:00Z',
    )

    expect(routeEscalationTarget(created.ticket)).toBe('project_manager_agent')
  })

  it('prevents resolved status before a client-facing update exists', () => {
    const created = createSupportTicket(
      {
        project_id: 'proj-123',
        client_contact: 'ops@acme.test',
        summary: 'Question about a report',
        urgency: 'low',
        requested_outcome: 'Explain the report',
      },
      makeProject({ lifecycle_state: 'support' }),
      '2026-05-14T10:00:00Z',
    )

    expect(() =>
      updateTicketStatus(
        created.ticket,
        'resolved',
        '2026-05-14T10:30:00Z',
        'support',
        'Marked resolved',
      ),
    ).toThrow('client update')

    const clientUpdate = appendResolutionNote(
      created.ticket.ticket_id,
      'support',
      'client_update',
      'Shared the final answer with the client.',
      '2026-05-14T10:20:00Z',
    )
    const updated = updateTicketStatus(
      created.ticket,
      'resolved',
      '2026-05-14T10:30:00Z',
      'support',
      'Marked resolved',
      [clientUpdate],
    )

    expect(updated.ticket.status).toBe('resolved')
    expect(updated.history.to_status).toBe('resolved')
  })
})

describe('support knowledge, tasks, and reporting', () => {
  it('resolves known issues from support knowledge before escalating', () => {
    const created = createSupportTicket(
      {
        project_id: 'proj-123',
        client_contact: 'ops@acme.test',
        summary: 'Automation outage on nightly sync',
        urgency: 'high',
        business_impact: 'high',
        requested_outcome: 'Restore the sync',
      },
      makeProject({ lifecycle_state: 'support' }),
      '2026-05-14T10:00:00Z',
    )

    const knowledge = [
      {
        document_id: 'doc-1',
        project_id: 'proj-123',
        type: 'runbook' as const,
        title: 'Nightly Sync Runbook',
        content: 'Known issue for outage on sync worker.\nWorkaround: restart the sync worker service.',
        tags: ['automation', 'outage', 'sync'],
        updated_at: '2026-05-13T09:00:00Z',
      },
    ]

    const match = findKnownIssue(created.ticket, knowledge)
    const resolution = resolveWithKnowledge(
      created.ticket,
      knowledge,
      '2026-05-14T10:05:00Z',
    )

    expect(match?.document.document_id).toBe('doc-1')
    expect(resolution.next_status).toBe('triaged')
    expect(resolution.notes[0]?.note_type).toBe('workaround')
  })

  it('tracks escalation acknowledgments and timeouts', () => {
    const created = createSupportTicket(
      {
        project_id: 'proj-123',
        client_contact: 'ops@acme.test',
        summary: 'Critical bug causing failures',
        urgency: 'critical',
        requested_outcome: 'Fix the issue',
      },
      makeProject({ lifecycle_state: 'support' }),
      '2026-05-14T10:00:00Z',
    )

    const escalation = createEscalationRecord(
      created.ticket,
      'engineering_agent',
      '2026-05-14T10:05:00Z',
    )
    const acknowledged = acknowledgeEscalation(
      escalation,
      '2026-05-14T10:10:00Z',
    )
    const timedOut = timeoutEscalation(escalation, '2026-05-14T12:00:00Z')

    expect(acknowledged.status).toBe('acknowledged')
    expect(timedOut.status).toBe('timed_out')
  })

  it('creates client-safe updates, recovers tasks, and generates support reports', () => {
    const created = createSupportTicket(
      {
        project_id: 'proj-123',
        client_contact: 'ops@acme.test',
        summary: 'Question about a report',
        urgency: 'high',
        requested_outcome: 'Explain the discrepancy',
      },
      makeProject({ lifecycle_state: 'support' }),
      '2026-05-14T10:00:00Z',
    )
    const clientUpdate = createClientFacingUpdate(
      created.ticket,
      'Internal root cause found and the report calculation has been corrected.',
      '2026-05-14T10:20:00Z',
      'We will monitor tonight run.',
    )
    expect(clientUpdate.detail).not.toContain('root cause')

    const task = createSupportTask({
      ticket_id: created.ticket.ticket_id,
      project_id: created.ticket.project_id,
      task_type: 'ticket_triage',
      created_at: '2026-05-14T10:00:00Z',
    })
    const recovered = recoverSupportTasks(
      [{ ...task, status: 'running', updated_at: '2026-05-14T10:05:00Z' }],
      '2026-05-14T11:00:00Z',
    )
    expect(recovered[0]?.status).toBe('queued')

    const history = [
      created.history[0]!,
      {
        ticket_id: created.ticket.ticket_id,
        from_status: 'open' as const,
        to_status: 'triaged' as const,
        actor: 'support' as const,
        note: 'Responded to the client',
        created_at: '2026-05-14T10:15:00Z',
      },
      {
        ticket_id: created.ticket.ticket_id,
        from_status: 'triaged' as const,
        to_status: 'resolved' as const,
        actor: 'support' as const,
        note: 'Final answer sent',
        created_at: '2026-05-14T12:00:00Z',
      },
    ]
    const report = generateSupportReport({
      tickets: [created.ticket],
      history,
      project_id: 'proj-123',
      generated_at: '2026-05-14T13:00:00Z',
    })
    expect(report.ticket_count).toBe(1)
    expect(report.first_response_hours).toBe(0.25)
    expect(report.average_resolution_hours).toBe(2)
  })
})

describe('support risk alerts', () => {
  it('raises a repeat incident alert and can wrap it in an agent message', () => {
    const created = createSupportTicket(
      {
        project_id: 'proj-123',
        client_contact: 'ops@acme.test',
        summary: 'Production incident: automation is down',
        urgency: 'high',
        business_impact: 'high',
        requested_outcome: 'Restore service',
      },
      makeProject({ lifecycle_state: 'support' }),
      '2026-05-14T10:00:00Z',
    )
    const second = createSupportTicket(
      {
        project_id: 'proj-123',
        client_contact: 'ops@acme.test',
        summary: 'Production incident: automation is down again',
        urgency: 'high',
        business_impact: 'high',
        requested_outcome: 'Restore service',
      },
      makeProject({ lifecycle_state: 'support' }),
      '2026-05-15T10:00:00Z',
    )

    const alert = evaluateSupportRisk({
      ticket: second.ticket,
      allTickets: [created.ticket, second.ticket],
      escalations: [createEscalationRecord(second.ticket, 'engineering_agent', '2026-05-15T10:05:00Z')],
      now: '2026-05-15T12:00:00Z',
    })

    expect(alert?.trigger).toBe('repeat_incident')

    const message = buildRiskAlertMessage(
      second.ticket.project_id,
      '2026-05-15T12:00:00Z',
      alert!,
      'project_manager_agent',
    )
    expect(message.message_type).toBe('risk_alert')
    expect(message.to).toBe('project_manager_agent')
  })

  it('builds support metrics including SLA breaches', () => {
    const open = createSupportTicket(
      {
        project_id: 'proj-123',
        client_contact: 'ops@acme.test',
        summary: 'Production incident: automation is down',
        urgency: 'critical',
        business_impact: 'critical',
        requested_outcome: 'Restore service',
      },
      makeProject({ lifecycle_state: 'support' }),
      '2026-05-14T08:00:00Z',
    )
    const metrics = buildSupportMetrics({
      tickets: [open.ticket],
      escalations: [createEscalationRecord(open.ticket, 'engineering_agent', '2026-05-14T08:05:00Z')],
      alerts: [
        buildRiskAlertMessage(
          open.ticket.project_id,
          '2026-05-15T12:00:00Z',
          {
            alert_id: 'alert-1',
            project_id: open.ticket.project_id,
            severity: 'critical',
            trigger: 'sla_breach',
            summary: 'Critical ticket exceeded SLA.',
            recommended_action: 'Escalate now.',
            created_at: '2026-05-15T12:00:00Z',
          },
          'ceo_agent',
        ).payload,
      ],
      now: '2026-05-15T12:00:00Z',
      slaHours: 4,
    })

    expect(metrics.open_tickets).toBe(1)
    expect(metrics.unresolved_high_priority).toBe(1)
    expect(metrics.sla_breaches).toBe(1)
  })
})
