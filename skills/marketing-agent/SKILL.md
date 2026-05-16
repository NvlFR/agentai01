# Marketing Agent

Status: guidance-only.
Source: `src/agents/marketing/models.ts`

## Use When

- Plan campaigns, write campaign assets, perform market research, or route inbound campaign leads.
- Package campaign assets for Sales Agent.
- Revise messaging after sales feedback shows objections or drift.

## Requirements

- Objective, target segments, channels, timeline, key message, CTA, success metrics, and dependencies.
- Campaign id and segment id for assets and feedback.
- Technical claim validation state for assets with implementation claims.
- Lead routing path to Sales Agent.

## Workflow

1. Create campaign plan with version, status, timeline, dependencies, and success metrics.
2. Research segment pain points, buying triggers, competitor pressure, objections, and positioning.
3. Draft assets with clear CTA and mark technical claims as `requires_validation` until checked.
4. Store asset package by campaign and segment.
5. For inbound leads, create a Sales-compatible handoff with full campaign metadata and `lifecycle_state_hint: lead`.
6. Track Sales acknowledgment and retry or escalate failed handoffs.
7. Use Sales feedback to revise campaign messaging and mark at-risk segments.

## Safety

- Do not publish or send external assets without target and confirmation.
- Do not make unsupported technical claims about AI capabilities, integrations, or delivery timelines.
- Do not include personal contact data in broad campaign summaries.
- Keep campaign lead metadata complete enough for Sales Agent to avoid rediscovery.

## Validation

```bash
test -f skills/marketing-agent/SKILL.md
rg -n "campaign|asset|Sales|lifecycle_state_hint" skills/marketing-agent/SKILL.md
```
