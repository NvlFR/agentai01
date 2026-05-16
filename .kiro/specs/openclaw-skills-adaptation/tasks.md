# Tasks

## OpenClaw Skills Adaptation

---

## Task List

- [x] 1. Establish Skills Adaptation Baseline
  - [x] 1.1 Audit all skills listed in `TODO-3.md` and map each `referensi/openclaw/skills/<name>/` source to `skills/<name>/`
  - [x] 1.2 Classify each skill as guidance-only, executable, deferred, or ignored with rationale
  - [x] 1.3 Define the required `SKILL.md` structure for use cases, requirements, workflow, safety, and validation
  - [x] 1.4 Align executable skill requirements with `skills/README.md`: `skill.json`, `index.mjs`, and colocated tests
  - [x] 1.5 Add an adaptation status index to `skills/README.md` or a dedicated skills index document

- [x] 2. Adapt Core Operational Skills Batch
  - [x] 2.1 Adapt `skills/coding-agent/` from `referensi/openclaw/skills/coding-agent/`
  - [x] 2.2 Document Codex, Claude Code, Gemini, and other coding-agent delegation patterns without OpenClaw-specific commands
  - [x] 2.3 Document PTY and non-PTY execution modes, progress updates, completion notification, and worktree-based parallel fixing
  - [x] 2.4 Adapt `skills/github/` with `gh` CLI workflows, JSON output, `--jq` filtering, PR review summaries, issue triage, and `GH_CONFIG_DIR`
  - [x] 2.5 Adapt `skills/gh-issues/` with parse, fetch, confirm, pre-flight, spawn, collect, cron, fork, and PR review workflows
  - [x] 2.6 Adapt `skills/taskflow/` with lifecycle, durable state, child task linking, and revision-checked mutation patterns

- [x] 3. Adapt Inbox and Runtime Visibility Skills Batch
  - [x] 3.1 Adapt `skills/taskflow-inbox-triage/` for business, personal, and later routing patterns
  - [x] 3.2 Adapt `skills/healthcheck/` around this repo's `/health`, `/ready`, runtime process checks, and remediation planning
  - [x] 3.3 Adapt `skills/session-logs/` for transcript search, message counts, tool usage summaries, and redacted output
  - [x] 3.4 Adapt `skills/model-usage/` for model usage and cost visibility aligned with this project's provider logs
  - [x] 3.5 Adapt `skills/tmux/` for session inspection, pane scraping, task sending, and safe operator confirmation
  - [x] 3.6 Validate external binary documentation for `tmux`, `jq`, `rg`, and other required tools

- [x] 4. Adapt Communication and Collaboration Skills Batch
  - [x] 4.1 Adapt `skills/slack/` for read operations, reactions, pins, sends, edits, deletes, member info, and emoji list
  - [x] 4.2 Adapt `skills/discord/` for message operations, components, thread management, polls, reactions, and writing style guidance
  - [x] 4.3 Adapt `skills/wacli/` for WhatsApp send, sync, search, explicit recipient selection, and confirmation before send
  - [x] 4.4 Adapt `skills/notion/` for pages, databases, blocks, property types, and current API version notes
  - [x] 4.5 Adapt `skills/trello/` for boards, lists, cards, CRUD operations, and API key/token setup
  - [x] 4.6 Ensure all communication skills separate read-only discovery from mutating actions

- [x] 5. Adapt Content and Utility Skills Batch
  - [x] 5.1 Adapt `skills/summarize/` for URL, YouTube, article, PDF, and local file summarization
  - [x] 5.2 Document summarize CLI model selection, provider configuration, and API key handling
  - [x] 5.3 Adapt `skills/weather/` with `wttr.in`, output format codes, and no-secret validation
  - [x] 5.4 Decide whether `weather` should become an executable skill and implement `skill.json`, `index.mjs`, and tests if yes
  - [x] 5.5 Adapt `skills/nano-pdf/` for PDF extraction, temp file handling, and document privacy
  - [x] 5.6 Adapt `skills/openai-whisper/` and `skills/openai-whisper-api/` for local and API transcription workflows

- [x] 6. Adapt Automation and Extension Skills Batch
  - [x] 6.1 Adapt `skills/xurl/` for X/Twitter post, reply, search, DM, media upload, multi-account setup, and secret safety
  - [x] 6.2 Adapt `skills/skill-creator/` to this repo's skill authoring flow and `skills/workshop.mjs`
  - [x] 6.3 Adapt `skills/sag/` for structured sub-agent spawning patterns that fit this project's agent workflow
  - [x] 6.4 Adapt `skills/obsidian/` for vault search and note creation if a Linux-compatible workflow is available
  - [x] 6.5 Adapt `skills/oracle/` with read-only-first database examples and strict credential handling
  - [x] 6.6 Classify miscellaneous low-priority skills from `TODO-3.md` as adapted, deferred, or ignored

- [x] 7. Classify macOS and Hardware-Specific Skills
  - [x] 7.1 Mark Apple Notes, Apple Reminders, Bear Notes, Things, and iMessage skills as deferred by default
  - [x] 7.2 Mark camera, screen capture, Bluetooth, Hue, Sonos, Spotify playback, and local machine-specific skills as deferred by default
  - [x] 7.3 Document platform requirements and future reconsideration criteria for each deferred group
  - [x] 7.4 Ensure deferred skills add no runtime dependencies or normal setup requirements

- [x] 8. Add Cross-Cutting Safety and Consistency Pass
  - [x] 8.1 Remove or translate OpenClaw-specific names, commands, state paths, and hub references
  - [x] 8.2 Ensure every adapted skill documents required binaries, install hints, and validation commands
  - [x] 8.3 Ensure every external API skill documents credential source and avoids raw secret output
  - [x] 8.4 Ensure every externally visible or destructive action has explicit target and confirmation guidance
  - [x] 8.5 Ensure examples use project-relative paths and project-native runtime concepts

- [x] 9. Validate Guidance-Only Skills
  - [x] 9.1 Check every adapted guidance-only skill has a complete `SKILL.md`
  - [x] 9.2 Search adapted docs for stale `openclaw`, `~/.openclaw`, and `openclaw message send` references
  - [x] 9.3 Verify command examples do not print secrets or assume unavailable accounts
  - [x] 9.4 Update the skills index with status, required tools, secrets, and validation command per skill

- [x] 10. Validate Executable Skills
  - [x] 10.1 Run `bun skills/workshop.mjs validate skills/<name>` for every executable adapted skill
  - [x] 10.2 Run `bun test skills/<name>` for every executable adapted skill
  - [x] 10.3 Use narrow mocks for API/network behavior and avoid real credentials in tests
  - [x] 10.4 Run `npm run check` when executable skill code or shared runtime contracts are changed
  - [x] 10.5 Run `bun test` before handoff when executable skill changes affect shared skill registry behavior

- [x] 11. Final Handoff
  - [x] 11.1 Summarize adapted, executable, deferred, and ignored skills
  - [x] 11.2 Record validation evidence for each completed batch
  - [x] 11.3 Note missing external binaries or account access that prevented live verification
  - [x] 11.4 Confirm no changes were made to `referensi/openclaw/` or `node_modules/`

## Completion Notes

- Adapted guidance skills: `coding-agent`, `github`, `gh-issues`, `taskflow`, `taskflow-inbox-triage`, `healthcheck`, `session-logs`, `model-usage`, `tmux`, `slack`, `discord`, `wacli`, `notion`, `trello`, `summarize`, `nano-pdf`, `openai-whisper`, `openai-whisper-api`, `xurl`, `skill-creator`, `sag`, `obsidian`, `oracle`.
- Adapted executable skills: `weather`.
- Deferred skills are indexed in `skills/README.md`: macOS-only, hardware-specific, account-specific, and low-priority utility skills from `TODO-3.md`.
- Ignored skills: `clawhub`, because it is OpenClaw hub-specific and replaced here by the project skills index.
- Validation passed: `bun skills/workshop.mjs validate skills/weather`; `bun test skills/weather`; `bun test skills/workshop.test.ts skills/echo-text/index.test.ts skills/weather/index.test.ts src/runtime-app/skills/SkillRegistry.test.ts`; `npm run check`; required-section scan for every adapted `SKILL.md`; stale-reference scan excluding intentional `Source:` metadata; secret-shaped literal scan; `git diff --name-only -- referensi/openclaw node_modules`.
- Full `bun test` was attempted. It fails because Bun discovers upstream reference tests under `referensi/openclaw/` that depend on unavailable OpenClaw package aliases/Vitest APIs, for example `openclaw/plugin-sdk/channel-entry-contract`, `openclaw/plugin-sdk/plugin-test-runtime`, `vitest/package.json`, and `vi.hoisted`. The adapted skill and runtime-skill targeted tests pass.
- Live external-account validation was not attempted for Slack, Discord, WhatsApp, Notion, Trello, X, Oracle, 1Password, or provider APIs because credentials/accounts must remain operator-owned and secret-sourced.
