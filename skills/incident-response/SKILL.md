# Incident Response

Status: guidance-only.
Source: project-native AI Company Runtime Platform workflow

## Use When

- Runtime app, worker, scheduler, Telegram bot, provider, queue, or client workflow is degraded.
- The operator reports an outage, failed job, stuck approval, or suspicious behavior.
- You need a calm triage path before remediation.

## Requirements

- Access to health/readiness endpoints, runtime logs, queue status, provider config, and recent changes.
- `skills/healthcheck`, `skills/session-logs`, `skills/model-usage`, and `skills/runbook-directive`.
- Secret redaction for all logs and screenshots.
- Operator confirmation before restart, queue mutation, external notification, or config change.

## Workflow

1. State the incident hypothesis and affected surface.
2. Gather read-only evidence: `/health`, `/ready`, recent logs, queue depth, provider errors, pending approvals, active workers.
3. Classify severity: degraded, blocked, data-risk, security-risk, or external-impact.
4. Propose remediation with blast radius and rollback notes.
5. Execute only confirmed safe actions.
6. Write a short post-incident note: timeline, root cause, fix, follow-up, and prevention.

## Safety

- Do not expose secrets in incident summaries.
- Do not restart or mutate queues without confirming the target and expected impact.
- Do not notify external clients before Owner approves the message.
- If security boundary bypass is suspected, follow `SECURITY.md` private-report guidance.

## Validation

```bash
test -f skills/incident-response/SKILL.md
rg -n "health|queue|post-incident|SECURITY.md" skills/incident-response/SKILL.md
```
