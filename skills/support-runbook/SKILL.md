# Support Runbook

Status: guidance-only.
Source: project-native AI Company Runtime Platform workflow

## Use When

- A delivered project enters support or needs operational follow-up.
- The operator asks for a repeatable incident, maintenance, or client response flow.
- Support Agent needs enough context without pulling raw implementation details into every response.

## Requirements

- Delivery package, known limitations, active environment assumptions, and support channel.
- Runtime health surfaces such as `/health`, `/ready`, logs, queue state, and provider status.
- Client-safe response template and internal escalation criteria.
- Secret-safe diagnostic process.

## Workflow

1. Classify request: question, bug, outage, enhancement, billing, or access issue.
2. Gather safe diagnostics using `skills/healthcheck`, `skills/session-logs`, and `skills/model-usage` when relevant.
3. Check known limitations and recent delivery notes before escalating.
4. Draft client response with status, next step, and ETA only when evidence supports it.
5. Escalate to Engineering or Owner when production behavior, cost, auth, or scope changes are involved.
6. Record resolution and follow-up commitments.

## Safety

- Do not expose internal logs, stack traces, credentials, or unrelated client data.
- Do not promise fix times without an owner.
- Do not run mutating directives from support context without confirmation.
- Keep support notes project-relative and auditable.

## Validation

```bash
test -f skills/support-runbook/SKILL.md
rg -n "healthcheck|session-logs|escalate" skills/support-runbook/SKILL.md
```
