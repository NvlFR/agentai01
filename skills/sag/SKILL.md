# SAG

Status: guidance-only.
Source: `referensi/openclaw/skills/sag`

## Use When

- Use for structured sub-agent guidance in this repo: split a larger task into narrow worker assignments, define ownership, and collect results.
- Use when coordinating Codex workers, Kiro planning, Gemini review, or AI Company Runtime agents without changing core agent contracts.
- Use when a chat session needs clear sub-agent prompts, boundaries, validation expectations, and handoff format.

## Requirements

- Read `AI-WORKFLOW.md`, `AGENTS.md`, and the relevant spec or TODO before spawning work.
- Use existing project roles:
  - Kiro: planning, specs, architecture.
  - Codex: implementation in repo/worktree.
  - Gemini: broad analysis and review.
  - Runtime agents: delegate through existing registry/domain contracts.
- For runtime staffing directives, use project-native commands such as `/directive spawn-agent --type engineering --count 1 --project PROJECT_ID` only when the operator explicitly requests runtime provisioning.
- Each sub-agent assignment must include ownership scope, files allowed to edit, files forbidden to edit, validation, and final report format.

## Workflow

1. Identify independent work slices. Avoid overlapping file ownership unless coordination is explicit.
2. Assign worker labels, for example Worker A, Worker B, Worker C.
3. For each worker, write a compact prompt containing:
   - repo root
   - required context files
   - exact owned paths
   - forbidden paths
   - task objective
   - expected validation commands
   - final answer requirements
4. Require each worker to read root rules and scoped `AGENTS.md` before editing.
5. Require each worker to respect dirty worktree state and never revert others.
6. Keep worker outputs easy to merge:
   - changed files
   - validation run
   - unresolved blockers
   - no claims of deployment or provisioning unless actually executed.
7. Collect reports, inspect overlap, then run the highest-signal validation for the touched surface.

## Safety

- Do not assign two workers to the same file unless one is explicitly read-only review.
- Do not let sub-agents edit the upstream reference tree, `node_modules/`, snapshots, or expected-failure baselines without explicit approval.
- Do not pass secrets into worker prompts.
- Do not ask a worker to claim external side effects. External writes and destructive actions require explicit operator confirmation.
- Runtime agent spawning is operational state, not documentation. Confirm before using `/directive` actions.

## Validation

Use validation that matches the assigned work:

```bash
npm run check
bun test
bun test skills/<name>
npm run runtime:smoke
```

For guidance-only documentation batches, validate by reading the produced `SKILL.md`, checking stale source terms, and confirming no forbidden paths changed.
