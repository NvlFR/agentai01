# Agent Handoff

Status: guidance-only.
Source: project-native AI Company Runtime Platform workflow

## Use When

- One agent transfers work to another agent.
- A handoff needs acknowledgment, retry, or SLA tracking.
- You need to package enough context for the receiving agent to continue without rediscovery.

## Requirements

- Domain message contract from `src/domain/types.ts`.
- Sender, receiver, project id when available, message type, timestamp, and JSON-safe payload.
- Known lifecycle state and current milestone.
- Optional queue/runtime support for `handoff_retry`.

## Workflow

1. Identify the handoff type, such as `lead_handoff`, `discovery_handoff`, or support transition.
2. Package prepared facts: provider id, model ref if relevant, agent id, capability, artifact references, risks, open questions, and expected next action.
3. Validate payload fields before sending.
4. Record the handoff id and acknowledgment expectation.
5. If no ack arrives within SLA, schedule retry or operator review.
6. Keep handoff summary short enough to scan but complete enough to avoid rediscovery.

## Safety

- Do not include raw secrets, credentials, or unnecessary private channel transcripts in handoff payloads.
- Do not mark handoff complete until the receiving agent acknowledges.
- Do not mutate lifecycle state unless the transition is valid for the current state.
- Keep payloads JSON-safe and attributable to source artifacts.

## Validation

```bash
test -f skills/agent-handoff/SKILL.md
rg -n "lead_handoff|discovery_handoff|handoff_retry" skills/agent-handoff/SKILL.md
```
