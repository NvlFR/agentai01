# GitHub Issues Auto-Fix

Status: guidance-only. This skill documents orchestration for issue fixing; it is not loaded by the runtime `SkillRegistry`.
Source: `referensi/openclaw/skills/gh-issues`

## Use When

- Fetch GitHub issues, select actionable items, and delegate focused fixes to coding agents.
- Run a safe auto-fix loop for labeled issues with operator confirmation.
- Handle review comments on existing `fix/issue-*` pull requests.
- Use fork mode when branches must be pushed to a fork while PRs target the upstream repo.
- Use cron mode only for pre-approved, narrow issue queues.

## Requirements

- Required binaries: `git`, `gh`, `jq`, `rg`.
- Optional binaries for delegated work: `codex`, `claude`, `gemini`, `opencode`.
- Credentials: `gh auth login`, `GH_TOKEN`, or `GITHUB_TOKEN`. Store tokens in environment variables, `.env.local`, an authenticated `gh` profile, or a secret manager.
- Never echo token values. Validate auth with:

```bash
gh auth status
gh api user --jq '.login'
```

## Workflow

The core auto-fix workflow has six phases: parse arguments, fetch issues, confirm selection, run pre-flight checks, spawn fix agents, and collect results. PR review handling can run after collection or as its own `--reviews-only` flow.

1. Parse request arguments:

```text
owner/repo
--label <label>
--limit <n>
--milestone <title-or-number>
--assignee <login-or-@me>
--state open|closed|all
--fork <user/repo>
--watch
--interval <minutes>
--dry-run
--yes
--reviews-only
--cron
--model <agent-model>
--notify <channel-or-route>
```

2. Fetch issues with read-only commands. Exclude pull requests from issue results.

```bash
gh issue list --repo owner/repo --state open --limit 10 \
  --json number,title,body,labels,assignees,url \
  --jq '.[] | {number,title,labels:[.labels[].name],url}'
```

3. Present a table of candidates and ask the operator to choose `all`, a comma-separated issue list, or `cancel`. `--dry-run` stops here. `--yes` may skip the prompt only when the target filters were already approved.
4. Run pre-flight checks:

```bash
git status --porcelain
git rev-parse --abbrev-ref HEAD
git ls-remote --exit-code origin HEAD
gh auth status
```

5. Check for existing PRs and in-progress branches before spawning work:

```bash
gh pr list --repo owner/repo --state open --head fix/issue-123 --json number,url,headRefName
gh api repos/owner/repo/branches/fix/issue-123 --silent
```

6. Spawn one coding agent per confirmed issue, up to the concurrency the operator approves. Each worker prompt must include source repo, push repo, base branch, issue number, issue URL, fork mode, validation commands, and secret rules.
7. Worker implementation loop:
   - Create branch `fix/issue-<number>` from the base branch.
   - Read the issue and locate relevant code with `rg`.
   - Make the minimal fix.
   - Run focused tests, then broader validation when practical.
   - Commit with `Fixes owner/repo#<number>`.
   - Push to the approved remote.
   - Open a PR with a summary, changed files, and test results.
8. Collect results into a table: issue, status, PR URL, files changed, validation, and caveats.
9. For `--reviews-only`, or after creating PRs, inspect review sources:

```bash
gh pr list --repo owner/repo --state open --json number,title,headRefName,url \
  --jq '.[] | select(.headRefName | startswith("fix/issue-"))'
gh pr view 99 --repo owner/repo --json reviews,comments,reviewDecision,statusCheckRollup
```

10. Address actionable comments only after confirmation, unless operating in an explicitly approved cron review mode.

## Safety

- Fork mode: show `source repo`, `push repo`, and target base branch before any branch or PR action.
- Cron mode: restrict to narrow labels or assignees, process at most one issue per tick unless separately approved, and keep durable claim state outside git.
- Review-comment handling: ignore approvals and informational bot comments; act on concrete change requests, failing-test reports, or clear code concerns.
- Do not include raw issue bodies, review bodies, or transcripts in long-lived state when watch mode loops.
- Do not force-push. Do not modify the base branch. Do not open PRs for low-confidence fixes.
- Require confirmation before comments, PR creation, branch deletion, merge, or rerun of paid CI.
- Mask tokens in logs and summaries. Never embed tokens in remote URLs shown to the operator.

## Validation

```bash
command -v git gh jq rg
gh auth status
gh issue list --repo owner/repo --limit 1 --json number,title
gh pr list --repo owner/repo --limit 1 --json number,title,headRefName
```

For this guidance-only skill, validation is documentation and environment validation. If the workflow creates code changes, the worker must run the repo-specific checks before opening or handing off the PR:

```bash
npm run check
bun test
npm run runtime:smoke
```
