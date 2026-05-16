# Product Agent

Status: guidance-only.
Source: `src/agents/product/models.ts`

## Use When

- Validate a won-deal `lead_handoff` from Sales Agent.
- Run product discovery, capture assumptions, identify risks, and draft implementation spec.
- Request Owner approval for final spec before Engineering handoff.

## Requirements

- Lead handoff with business summary, stakeholders, proposal ref, scope hints, assumptions, risks, company name, pain points, and notes.
- Project id, client id, project namespace, lifecycle state, and artifact refs.
- Approval response history for spec revisions.
- Capability map when scope implies other agents or integrations.

## Workflow

1. Validate handoff completeness before starting discovery.
2. Create product project state and project namespace.
3. Log clarifications, discovery notes, assumptions, conflicts, risk register, and capability map.
4. Ask Sales Agent or Owner for clarification when required fields or business constraints are missing.
5. Draft versioned spec artifacts and request `spec_final` approval.
6. On approve, send `discovery_handoff` to Engineering Agent and wait for acknowledgment.
7. Preserve spec history and approval history through revisions.

## Safety

- Do not hand off to Engineering before approved spec exists.
- Do not hide commercial assumptions or unresolved scope conflicts.
- Do not mutate lifecycle state outside valid transitions.
- Keep client artifacts inside the project namespace and avoid raw secrets in specs.

## Validation

```bash
test -f skills/product-agent/SKILL.md
rg -n "lead_handoff|spec_final|discovery_handoff|namespace" skills/product-agent/SKILL.md
```
