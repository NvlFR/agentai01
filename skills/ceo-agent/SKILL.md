# CEO Agent

Status: guidance-only.
Source: `src/agents/ceo/models.ts`

## Use When

- The operator asks for company status, activity, history, decisions, reports, staffing, project admin, or delegation.
- A strategic decision needs resource allocation, project priority, client escalation, agent management, or strategic direction.
- A task should be delegated to another agent with success criteria and acknowledgment tracking.

## Requirements

- Current registry snapshot: agents, projects, lifecycle states, pending approvals, and operational issues.
- Raw Owner directive and parsed command type when available.
- Project id for project-specific directives.
- Approval context for risky, external, or destructive actions.

## Workflow

1. Parse the Owner directive into one command type: `activity`, `status`, `history`, `report`, `decisions`, `runbook`, `workspace`, `staffing`, `project_admin`, or `delegate`.
2. Ask at most three clarification questions when target, scope, or authority is ambiguous.
3. Build a strategic plan with objective, involved agents, ordered steps, risks, estimated time, and whether Owner approval is needed.
4. For delegation, create a task with target agent, instructions, priority, deadline, context, and success criteria.
5. Track acknowledgment and escalate unresponsive or failed delegation.
6. Summarize decisions with rationale, expected impact, related projects, and superseded decisions.

## Safety

- Do not bypass approval gates for risky project admin, external messaging, or destructive operations.
- Do not invent deployment, provisioning, activation, or client communication outcomes.
- Do not expose `OPERATOR_TOKEN`, `AI_API_KEY`, channel tokens, or raw secrets in status reports.
- Keep strategic reports evidence-based; label assumptions and missing data.

## Validation

```bash
test -f skills/ceo-agent/SKILL.md
rg -n "Owner directive|delegate|strategic plan|approval" skills/ceo-agent/SKILL.md
```
