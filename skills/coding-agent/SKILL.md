# Coding Agent

Status: guidance-only. This skill documents operator workflow; it is not loaded by the runtime `SkillRegistry`.
Source: `referensi/openclaw/skills/coding-agent`

## Use When

- Delegate a focused coding task to Codex, Claude Code, Gemini CLI, OpenCode, or an equivalent coding agent.
- Run parallel fixes or reviews in separate git worktrees.
- Need an agent to explore files, implement changes, run tests, and report back.
- Avoid this skill for one-line edits, simple file reads, or work that must stay in the current interactive turn.

## Requirements

- Required repo tools: `git`, `rg`, `npm`, `bun`.
- Optional agent binaries: `codex`, `claude`, `gemini`, `opencode`.
- Install hints:
  - Codex CLI: follow the current OpenAI Codex CLI install docs for your environment.
  - Claude Code: install the official Claude Code CLI with npm or the vendor-supported installer.
  - Gemini CLI: install the official Gemini CLI and authenticate with its supported profile.
- Verify availability:

```bash
command -v git rg npm bun
command -v codex || command -v claude || command -v gemini || command -v opencode
```

## Workflow

1. Capture the task, repo path, expected branch or worktree, validation commands, and completion route before starting.
2. Prefer a clean git worktree for parallel work:

```bash
git fetch origin
git worktree add ../agentai01-issue-123 -b fix/issue-123 origin/main
```

3. Start the coding agent in the background or an isolated terminal session. Use PTY-capable sessions for interactive CLIs such as Codex, Gemini, and OpenCode. Use non-interactive print mode for CLIs that support it.
4. Put the handoff details directly in the prompt:

```text
Work in this repository only.
Do not edit reference-source directories or node_modules.
Before finishing, run npm run check and the focused tests for touched code when applicable.
Do not print secrets.
Report changed files, validation results, and blockers.
```

5. Monitor output periodically. If the worker needs approval for destructive, external, or secret-bearing actions, pause and ask the operator.
6. Collect the final result, inspect the diff, and rerun validation locally before handoff.
7. Clean up only worktrees or temp directories created for this task after the result has been reviewed.

## Safety

- Do not pass raw credentials, `.env.local`, tokens, or private URLs into a worker prompt.
- Never run a coding agent inside generated dependencies or reference-source directories.
- Keep each worker scoped to one task and one branch/worktree.
- Do not force-push, delete branches, or mutate remote state without explicit operator confirmation.
- If multiple workers are active, check `git status --short` before editing to avoid overwriting concurrent changes.
- Completion notifications must use the channel available in this project, such as the current chat or a configured Telegram route. Do not claim an external notification was sent unless it actually was.

## Validation

```bash
git status --short
npm run check
bun test
npm run runtime:smoke
```

Run focused tests first when available. Run `npm run runtime:smoke` only when provider credentials and a real runtime smoke test are expected for the handoff.
