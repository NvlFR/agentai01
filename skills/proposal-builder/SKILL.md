# Proposal Builder

Status: guidance-only.
Source: project-native AI Company Runtime Platform workflow

## Use When

- Draft a proposal for a qualified lead or active prospect.
- Convert discovery notes into scope, outcomes, assumptions, timeline, and price range.
- Revise an existing proposal without overwriting the previous version.

## Requirements

- Qualified lead context from Sales Agent.
- Discovery notes, pain points, desired business outcomes, and constraints.
- Project-relative artifact path such as `projects/<client>/<project>/proposal-v1.md`.
- Owner confirmation before sending externally visible proposal text.

## Workflow

1. Confirm the lead is at `qualified`, `proposal`, or equivalent sales stage.
2. Summarize the business problem in the client's language.
3. Draft sections: objective, expected outcomes, scope, out of scope, timeline, investment range, assumptions, risks, and next step.
4. Mark unresolved scope items as `[NEEDS_SCOPING]`.
5. Version the artifact as `proposal-vN.md`; never overwrite prior accepted versions.
6. Ask Owner to approve, revise, or reject before any external send.

## Safety

- Do not invent pricing, guarantees, legal terms, or delivery dates without explicit basis.
- Keep confidential client details inside the project namespace.
- Do not send proposals through Slack, WhatsApp, email, or Notion until target and confirmation are explicit.
- Keep payment instructions and contracts outside this skill unless Owner provides approved text.

## Validation

```bash
test -f skills/proposal-builder/SKILL.md
rg -n "NEEDS_SCOPING|proposal-vN|Owner" skills/proposal-builder/SKILL.md
```
