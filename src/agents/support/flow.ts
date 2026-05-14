import type { ProjectRegistryEntry } from '../../domain/types.js'
import type {
  ClientFacingUpdate,
  KnowledgeDocument,
  KnownIssueMatch,
  ResolutionNote,
  RiskAlertTrigger,
  SupportEscalationMessage,
  SupportEscalationRecord,
  SupportMetrics,
  SupportReport,
  SupportEscalationTarget,
  SupportRiskAlert,
  SupportRiskAlertMessage,
  SupportTask,
  SupportTicket,
  SupportTicketCategory,
  SupportTicketHistoryEntry,
  SupportTicketInput,
  SupportTicketPriority,
  SupportTicketStatus,
  TicketEscalationPayload,
} from './models.js'

function slugifySummary(summary: string): string {
  return summary
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32)
}

export function classifyTicketCategory(summary: string): SupportTicketCategory {
  const normalized = summary.toLowerCase()
  if (
    normalized.includes('incident') ||
    normalized.includes('down') ||
    normalized.includes('outage')
  ) {
    return 'incident'
  }
  if (
    normalized.includes('bug') ||
    normalized.includes('error') ||
    normalized.includes('fail')
  ) {
    return 'bug'
  }
  if (
    normalized.includes('change request') ||
    normalized.includes('scope') ||
    normalized.includes('enhancement')
  ) {
    return 'change_request'
  }
  return 'question'
}

export function deriveTicketPriority(
  urgency: SupportTicketInput['urgency'],
  businessImpact: SupportTicketInput['business_impact'] = 'medium',
): SupportTicketPriority {
  if (urgency === 'critical' || businessImpact === 'critical') return 'critical'
  if (urgency === 'high' || businessImpact === 'high') return 'high'
  if (urgency === 'medium' || businessImpact === 'medium') return 'medium'
  return 'low'
}

export function createSupportTicket(
  input: SupportTicketInput,
  project: ProjectRegistryEntry,
  createdAt: string,
): {
  ticket: SupportTicket
  history: SupportTicketHistoryEntry[]
  lifecycle_transition?: { from: 'delivered'; to: 'support' }
} {
  if (!input.project_id.trim()) {
    throw new Error('Support tickets require a project_id')
  }

  if (project.project_id !== input.project_id) {
    throw new Error(
      `Ticket project_id ${input.project_id} does not match project ${project.project_id}`,
    )
  }

  if (
    project.lifecycle_state !== 'delivered' &&
    project.lifecycle_state !== 'support' &&
    project.lifecycle_state !== 'closed'
  ) {
    throw new Error(
      `Support ticket requires delivered/support context, received ${project.lifecycle_state}`,
    )
  }

  const category = classifyTicketCategory(input.summary)
  const priority = deriveTicketPriority(input.urgency, input.business_impact)
  const ticketId = `${input.project_id}-${slugifySummary(input.summary) || 'ticket'}`
  const lifecycleContext = project.lifecycle_state === 'delivered' ? 'support' : project.lifecycle_state

  const ticket: SupportTicket = {
    ticket_id: ticketId,
    project_id: input.project_id,
    client_contact: input.client_contact,
    summary: input.summary,
    category,
    priority,
    status: 'open',
    occurred_at: input.occurred_at,
    created_at: createdAt,
    updated_at: createdAt,
    requested_outcome: input.requested_outcome,
    lifecycle_context: lifecycleContext,
  }

  return {
    ticket,
    history: [
      {
        ticket_id: ticketId,
        to_status: 'open',
        actor: 'support',
        note: 'Ticket created',
        created_at: createdAt,
      },
    ],
    lifecycle_transition:
      project.lifecycle_state === 'delivered'
        ? { from: 'delivered', to: 'support' }
        : undefined,
  }
}

export function requestClarificationIfNeeded(
  ticket: SupportTicket,
  input: SupportTicketInput,
  createdAt: string,
): string[] {
  const questions: string[] = []
  if (!input.summary.trim() || input.summary.trim().length < 12) {
    questions.push('Mohon jelaskan gejala atau pertanyaan dengan lebih spesifik.')
  }
  if (!input.requested_outcome?.trim()) {
    questions.push('Hasil seperti apa yang Anda harapkan dari support ini?')
  }
  if (
    (ticket.category === 'bug' || ticket.category === 'incident') &&
    (!input.reproduction_steps || input.reproduction_steps.length === 0)
  ) {
    questions.push('Bisa kirim langkah reproduksi atau kondisi saat masalah muncul?')
  }
  void createdAt
  return questions
}

export function updateTicketStatus(
  ticket: SupportTicket,
  nextStatus: SupportTicketStatus,
  createdAt: string,
  actor: SupportTicketHistoryEntry['actor'],
  note: string,
  notes: ResolutionNote[] = [],
): { ticket: SupportTicket; history: SupportTicketHistoryEntry } {
  if (
    nextStatus === 'resolved' &&
    !notes.some(resolution => resolution.note_type === 'client_update')
  ) {
    throw new Error('Ticket cannot be resolved before a client update is recorded')
  }

  return {
    ticket: {
      ...ticket,
      status: nextStatus,
      updated_at: createdAt,
    },
    history: {
      ticket_id: ticket.ticket_id,
      from_status: ticket.status,
      to_status: nextStatus,
      actor,
      note,
      created_at: createdAt,
    },
  }
}

export function appendResolutionNote(
  ticketId: string,
  actor: ResolutionNote['actor'],
  noteType: ResolutionNote['note_type'],
  note: string,
  createdAt: string,
): ResolutionNote {
  return {
    ticket_id: ticketId,
    actor,
    note,
    note_type: noteType,
    created_at: createdAt,
  }
}

export function routeEscalationTarget(
  ticket: Pick<SupportTicket, 'category' | 'priority' | 'summary'>,
): SupportEscalationTarget {
  if (ticket.category === 'bug' || ticket.category === 'incident') {
    return 'engineering_agent'
  }
  if (ticket.category === 'change_request') {
    return 'project_manager_agent'
  }

  const normalized = ticket.summary.toLowerCase()
  if (
    normalized.includes('timeline') ||
    normalized.includes('deadline') ||
    normalized.includes('dependency') ||
    normalized.includes('owner approval')
  ) {
    return 'project_manager_agent'
  }

  return ticket.priority === 'critical'
    ? 'engineering_agent'
    : 'project_manager_agent'
}

export function buildEscalationPayload(
  ticket: SupportTicket,
  input: {
    business_impact: string
    attempted_actions: string[]
    conversation_history: string[]
    requested_outcome: string
    reproduction_steps?: string[]
  },
): TicketEscalationPayload {
  return {
    ticket_id: ticket.ticket_id,
    project_id: ticket.project_id,
    summary: ticket.summary,
    category: ticket.category,
    business_impact: input.business_impact,
    reproduction_steps: input.reproduction_steps,
    attempted_actions: input.attempted_actions,
    conversation_history: input.conversation_history,
    requested_outcome: input.requested_outcome,
  }
}

export function createEscalationRecord(
  ticket: SupportTicket,
  target: SupportEscalationTarget,
  createdAt: string,
): SupportEscalationRecord {
  return {
    escalation_id: `${ticket.ticket_id}:${target}:${createdAt}`,
    ticket_id: ticket.ticket_id,
    project_id: ticket.project_id,
    target,
    created_at: createdAt,
    status: 'pending',
  }
}

export function acknowledgeEscalation(
  escalation: SupportEscalationRecord,
  acknowledgedAt: string,
): SupportEscalationRecord {
  return {
    ...escalation,
    status: 'acknowledged',
    acknowledged_at: acknowledgedAt,
  }
}

export function buildEscalationMessage(
  target: SupportEscalationTarget,
  projectId: string,
  timestamp: string,
  payload: TicketEscalationPayload,
): SupportEscalationMessage {
  return {
    from: 'support_agent',
    to: target,
    message_type: 'ticket_escalation',
    project_id: projectId,
    timestamp,
    payload,
  }
}

export function timeoutEscalation(
  escalation: SupportEscalationRecord,
  timedOutAt: string,
): SupportEscalationRecord {
  return {
    ...escalation,
    status: 'timed_out',
    acknowledged_at: escalation.acknowledged_at,
  }
}

export function findKnownIssue(
  ticket: Pick<SupportTicket, 'project_id' | 'summary'>,
  knowledge: KnowledgeDocument[],
): KnownIssueMatch | null {
  const terms = slugifySummary(ticket.summary).split('-').filter(Boolean)
  let bestMatch: KnownIssueMatch | null = null

  for (const document of knowledge) {
    if (document.project_id !== ticket.project_id) {
      continue
    }
    const matchedTerms = terms.filter(
      term =>
        document.tags.includes(term) ||
        document.content.toLowerCase().includes(term) ||
        document.title.toLowerCase().includes(term),
    )
    if (matchedTerms.length === 0) {
      continue
    }
    if (
      bestMatch === null ||
      matchedTerms.length > bestMatch.matched_terms.length
    ) {
      const workaroundLine = document.content
        .split('\n')
        .find(line => line.toLowerCase().includes('workaround:'))
      bestMatch = {
        document,
        matched_terms: matchedTerms,
        workaround: workaroundLine?.split(':').slice(1).join(':').trim(),
      }
    }
  }

  return bestMatch
}

export function resolveWithKnowledge(
  ticket: SupportTicket,
  knowledge: KnowledgeDocument[],
  createdAt: string,
): {
  match: KnownIssueMatch | null
  next_status: SupportTicketStatus
  notes: ResolutionNote[]
} {
  const match = findKnownIssue(ticket, knowledge)
  if (match === null) {
    return {
      match: null,
      next_status: 'needs_escalation',
      notes: [
        appendResolutionNote(
          ticket.ticket_id,
          'support',
          'diagnosis',
          'No known issue or workaround found in the support knowledge base.',
          createdAt,
        ),
      ],
    }
  }

  const noteText = match.workaround
    ? `Known issue matched in ${match.document.title}. Workaround: ${match.workaround}`
    : `Known issue matched in ${match.document.title}.`

  return {
    match,
    next_status: 'triaged',
    notes: [
      appendResolutionNote(
        ticket.ticket_id,
        'support',
        'workaround',
        noteText,
        createdAt,
      ),
    ],
  }
}

export function evaluateSupportRisk(input: {
  ticket: SupportTicket
  allTickets: SupportTicket[]
  escalations?: SupportEscalationRecord[]
  now: string
  slaHours?: number
}): SupportRiskAlert | null {
  const escalations = input.escalations ?? []
  const slaHours = input.slaHours ?? 24

  const sameProjectIncidents = input.allTickets.filter(
    ticket =>
      ticket.project_id === input.ticket.project_id &&
      ticket.category === 'incident',
  )

  if (input.ticket.category === 'incident' && sameProjectIncidents.length >= 2) {
    return createRiskAlert(
      input.ticket.project_id,
      'high',
      'repeat_incident',
      'Multiple incidents detected on the same project.',
      'Coordinate a permanent fix and review delivery stability.',
      input.now,
    )
  }

  const sameSignatureAcrossProjects = new Set(
    input.allTickets
      .filter(ticket => slugifySummary(ticket.summary) === slugifySummary(input.ticket.summary))
      .map(ticket => ticket.project_id),
  )
  if (sameSignatureAcrossProjects.size > 1) {
    return createRiskAlert(
      input.ticket.project_id,
      'high',
      'cross_project_pattern',
      'A similar support pattern is appearing across multiple projects.',
      'Escalate to PM or CEO for cross-project mitigation.',
      input.now,
    )
  }

  const unresolvedEscalations = escalations.filter(
    escalation => escalation.ticket_id === input.ticket.ticket_id && escalation.status !== 'resolved',
  )
  if (unresolvedEscalations.length >= 2) {
    return createRiskAlert(
      input.ticket.project_id,
      'medium',
      'unresolved_escalation',
      'Repeated escalations are still unresolved.',
      'Review escalation ownership and define a final resolution path.',
      input.now,
    )
  }

  const ageHours =
    (new Date(input.now).getTime() - new Date(input.ticket.created_at).getTime()) /
    (1000 * 60 * 60)
  if (
    input.ticket.priority === 'critical' &&
    input.ticket.status !== 'resolved' &&
    input.ticket.status !== 'closed' &&
    ageHours > slaHours
  ) {
    return createRiskAlert(
      input.ticket.project_id,
      'critical',
      'sla_breach',
      'Critical ticket exceeded the configured SLA window.',
      'Raise an immediate action-required escalation.',
      input.now,
    )
  }

  return null
}

function createRiskAlert(
  projectId: string,
  severity: SupportRiskAlert['severity'],
  trigger: RiskAlertTrigger,
  summary: string,
  recommendedAction: string,
  createdAt: string,
): SupportRiskAlert {
  return {
    alert_id: `${projectId}:${trigger}:${createdAt}`,
    project_id: projectId,
    severity,
    trigger,
    summary,
    recommended_action: recommendedAction,
    created_at: createdAt,
  }
}

export function buildRiskAlertMessage(
  projectId: string,
  timestamp: string,
  payload: SupportRiskAlert,
  target: 'ceo_agent' | 'project_manager_agent',
): SupportRiskAlertMessage {
  return {
    from: 'support_agent',
    to: target,
    message_type: 'risk_alert',
    project_id: projectId,
    timestamp,
    payload,
  }
}

export function createClientFacingUpdate(
  ticket: SupportTicket,
  internalSummary: string,
  createdAt: string,
  nextStep?: string,
): ClientFacingUpdate {
  return {
    ticket_id: ticket.ticket_id,
    summary: `Update for ${ticket.ticket_id}`,
    detail: internalSummary.replace(/\b(root cause|stack trace|internal)\b/gi, 'technical detail'),
    next_step: nextStep,
    created_at: createdAt,
  }
}

export function createSupportTask(input: {
  ticket_id: string
  project_id: string
  task_type: SupportTask['task_type']
  created_at: string
  notes?: string
}): SupportTask {
  return {
    task_id: `${input.ticket_id}:${input.task_type}:${input.created_at}`,
    ticket_id: input.ticket_id,
    project_id: input.project_id,
    task_type: input.task_type,
    status: 'queued',
    created_at: input.created_at,
    updated_at: input.created_at,
    notes: input.notes,
  }
}

export function updateSupportTask(
  task: SupportTask,
  status: SupportTask['status'],
  updatedAt: string,
  notes?: string,
): SupportTask {
  return {
    ...task,
    status,
    updated_at: updatedAt,
    notes: notes ?? task.notes,
  }
}

export function recoverSupportTasks(
  tasks: SupportTask[],
  now: string,
): SupportTask[] {
  return tasks.map(task =>
    task.status === 'running'
      ? {
          ...task,
          status: 'queued',
          updated_at: now,
          notes: task.notes ?? 'Recovered after restart.',
        }
      : { ...task },
  )
}

export function buildSupportMetrics(input: {
  tickets: SupportTicket[]
  escalations: SupportEscalationRecord[]
  alerts: SupportRiskAlert[]
  now: string
  slaHours?: number
}): SupportMetrics {
  const slaHours = input.slaHours ?? 24
  const openTickets = input.tickets.filter(
    ticket => ticket.status !== 'resolved' && ticket.status !== 'closed',
  )
  const unresolvedHighPriority = openTickets.filter(
    ticket => ticket.priority === 'high' || ticket.priority === 'critical',
  ).length
  const slaBreaches = openTickets.filter(ticket => {
    const ageHours =
      (new Date(input.now).getTime() - new Date(ticket.created_at).getTime()) /
      (1000 * 60 * 60)
    return ageHours > slaHours
  }).length

  return {
    open_tickets: openTickets.length,
    unresolved_high_priority: unresolvedHighPriority,
    escalations: input.escalations.length,
    risk_alerts: input.alerts.length,
    sla_breaches: slaBreaches,
  }
}

export function generateSupportReport(input: {
  tickets: SupportTicket[]
  history: SupportTicketHistoryEntry[]
  project_id?: string
  generated_at: string
}): SupportReport {
  const tickets = input.project_id
    ? input.tickets.filter(ticket => ticket.project_id === input.project_id)
    : input.tickets
  const byCategory: SupportReport['by_category'] = {
    question: 0,
    bug: 0,
    incident: 0,
    change_request: 0,
  }

  let firstResponseTotalHours = 0
  let firstResponseCount = 0
  let resolutionTotalHours = 0
  let resolutionCount = 0
  const actionRequired: string[] = []
  const historyLines: string[] = []

  for (const ticket of tickets) {
    byCategory[ticket.category] += 1
    const ticketHistory = input.history
      .filter(entry => entry.ticket_id === ticket.ticket_id)
      .sort((left, right) => left.created_at.localeCompare(right.created_at))

    if (ticketHistory.length > 1) {
      firstResponseTotalHours +=
        (new Date(ticketHistory[1]!.created_at).getTime() -
          new Date(ticket.created_at).getTime()) /
        (1000 * 60 * 60)
      firstResponseCount += 1
    }

    const resolvedAt = ticketHistory.find(entry => entry.to_status === 'resolved')
    if (resolvedAt) {
      resolutionTotalHours +=
        (new Date(resolvedAt.created_at).getTime() -
          new Date(ticket.created_at).getTime()) /
        (1000 * 60 * 60)
      resolutionCount += 1
    }

    if (
      (ticket.priority === 'high' || ticket.priority === 'critical') &&
      ticket.status !== 'resolved' &&
      ticket.status !== 'closed'
    ) {
      actionRequired.push(`[ACTION REQUIRED] ${ticket.ticket_id} is still ${ticket.status}`)
    }

    historyLines.push(
      `${ticket.ticket_id}: ${ticket.status} (${ticket.category}/${ticket.priority})`,
    )
  }

  return {
    generated_at: input.generated_at,
    project_id: input.project_id,
    ticket_count: tickets.length,
    by_category: byCategory,
    first_response_hours:
      firstResponseCount === 0 ? 0 : Number((firstResponseTotalHours / firstResponseCount).toFixed(2)),
    average_resolution_hours:
      resolutionCount === 0 ? 0 : Number((resolutionTotalHours / resolutionCount).toFixed(2)),
    action_required: actionRequired,
    history: historyLines,
  }
}
