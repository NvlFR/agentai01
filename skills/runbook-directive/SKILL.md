# Runbook Directive

Status: guidance-only.
Source: project-native AI Company Runtime Platform workflow

## Use When

- The operator gives a directive through runtime app, Telegram, or local CLI.
- A request may trigger real runtime action.
- You need to separate read-only diagnostics from safe mutation and destructive mutation.

## Requirements

- Runtime app directive surface or Telegram `/directive` behavior.
- Operator token for authenticated mutation endpoints.
- Clear mode: read-only, semi, or confirmed destructive action.
- Confirmation record for externally visible, costly, or destructive actions.

## Workflow

1. Parse the directive into intent, target, mode, expected output, and risk level.
2. Prefer read-only inspection first: status, health, activity, queue, approvals, logs.
3. In `semi` mode, run only safe operational actions such as audit, check/test/smoke, or limited self-heal.
4. For destructive or externally visible actions, present target, consequence, and exact confirmation prompt.
5. Execute through the runtime directive path only after confirmation is present.
6. Report what actually executed, evidence, and next action.

## Safety

- Do not claim deployment, provisioning, activation, messaging, or deletion occurred unless the directive executed.
- Do not print `OPERATOR_TOKEN`, `AI_API_KEY`, `TOKEN_TELE`, or channel tokens.
- Do not use freeform shell commands when a narrower runtime capability exists.
- Keep audit logs for mutation and confirmation decisions.

## Validation

```bash
test -f skills/runbook-directive/SKILL.md
rg -n "semi|confirmation|OPERATOR_TOKEN|directive" skills/runbook-directive/SKILL.md
```
