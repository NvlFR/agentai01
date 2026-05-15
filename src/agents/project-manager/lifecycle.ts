import type { AgentType } from '../../domain/types.js'
export {
  applyLifecycleUpdate,
  resolveLifecycleTransition,
  type LifecycleUpdateInput,
  type LifecycleUpdateResult,
} from '../../domain/lifecycle.js'
import { AgentRegistry } from '../../registry/AgentRegistry.js'
import type {
  HandoffRecord,
  MilestoneStatus,
  PendingApproval,
  ProjectHistoryEvent,
  ProjectMilestone,
  ProjectTimeline,
} from './models.js'
import {
  acknowledgeHandoff,
  applyApprovalResponse,
  createProjectHistoryEvent,
} from './models.js'

export type ProjectStatusUpdate = {
  project_id: string
  actor: AgentType
  milestone_id: string
  status: MilestoneStatus
  timestamp: string
  notes?: string
}

export function applyProjectStatusUpdate(
  timeline: ProjectTimeline,
  update: ProjectStatusUpdate,
): {
  timeline: ProjectTimeline
  current_milestone: string
  history_event: ProjectHistoryEvent
} {
  let milestoneFound = false

  const milestones = timeline.milestones.map(milestone => {
    if (milestone.milestone_id !== update.milestone_id) {
      return milestone
    }

    milestoneFound = true
    return updateMilestone(milestone, update.status, update.timestamp, update.notes)
  })

  if (!milestoneFound) {
    throw new Error(`Milestone not found: ${update.milestone_id}`)
  }

  return {
    timeline: {
      ...timeline,
      updated_at: update.timestamp,
      milestones,
    },
    current_milestone: update.milestone_id,
    history_event: createProjectHistoryEvent({
      project_id: update.project_id,
      event_type: 'status_update',
      actor: update.actor,
      summary: `${update.actor} set ${update.milestone_id} to ${update.status}.`,
      created_at: update.timestamp,
      metadata: {
        milestone_id: update.milestone_id,
        status: update.status,
      },
    }),
  }
}

export function recordProjectHandoff(
  timeline: ProjectTimeline,
  handoff: HandoffRecord,
): {
  timeline: ProjectTimeline
  history_event: ProjectHistoryEvent
} {
  const milestoneId =
    handoff.handoff_type === 'lead_handoff'
      ? 'lead_handoff_sent'
      : 'discovery_handoff_sent'

  const updated = applyProjectStatusUpdate(timeline, {
    project_id: handoff.project_id,
    actor: 'project_manager_agent',
    milestone_id: milestoneId,
    status: 'awaiting_ack',
    timestamp: handoff.sent_at,
    notes: `${handoff.handoff_type} sent to ${handoff.to_agent}.`,
  })

  return {
    timeline: updated.timeline,
    history_event: createProjectHistoryEvent({
      project_id: handoff.project_id,
      event_type: 'handoff_sent',
      actor: handoff.from_agent,
      summary: `${handoff.handoff_type} sent from ${handoff.from_agent} to ${handoff.to_agent}.`,
      created_at: handoff.sent_at,
      metadata: {
        handoff_id: handoff.handoff_id,
        to_agent: handoff.to_agent,
      },
    }),
  }
}

export function acknowledgeProjectHandoff(
  timeline: ProjectTimeline,
  handoff: HandoffRecord,
  ackedAt: string,
): {
  handoff: HandoffRecord
  timeline: ProjectTimeline
  history_event: ProjectHistoryEvent
} {
  const acknowledged = acknowledgeHandoff(handoff, ackedAt)
  const milestoneId =
    handoff.handoff_type === 'lead_handoff'
      ? 'lead_handoff_sent'
      : 'discovery_handoff_sent'
  const updated = applyProjectStatusUpdate(timeline, {
    project_id: handoff.project_id,
    actor: 'project_manager_agent',
    milestone_id: milestoneId,
    status: 'completed',
    timestamp: ackedAt,
    notes: `${handoff.handoff_type} acknowledged by ${handoff.to_agent}.`,
  })

  return {
    handoff: acknowledged,
    timeline: updated.timeline,
    history_event: createProjectHistoryEvent({
      project_id: handoff.project_id,
      event_type: 'handoff_acknowledged',
      actor: handoff.to_agent,
      summary: `${handoff.handoff_type} acknowledged by ${handoff.to_agent}.`,
      created_at: ackedAt,
      metadata: {
        handoff_id: handoff.handoff_id,
      },
    }),
  }
}

export function applyApprovalResponseToTimeline(
  timeline: ProjectTimeline,
  approval: PendingApproval,
  decision: 'approve' | 'reject' | 'revise',
  respondedAt: string,
): {
  approval: PendingApproval
  timeline: ProjectTimeline
  history_event: ProjectHistoryEvent
} {
  const updatedApproval = applyApprovalResponse(approval, decision, respondedAt)
  const milestoneId =
    approval.gate === 'spec_final'
      ? 'spec_approval_pending'
      : approval.gate === 'delivery_final'
        ? 'delivery_approval_pending'
        : undefined

  const timelineResult =
    milestoneId === undefined
      ? timeline
      : applyProjectStatusUpdate(timeline, {
          project_id: approval.project_id,
          actor: 'project_manager_agent',
          milestone_id: milestoneId,
          status: decision === 'approve' ? 'completed' : 'at_risk',
          timestamp: respondedAt,
          notes: `Approval ${approval.gate} responded with ${decision}.`,
        }).timeline

  return {
    approval: updatedApproval,
    timeline: timelineResult,
    history_event: createProjectHistoryEvent({
      project_id: approval.project_id,
      event_type: 'approval_responded',
      actor: 'owner',
      summary: `Approval ${approval.gate} received decision ${decision}.`,
      created_at: respondedAt,
      metadata: {
        approval_gate: approval.gate,
        decision,
      },
    }),
  }
}

function updateMilestone(
  milestone: ProjectMilestone,
  status: MilestoneStatus,
  timestamp: string,
  notes?: string,
): ProjectMilestone {
  return {
    ...milestone,
    status,
    started_at:
      status === 'in_progress' && milestone.started_at === undefined
        ? timestamp
        : milestone.started_at,
    completed_at: status === 'completed' ? timestamp : milestone.completed_at,
    notes: notes ?? milestone.notes,
  }
}
