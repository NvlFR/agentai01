# Lead Intake

Status: guidance-only.
Source: project-native AI Company Runtime Platform workflow

## Use When

- Capture a new inbound lead from Owner, marketing, support, Telegram, Slack, email, or manual notes.
- Normalize minimum lead facts before handing work to Sales Agent.
- Decide whether a lead is ready for qualification or needs clarification.

## Requirements

- Access to the lead source text or channel message.
- Project-native lifecycle states from `src/domain/types.ts`.
- Optional channel skill for the source, such as `skills/slack`, `skills/wacli`, or `skills/taskflow-inbox-triage`.
- Store credentials only in env, `.env.local`, auth profiles, or the relevant channel secret store.

## Workflow

1. Capture source, company name, primary contact, industry, source channel, need summary, urgency, and known budget signal.
2. Separate facts from assumptions. Mark unknown items as `needs_clarification`.
3. Map initial pipeline state to `Lifecycle_State: lead`.
4. Prepare a compact `lead_handoff` payload for Sales Agent with source attribution.
5. Ask only necessary clarification questions before proposing a solution.
6. Record next action, owner, and due time if the lead cannot be processed immediately.

## Safety

- Do not expose raw contact details outside the intended operator/channel context.
- Do not claim qualification, pricing, or delivery commitment before Sales Agent or Owner confirms.
- Do not create a project namespace until the lead has enough identity and intent to track.
- Redact tokens, private URLs, phone numbers, and email addresses from summaries unless the operator explicitly needs them.

## Validation

```bash
test -f skills/lead-intake/SKILL.md
rg -n "lead_handoff|Lifecycle_State|needs_clarification" skills/lead-intake/SKILL.md
```
