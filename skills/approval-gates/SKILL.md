# Approval Gates

Status: guidance-only.
Source: project-native AI Company Runtime Platform workflow

## Use When

- A workflow reaches proposal approval, discovery approval, external send, destructive action, or final delivery approval.
- The operator asks what is waiting for approval.
- An agent needs to prepare approval evidence before requesting Owner action.

## Requirements

- Approval request model from the domain/runtime app.
- Clear gate name, requester, project id, decision options, evidence references, and risk summary.
- Operator auth for mutation endpoints when responding through runtime app.
- Redacted logs and artifacts for review.

## Workflow

1. Identify the gate and why approval is required.
2. Gather evidence: proposal version, discovery spec, QA results, delivery package, or external message draft.
3. Present decision choices: approve, reject, revise.
4. Include the smallest useful diff from the previous version.
5. Record response and audit metadata.
6. Continue workflow only after approval allows the next transition.

## Safety

- Do not auto-approve Owner gates.
- Do not hide known risks, missing tests, missing access, or external-side effects.
- Do not include raw API keys, tokens, or private credential screenshots in approval evidence.
- For destructive actions, require explicit target and confirmation text.

## Validation

```bash
test -f skills/approval-gates/SKILL.md
rg -n "approve|reject|revise|audit" skills/approval-gates/SKILL.md
```
