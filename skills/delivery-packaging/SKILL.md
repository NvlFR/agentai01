# Delivery Packaging

Status: guidance-only.
Source: project-native AI Company Runtime Platform workflow

## Use When

- Engineering has completed implementation and needs to prepare handoff to Owner, client, or Support Agent.
- A deliverable needs QA evidence, known limitations, and support instructions.
- Final delivery approval is required.

## Requirements

- Implementation artifacts and project-relative paths.
- Test/check output relevant to the touched surface.
- Known limitations, deployment status, rollback notes, and support contact path.
- Owner approval before marking the lifecycle as `delivered`.

## Workflow

1. Collect changed artifacts, behavior summary, validation evidence, and unresolved risks.
2. Create a versioned delivery package such as `delivery-v1.md`.
3. Include operator instructions, client-facing summary, support runbook, and rollback or recovery path.
4. Request final delivery approval with evidence attached.
5. After approval, update lifecycle state and send support handoff.
6. Preserve previous delivery versions when revisions are requested.

## Safety

- Do not mark `delivered` before final approval.
- Do not include secrets, raw `.env.local`, or provider credentials in delivery notes.
- Do not claim deployment, provisioning, or activation happened unless the directive actually executed.
- Keep client-facing text separate from internal risk notes when needed.

## Validation

```bash
test -f skills/delivery-packaging/SKILL.md
rg -n "delivery-v1|delivered|final approval" skills/delivery-packaging/SKILL.md
```
