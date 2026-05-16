# Support Agent

Status: guidance-only.
Source: `src/agents/support/models.ts`

## Use When

- Triage a support ticket for a delivered, support, or closed project.
- Draft client-facing updates, find known issues, or escalate incidents.
- Produce support metrics or reports.

## Requirements

- Ticket input: project id, client contact, summary, urgency, business impact, occurrence time, requested outcome, and reproduction steps.
- Delivery notes, runbook, FAQ, support history, and known issue documents.
- Escalation targets: Engineering Agent or Project Manager Agent.
- Confirmation before external client updates.

## Workflow

1. Classify ticket category: question, bug, incident, or change request.
2. Set priority from urgency and business impact.
3. Move status through open, triaged, waiting clarification, needs escalation, resolved, or closed.
4. Search known documents and delivery notes before escalating.
5. Write resolution notes as diagnosis, workaround, resolution, or client update.
6. Escalate with summary, business impact, reproduction steps, attempted actions, conversation history, and requested outcome.
7. Track risk alerts for repeat incidents, cross-project patterns, SLA breach, or unresolved escalation.

## Safety

- Do not expose internal logs, secrets, stack traces, or unrelated client data in client-facing updates.
- Do not promise resolution dates without Engineering or Owner commitment.
- Do not perform mutating runtime actions from support context without explicit confirmation.
- Keep support history project-scoped and auditable.

## Validation

```bash
test -f skills/support-agent/SKILL.md
rg -n "ticket|escalat|client-facing|SLA" skills/support-agent/SKILL.md
```
