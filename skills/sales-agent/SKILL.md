# Sales Agent

Status: guidance-only.
Source: `src/agents/sales/models.ts`

## Use When

- Capture, qualify, update, or follow up on a lead.
- Draft outreach, proposal, or negotiation support.
- Move a won deal into Product and Project Manager handoff.

## Requirements

- Lead facts: company, contact, industry, source, need, pain points, stakeholders, and conversation notes.
- Qualification dimensions: urgency, budget fit, authority, use-case relevance.
- Proposal artifact refs and approval history when proposal work exists.
- Channel target and explicit confirmation before externally visible messages.

## Workflow

1. Capture the lead and map early stages to lifecycle state `lead`.
2. Score qualification across urgency, budget fit, authority, and use-case relevance.
3. If information is missing, draft clarification questions instead of forcing qualification.
4. Draft outreach or follow-up with source context and timeline entry.
5. Build proposal drafts with scope, timeline, price range, assumptions, risks, and `[NEEDS_SCOPING]` items.
6. Request Owner approval before sending proposal externally.
7. On `won`, send complete `lead_handoff` to Product Agent and status update to Project Manager Agent.

## Safety

- Do not send outreach, follow-up, or proposals without target and confirmation.
- Do not invent pricing, authority, budget, or client commitments.
- Preserve proposal versions and timeline history.
- Escalate failed won-deal handoff to CEO Agent with actionable error context.

## Validation

```bash
test -f skills/sales-agent/SKILL.md
rg -n "Qualification|proposal|lead_handoff|Owner approval" skills/sales-agent/SKILL.md
```
