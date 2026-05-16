# TaskFlow

Status: guidance-only. This skill documents durable orchestration patterns; it is not loaded by the runtime `SkillRegistry`.
Source: `referensi/openclaw/skills/taskflow`

## Use When

- Coordinate a multi-step job that may outlive a single prompt, worker process, or operator interaction.
- Track child coding-agent or runtime-agent tasks under one parent goal.
- Persist small resume state between steps.
- Represent waiting, blocked, finished, failed, cancelled, and resumed work with revision-checked updates.
- Avoid TaskFlow for simple synchronous commands or one-shot local edits.

## Requirements

- Project concepts: runtime app, operator shell, agent registry, and future `SkillRegistry` integrations.
- Implementation should use project-native TypeScript contracts if this becomes executable later.
- Required validation tools for code changes: `npm`, `bun`, `git`.
- Durable state must be stored in an approved runtime store or documented local state file, not hidden inside prompts.

## Workflow

1. Define the flow owner and goal:
   - owner session or operator route
   - controller id
   - current step
   - minimal `stateJson`
   - expected validation and completion behavior
2. Create a managed flow when the orchestration layer owns the lifecycle.
3. Follow the managed lifecycle names in implementation docs and code reviews: `createManaged`, `runTask`, `setWaiting`, `resume`, `finish`, `fail`, `requestCancel`, and `cancel`.
4. Link child work through flow-aware task creation rather than unrelated detached jobs.
5. Store only resume-critical state:

```json
{
  "issueNumbers": [123],
  "openPullRequests": [],
  "lastCheckedAt": "2026-05-16T00:00:00.000Z"
}
```

6. When waiting on a person, external system, CI run, or review, set a waiting or blocked state with structured wait metadata.
7. Resume only after the wait condition has been verified.
8. Carry the latest revision after every successful mutation. Mutating with a stale revision must fail and be retried from a fresh read.
9. Finish with a compact result summary, or fail with an actionable reason and the step where failure occurred.

## Safety

- Keep business decisions above the flow layer. TaskFlow stores state and links child tasks; it should not hardcode agent policy or product-specific defaults.
- Do not store credentials, tokens, raw `.env.local` content, or secret-bearing logs in `stateJson` or `waitJson`.
- Use revision-checked mutations for conflict safety when multiple workers may touch the same flow.
- Use explicit cancellation semantics:
  - request cancellation to stop future scheduling
  - cancel active child tasks only after confirming the impact
- Keep state small. Store references to large logs or transcripts, not the full content.
- Redact external channel identifiers and private URLs in summaries unless the operator needs them.

## Validation

For guidance-only use, validate the design before implementation:

```bash
git status --short
npm run check
bun test
```

If TaskFlow becomes executable later, add `skill.json`, `index.mjs`, and colocated tests, then validate with:

```bash
bun skills/workshop.mjs validate skills/taskflow
bun test skills/taskflow
```
