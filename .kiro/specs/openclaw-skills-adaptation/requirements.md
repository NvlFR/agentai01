# Requirements Document

## Introduction

Feature **openclaw-skills-adaptation** adalah adaptasi menyeluruh terhadap skill definitions di `referensi/openclaw/skills/` ke dalam ekosistem `skills/` AI Company Runtime Platform.

Berbeda dari adaptasi `src/`, feature ini berfokus pada reusable operational skills: panduan penggunaan tool eksternal, workflow agent, channel komunikasi, produktivitas, dan skill authoring. Semua skill di `TODO-3.md` dianggap relevan sebagai referensi, tetapi tidak semua harus menjadi runtime executable skill sejak awal.

Prinsip adaptasi:

1. adaptasi bukan copy-paste mentah dari OpenClaw
2. semua referensi `openclaw` diganti dengan istilah dan entrypoint project ini
3. bagian yang bergantung pada state dir, command, atau platform OpenClaw dibuang
4. setiap skill hasil adaptasi wajib punya `SKILL.md` sebagai panduan penggunaan
5. skill executable wajib mengikuti kontrak `skills/README.md`: `skill.json`, `index.mjs`, dan test
6. binary eksternal wajib didokumentasikan cara install dan batasan operasionalnya
7. secret, credential, token, dan API key tidak boleh dicetak, dicommit, atau dimasukkan ke konteks LLM mentah

Tujuan akhir: folder `skills/` menjadi katalog kemampuan yang konsisten untuk operator dan agent runtime, mulai dari coding delegation, GitHub automation, TaskFlow, channel integrations, sampai utilitas produktivitas.

---

## Glossary

- **Reference_Skill**: Skill sumber di `referensi/openclaw/skills/<name>/`.
- **Adapted_Skill**: Skill hasil adaptasi di `skills/<name>/`.
- **Guidance_Skill**: Skill yang hanya menyediakan `SKILL.md` dan assets pendukung karena eksekusinya dilakukan via CLI/API eksternal atau operator workflow.
- **Executable_Skill**: Skill yang bisa ditemukan oleh runtime `SkillRegistry` dan punya `skill.json`, `index.mjs`, serta test.
- **Batch**: Kelompok pengerjaan berdasarkan prioritas dalam `TODO-3.md`.
- **External_Binary**: Tool CLI di luar repo seperti `gh`, `tmux`, `wacli`, `xurl`, `summarize`, atau tool transcription.
- **Channel_Skill**: Skill untuk komunikasi eksternal seperti Slack, Discord, WhatsApp, Telegram-adjacent routing, Notion, atau Trello.
- **Secret_Boundary**: Aturan bahwa credentials hanya boleh berasal dari environment, `.env.local`, auth profile, atau secret store yang aman.

---

## Requirements

### Requirement 1: Skills Adaptation Baseline

**User Story:** As a developer, I want a single adaptation baseline for all OpenClaw skills, so that every adapted skill follows the same project conventions.

#### Acceptance Criteria

1. THE Reference_Skill adaptation SHALL preserve useful workflow patterns while removing OpenClaw-specific commands, paths, and product names.
2. THE Adapted_Skill SHALL live under `skills/<name>/` unless a different target path is explicitly justified.
3. EVERY Adapted_Skill SHALL include a `SKILL.md` that explains trigger conditions, usage workflow, required tools, safety rules, and validation steps.
4. EVERY Executable_Skill SHALL include `skill.json`, `index.mjs`, and at least one colocated behavior test.
5. THE adaptation SHALL not edit `referensi/openclaw/` or `node_modules/`.
6. THE adaptation SHALL document whether each skill is guidance-only or executable by the runtime skill registry.

### Requirement 2: Skill Runtime Compatibility

**User Story:** As a runtime developer, I want adapted executable skills to follow the existing skill registry contract, so that they can be loaded and tested consistently.

#### Acceptance Criteria

1. EVERY Executable_Skill manifest SHALL satisfy the schema documented in `skills/README.md`.
2. EVERY Executable_Skill implementation path SHALL stay inside its own skill directory.
3. EVERY Executable_Skill input and output boundary SHALL use JSON-safe values and schema validation.
4. THE skill registry SHALL not need hardcoded skill names for adapted skills.
5. THE adaptation SHALL prefer deterministic behavior when possible and mark external-state skills as non-deterministic.
6. THE adapted tests SHALL be runnable with `bun test skills/<name>`.

### Requirement 3: Core Operational Skills

**User Story:** As an operator, I want core operational skills adapted first, so that agents can delegate work, manage GitHub activity, and coordinate durable tasks.

#### Acceptance Criteria

1. THE first batch SHALL adapt `coding-agent`, `github`, `gh-issues`, and `taskflow`.
2. THE `coding-agent` skill SHALL document delegation to Codex, Claude Code, Gemini, or equivalent agents without assuming OpenClaw commands.
3. THE `github` skill SHALL document `gh` CLI workflows, JSON output, `--jq` filtering, PR review summaries, issue triage, and `GH_CONFIG_DIR`.
4. THE `gh-issues` skill SHALL document the 6-phase auto-fix workflow, fork mode, cron mode, review-comment handling, and safe confirmation points.
5. THE `taskflow` skill SHALL document lifecycle, durable state, child task linking, and revision-checked updates.
6. THE batch SHALL include validation that each skill's documented commands are either available, clearly optional, or documented with install steps.

### Requirement 4: Operational Visibility Skills

**User Story:** As an operator, I want health, logs, usage, and terminal session skills adapted, so that runtime operations can be monitored and debugged.

#### Acceptance Criteria

1. THE operational visibility batch SHALL adapt `healthcheck`, `session-logs`, `model-usage`, and `tmux`.
2. THE `healthcheck` skill SHALL target this repo's `/health` and `/ready` surfaces instead of OpenClaw audit commands.
3. THE `session-logs` skill SHALL document searchable session transcript locations or mark the storage path as a project-specific configuration item.
4. THE `model-usage` skill SHALL align with project cost and model usage tracking instead of assuming OpenClaw log formats.
5. THE `tmux` skill SHALL document session inspection, pane output capture, and command sending with explicit operator confirmation for disruptive actions.
6. THE batch SHALL enforce secret redaction in logs, summaries, and terminal captures.

### Requirement 5: Communication and Collaboration Skills

**User Story:** As a support, sales, or project management agent, I want communication skills adapted, so that external collaboration can happen through documented safe workflows.

#### Acceptance Criteria

1. THE communication batch SHALL adapt `slack`, `discord`, `wacli`, `notion`, and `trello`.
2. THE channel skills SHALL require explicit recipient, workspace, channel, board, or page identifiers before write actions.
3. THE channel skills SHALL document safe read-only discovery commands separately from mutating commands.
4. THE `wacli` skill SHALL require confirmation before sending WhatsApp messages.
5. THE `notion` skill SHALL document API version differences and data source behavior without assuming unsupported defaults.
6. THE `trello` skill SHALL document API key and token setup via environment or local secret storage only.

### Requirement 6: Content, Research, and Productivity Skills

**User Story:** As a product or research agent, I want summarization, PDF, transcription, and utility skills adapted, so that content workflows can be reused safely.

#### Acceptance Criteria

1. THE content batch SHALL adapt `summarize`, `weather`, `nano-pdf`, `openai-whisper`, and `openai-whisper-api`.
2. THE `summarize` skill SHALL document URL, YouTube, article, PDF, and local file summarization with provider/API key configuration.
3. THE `weather` skill SHALL use a no-secret default path such as `wttr.in` and document output formatting.
4. THE PDF and transcription skills SHALL document temp file handling, data retention expectations, and external binary/API requirements.
5. THE transcription skills SHALL distinguish local CLI transcription from API-based transcription.
6. THE batch SHALL avoid committing media fixtures that contain private user content.

### Requirement 7: Automation, Social, and Platform Skills

**User Story:** As a marketing or automation agent, I want social and platform automation skills adapted, so that posting, searching, and platform-specific workflows are documented with guardrails.

#### Acceptance Criteria

1. THE automation batch SHALL adapt `xurl`, `skill-creator`, `sag`, `obsidian`, `oracle`, and selected low-priority utility skills when needed.
2. THE `xurl` skill SHALL document post, reply, search, DM, media upload, multi-account setup, and secret safety rules.
3. THE `skill-creator` skill SHALL align new skill authoring with this repo's `skills/README.md`.
4. THE `sag` skill SHALL adapt sub-agent generation patterns to this project's agent spawning and delegation model.
5. THE `oracle` skill SHALL treat database credentials as secret inputs and default to read-only examples.
6. THE low-priority skills SHALL be explicitly marked deferred, adapted, or ignored with rationale.

### Requirement 8: macOS-Specific and Unsupported Skills

**User Story:** As a maintainer, I want platform-specific OpenClaw skills classified carefully, so that unsupported macOS workflows do not pollute the Linux runtime.

#### Acceptance Criteria

1. THE adaptation SHALL classify macOS-specific skills as deferred unless a concrete Linux-compatible use case exists.
2. THE deferred list SHALL include Apple Notes, Apple Reminders, Bear Notes, Things, iMessage, camera/screen capture, Hue, Sonos, Spotify playback, Bluetooth, and local ONNX TTS skills from `TODO-3.md`.
3. THE deferred skills SHALL not introduce runtime dependencies or install steps into normal setup.
4. IF a deferred skill is later adapted, THEN its `SKILL.md` SHALL clearly state platform requirements and fallback behavior.
5. THE adaptation SHALL not claim support for unavailable hardware, OS services, or third-party accounts.

### Requirement 9: Security and Secrets

**User Story:** As a security-conscious operator, I want all adapted skills to respect secret and credential boundaries, so that external integrations do not leak sensitive values.

#### Acceptance Criteria

1. THE Adapted_Skill documentation SHALL never include real tokens, API keys, account IDs, or private URLs.
2. THE Adapted_Skill SHALL instruct users to load credentials from environment variables, `.env.local`, auth profiles, or external secret stores.
3. THE Adapted_Skill SHALL mask or omit secret-bearing command output in examples.
4. THE Adapted_Skill SHALL require confirmation before destructive or externally visible actions when practical.
5. THE Adapted_Skill SHALL document rate-limit, permission, and audit considerations for third-party APIs.

### Requirement 10: Validation and Documentation Index

**User Story:** As a maintainer, I want adapted skills validated and indexed, so that operators can discover what exists and trust the docs.

#### Acceptance Criteria

1. THE adaptation SHALL update `skills/README.md` or a generated skills index with adapted skill categories and status.
2. EVERY adapted executable skill SHALL pass `bun skills/workshop.mjs validate skills/<name>` where applicable.
3. EVERY adapted executable skill SHALL pass its colocated tests.
4. THE full repo SHALL pass `npm run check` before handoff when code or runtime contracts are changed.
5. THE adaptation SHALL record validation evidence per batch in task completion notes or PR description.
