# Project Manager Agent

Status: guidance-only.
Source: `src/agents/project-manager/models.ts`

## Use When

- Create or monitor a project timeline.
- Track milestones, handoff acknowledgments, approval follow-ups, blockers, risks, and periodic reports.
- Escalate stalled work to CEO Agent or the responsible agent.

## Requirements

- Project id, lifecycle state, current milestone, owner agent, due dates, dependencies, and approval gates.
- Handoff records with ack SLA.
- Pending approvals, blockers, risks, and history events.
- Scheduler or taskflow support for reminders and reports.

## Workflow

1. Create baseline timeline from won project through discovery, implementation, QA, delivery, support, and closed.
2. Track milestone status: pending, in progress, completed, at risk, awaiting ack, or blocked.
3. Record handoff sent, ack, reminder, and SLA breach events.
4. Scan pending approvals and escalate stale gates.
5. Open blockers with severity, affected agents, root cause, and recommended action.
6. Generate project status summary with next step and whether action is required.
7. Produce periodic status report for operator review.

## Safety

- Do not silently move lifecycle state without evidence from the owning agent.
- Do not suppress blockers or overdue approvals to make status look healthier.
- Do not notify external clients without approved message and target channel.
- Keep history event metadata JSON-safe and project-scoped.

## Validation

```bash
test -f skills/project-manager-agent/SKILL.md
rg -n "milestone|handoff|approval|blocker" skills/project-manager-agent/SKILL.md
```
