# Project Kickoff

Status: guidance-only.
Source: project-native AI Company Runtime Platform workflow

## Use When

- Start discovery or implementation for an approved client project.
- Align Sales, Product, Engineering, Support, and Owner around one delivery plan.
- Turn proposal commitments into concrete milestones and evidence requirements.

## Requirements

- Approved proposal or Owner directive.
- Project id, client id, lifecycle state, active agents, and current milestone.
- Access to `src/domain/types.ts` lifecycle semantics when mapping state transitions.
- Optional `skills/taskflow` for durable multi-step tracking.

## Workflow

1. Confirm the current lifecycle state and intended next state.
2. Build kickoff brief: goal, stakeholders, scope, out of scope, risks, dependencies, milestones, approval gates, communication rhythm.
3. Assign agent responsibilities without cross-importing agent internals.
4. Convert milestones into taskflow items or runtime jobs if execution will span turns.
5. Define required evidence for discovery, implementation, QA, delivery, and support.
6. Send a kickoff summary to the operator and wait for explicit approval before external distribution.

## Safety

- Do not skip approval gates to accelerate delivery.
- Do not hardcode agent ids or policies in core docs or code.
- Keep client-specific artifacts project-relative.
- Document uncertainty instead of turning assumptions into commitments.

## Validation

```bash
test -f skills/project-kickoff/SKILL.md
rg -n "lifecycle|approval gates|milestones" skills/project-kickoff/SKILL.md
```
