# GitHub

Status: guidance-only. This skill documents `gh` CLI and GitHub API workflow; it is not loaded by the runtime `SkillRegistry`.
Source: `referensi/openclaw/skills/github`

## Use When

- Inspect pull requests, issues, reviews, CI runs, releases, or repository metadata on GitHub.
- Create or update issues and pull requests after the operator has confirmed the target.
- Summarize PR status, review state, checks, or issue triage queues.
- Use local `git` directly for branch, commit, merge, clone, and diff operations.

## Requirements

- Required binary: `gh`.
- Helpful binaries: `git`, `jq`, `rg`.
- Install hints on Linux:

```bash
# Debian/Ubuntu: prefer GitHub's official apt repository instructions.
# Quick check after install:
gh --version
gh auth status
```

- Credentials must come from `gh auth login`, `GH_TOKEN`, `GITHUB_TOKEN`, or a controlled `GH_CONFIG_DIR`.
- If the runtime shell uses a different home directory than the operator, set `GH_CONFIG_DIR` to the authenticated `gh` config directory in the process environment.

```bash
export GH_CONFIG_DIR=/path/to/operator/.config/gh
gh auth status
```

## Workflow

1. Identify the repository as `owner/repo`. Use `--repo owner/repo` when not already inside the git repo.
2. Start with read-only discovery:

```bash
gh pr list --repo owner/repo --state open --json number,title,author,reviewDecision,statusCheckRollup
gh issue list --repo owner/repo --state open --json number,title,labels,assignees,createdAt
gh run list --repo owner/repo --limit 10 --json databaseId,displayTitle,status,conclusion,createdAt
```

3. Filter with `--jq` instead of scraping text:

```bash
gh issue list --repo owner/repo --json number,title,labels \
  --jq '.[] | "[#\(.number)] \(.title) labels=\([.labels[].name] | join(","))"'

gh pr list --repo owner/repo --json number,title,mergeStateStatus,reviewDecision \
  --jq '.[] | select(.reviewDecision != "APPROVED")'
```

4. Review PR health:

```bash
PR=55
REPO=owner/repo
gh pr view "$PR" --repo "$REPO" --json title,body,author,additions,deletions,changedFiles,reviewDecision,url
gh pr checks "$PR" --repo "$REPO"
gh pr diff "$PR" --repo "$REPO" --name-only
```

5. Confirm before mutating commands:

```bash
gh issue comment 42 --repo owner/repo --body "Thanks, I can reproduce this and will investigate."
gh pr review 55 --repo owner/repo --comment --body "Review summary..."
gh pr merge 55 --repo owner/repo --squash
```

6. Use the GitHub REST API for fields not exposed by first-class commands:

```bash
gh api repos/owner/repo/pulls/55 --jq '{title, state, mergeable, author: .user.login}'
gh api repos/owner/repo/labels --jq '.[].name'
```

## Safety

- Do not print tokens or the contents of `hosts.yml`.
- Use explicit `--repo owner/repo` for mutating commands unless the current repo has been verified.
- Require explicit operator confirmation before commenting, closing, merging, rerunning jobs, editing releases, or changing labels.
- Prefer JSON output with `--json` and `--jq` to reduce accidental leakage from logs.
- Respect GitHub rate limits. Use `gh api --cache 1h` for repeated read-only queries where stale data is acceptable.
- Treat private repository names, issue bodies, and PR diffs as sensitive context.

## Validation

```bash
command -v gh
gh auth status
gh repo view owner/repo --json nameWithOwner,visibility,defaultBranchRef
gh pr list --repo owner/repo --limit 1 --json number,title
```

For docs-only changes to this skill, validate with a grep pass for stale reference-platform names and secret-bearing examples.
