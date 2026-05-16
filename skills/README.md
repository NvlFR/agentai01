# Skills Ecosystem

Folder `skills/` menyimpan reusable skill definitions yang bisa ditemukan oleh `src/runtime-app/skills/SkillRegistry.ts`.

Ada dua bentuk skill:

- **Guidance-only**: punya `SKILL.md` sebagai playbook operator/agent. Tidak diload runtime registry.
- **Executable**: punya `SKILL.md`, `skill.json`, `index.mjs`, dan test colocated. Ditemukan oleh `SkillRegistry`.

## Struktur

Setiap executable skill hidup di folder sendiri:

```text
skills/
  <skill-folder>/
    SKILL.md
    skill.json
    index.mjs
    index.test.ts
```

Guidance-only skill cukup punya:

```text
skills/
  <skill-folder>/
    SKILL.md
```

## `SKILL.md`

Setiap adapted skill memakai struktur berikut:

```md
# <Skill Name>

Status: guidance-only | executable | deferred | ignored
Source: referensi/openclaw/skills/<name> | project-native <workflow>

## Use When

## Requirements

## Workflow

## Safety

## Validation
```

Dokumentasi wajib menyebut tool eksternal, install hint, credential source, aksi read-only, aksi mutating, confirmation point, dan cara validasi. Jangan tulis raw token, API key, private URL, atau output yang memuat secret.

`skill.json` wajib punya field berikut:

```json
{
  "name": "echo-text",
  "version": "1.0.0",
  "description": "Echo text with deterministic formatting.",
  "deterministic": true,
  "implementation": "./index.mjs",
  "inputSchema": {
    "type": "object"
  },
  "outputSchema": {
    "type": "object"
  }
}
```

## Konvensi

- `name`: logical skill name. Boleh sama lintas folder kalau `version` berbeda.
- `version`: semver `x.y.z`. Registry resolve versi terbaru kalau caller tidak minta versi spesifik.
- `deterministic`: `true` kalau input sama wajib hasil sama. Isi `false` untuk skill yang bergantung LLM/randomness/external state.
- `implementation`: path relatif ke file implementasi. Harus tetap di dalam folder skill.
- `inputSchema` dan `outputSchema`: gunakan subset JSON Schema yang didukung registry:
  - `type`
  - `properties`
  - `required`
  - `items`
  - `enum`
  - `const`
  - `additionalProperties`
  - `minLength`, `maxLength`, `pattern`
  - `minimum`, `maximum`
  - `minItems`, `maxItems`

## Authoring Flow

1. Scaffold skill baru:

```bash
bun skills/workshop.mjs init my-skill --description "Describe the skill"
```

2. Validasi manifest dan schema:

```bash
bun skills/workshop.mjs validate skills/my-skill
```

3. Jalankan sample input tanpa runtime penuh:

```bash
bun skills/workshop.mjs run my-skill --input '{"text":"hello"}'
```

4. Jalankan test skill:

```bash
bun test skills/my-skill
```

## Workshop

`skills/workshop.mjs` adalah authoring helper ringan yang:

- membuat template skill baru
- memvalidasi `skill.json` dengan validator yang sama seperti registry
- menjalankan skill dengan sample input
- punya mode `--watch` untuk re-validasi cepat saat file berubah

Script ini bisa dijalankan via:

```bash
node skills/workshop.mjs validate skills/echo-text
bun skills/workshop.mjs run echo-text --input '{"text":"hi"}'
```

## Project-Native Skill Index

Skill berikut tidak berasal dari referensi eksternal. Mereka dibuat untuk workflow AI Company Runtime Platform.

| Skill | Source | Target | Status | Requires | Secrets | Validation |
| --- | --- | --- | --- | --- | --- | --- |
| `lead-intake` | project-native lead workflow | `skills/lead-intake` | `guidance-only` | lifecycle context, optional channel skills | contact data redacted | `test -f skills/lead-intake/SKILL.md` |
| `proposal-builder` | project-native sales workflow | `skills/proposal-builder` | `guidance-only` | qualified lead context | client docs only in project namespace | `test -f skills/proposal-builder/SKILL.md` |
| `client-onboarding` | project-native delivery workflow | `skills/client-onboarding` | `guidance-only` | won deal, project namespace | credentials via env/secret store only | `test -f skills/client-onboarding/SKILL.md` |
| `project-kickoff` | project-native PM workflow | `skills/project-kickoff` | `guidance-only` | proposal, lifecycle state, active agents | client artifacts scoped to project | `test -f skills/project-kickoff/SKILL.md` |
| `agent-handoff` | project-native message bus workflow | `skills/agent-handoff` | `guidance-only` | domain message contract | no raw secrets in payload | `test -f skills/agent-handoff/SKILL.md` |
| `approval-gates` | project-native approval workflow | `skills/approval-gates` | `guidance-only` | approval queue, evidence artifacts | redacted evidence only | `test -f skills/approval-gates/SKILL.md` |
| `delivery-packaging` | project-native engineering workflow | `skills/delivery-packaging` | `guidance-only` | QA evidence, delivery artifacts | no `.env.local` or credentials | `test -f skills/delivery-packaging/SKILL.md` |
| `support-runbook` | project-native support workflow | `skills/support-runbook` | `guidance-only` | delivery package, health/log skills | client-safe support notes | `test -f skills/support-runbook/SKILL.md` |
| `memory-curation` | project-native memory workflow | `skills/memory-curation` | `guidance-only` | memory backend or project files | no raw credentials | `test -f skills/memory-curation/SKILL.md` |
| `runbook-directive` | project-native operator workflow | `skills/runbook-directive` | `guidance-only` | runtime app directive surface | `OPERATOR_TOKEN` from env only | `test -f skills/runbook-directive/SKILL.md` |
| `incident-response` | project-native ops workflow | `skills/incident-response` | `guidance-only` | health, logs, queue, provider status | redacted diagnostics | `test -f skills/incident-response/SKILL.md` |
| `evaluation-loop` | project-native quality workflow | `skills/evaluation-loop` | `guidance-only` | acceptance criteria, tests/smoke | no private fixtures | `test -f skills/evaluation-loop/SKILL.md` |

## Agent Operating Guides

Skill berikut adalah panduan operasional untuk agent runtime utama. Mereka tidak mengganti implementasi di `src/agents/`; mereka menjelaskan kapan dan bagaimana operator atau agent lain harus memakai peran tersebut.

| Skill | Source | Target | Status | Requires | Secrets | Validation |
| --- | --- | --- | --- | --- | --- | --- |
| `ceo-agent` | `src/agents/ceo/models.ts` | `skills/ceo-agent` | `guidance-only` | registry snapshot, Owner directive | operator/runtime secrets masked | `test -f skills/ceo-agent/SKILL.md` |
| `sales-agent` | `src/agents/sales/models.ts` | `skills/sales-agent` | `guidance-only` | lead context, proposal refs | contact data redacted | `test -f skills/sales-agent/SKILL.md` |
| `marketing-agent` | `src/agents/marketing/models.ts` | `skills/marketing-agent` | `guidance-only` | campaign plan, segment metadata | lead/contact data redacted | `test -f skills/marketing-agent/SKILL.md` |
| `product-agent` | `src/agents/product/models.ts` | `skills/product-agent` | `guidance-only` | lead handoff, project namespace | no raw secrets in specs | `test -f skills/product-agent/SKILL.md` |
| `engineering-agent` | `src/agents/engineering/models.ts` | `skills/engineering-agent` | `guidance-only` | approved discovery handoff, workspace | no `.env.local` or credentials | `test -f skills/engineering-agent/SKILL.md` |
| `project-manager-agent` | `src/agents/project-manager/models.ts` | `skills/project-manager-agent` | `guidance-only` | timeline, handoffs, approvals | project-scoped metadata only | `test -f skills/project-manager-agent/SKILL.md` |
| `support-agent` | `src/agents/support/models.ts` | `skills/support-agent` | `guidance-only` | ticket, runbook, known issues | client data redacted | `test -f skills/support-agent/SKILL.md` |

## MCP Skill Index

Skill berikut mengadaptasi pola MCP dari referensi ke workflow AI Company Runtime Platform. Mereka guidance-only sampai runtime MCP contract project ini diputuskan.

| Skill | Source | Target | Status | Requires | Secrets | Validation |
| --- | --- | --- | --- | --- | --- | --- |
| `mcp-registry` | `referensi/openclaw/src/config/types.mcp.ts` | `skills/mcp-registry` | `guidance-only` | MCP server config | headers/env/url secrets redacted | `test -f skills/mcp-registry/SKILL.md` |
| `mcp-gateway` | `referensi/openclaw/docs/cli/mcp.md` | `skills/mcp-gateway` | `guidance-only` | runtime gateway, JSON-RPC tools | operator auth only | `test -f skills/mcp-gateway/SKILL.md` |
| `mcporter` | `referensi/openclaw/skills/mcporter` | `skills/mcporter` | `guidance-only` | `mcporter` binary | auth profiles/env only | `mcporter --help` |
| `mcp-bundled-agents` | `referensi/openclaw/src/agents/pi-bundle-mcp-types.ts` | `skills/mcp-bundled-agents` | `guidance-only` | session id, workspace, MCP config | no cross-session secrets | `test -f skills/mcp-bundled-agents/SKILL.md` |
| `mcp-browser` | `referensi/openclaw/extensions/browser/src/browser/chrome-mcp.ts` | `skills/mcp-browser` | `guidance-only` | Chrome/Chromium, Chrome DevTools MCP | no cookies/tokens in output | `test -f skills/mcp-browser/SKILL.md` |
| `mcp-security` | `referensi/openclaw/src/config/redact-snapshot.test.ts` | `skills/mcp-security` | `guidance-only` | MCP config/tool catalog | raw secrets forbidden | `test -f skills/mcp-security/SKILL.md` |

## Adaptation Status Index

Status:

- `adapted-guidance`: playbook sudah diadaptasi sebagai `SKILL.md`.
- `adapted-executable`: sudah punya manifest, implementation, dan test runtime.
- `deferred`: sengaja tidak masuk normal setup karena platform/hardware/account spesifik.
- `ignored`: tidak diadaptasi karena OpenClaw-specific atau tidak cocok dengan runtime ini.

| Skill | Source | Target | Status | Requires | Secrets | Validation |
| --- | --- | --- | --- | --- | --- | --- |
| `coding-agent` | `referensi/openclaw/skills/coding-agent` | `skills/coding-agent` | `adapted-guidance` | `git`, optional coding CLIs | provider/API tokens via env | `test -f skills/coding-agent/SKILL.md` |
| `github` | `referensi/openclaw/skills/github` | `skills/github` | `adapted-guidance` | `gh`, `jq` optional | GitHub auth profile or `GH_TOKEN` | `gh --version` |
| `gh-issues` | `referensi/openclaw/skills/gh-issues` | `skills/gh-issues` | `adapted-guidance` | `gh`, `git` | GitHub auth profile or `GH_TOKEN` | `gh auth status` |
| `taskflow` | `referensi/openclaw/skills/taskflow` | `skills/taskflow` | `adapted-guidance` | project task runtime | runtime env | `test -f skills/taskflow/SKILL.md` |
| `taskflow-inbox-triage` | `referensi/openclaw/skills/taskflow-inbox-triage` | `skills/taskflow-inbox-triage` | `adapted-guidance` | taskflow, channel adapters | channel tokens via env | `test -f skills/taskflow-inbox-triage/SKILL.md` |
| `healthcheck` | `referensi/openclaw/skills/healthcheck` | `skills/healthcheck` | `adapted-guidance` | `curl`, runtime app | `OPERATOR_TOKEN` when auth is enabled | `curl http://127.0.0.1:3000/health` |
| `session-logs` | `referensi/openclaw/skills/session-logs` | `skills/session-logs` | `adapted-guidance` | `rg`, `jq` | redacted log data only | `rg --version` |
| `model-usage` | `referensi/openclaw/skills/model-usage` | `skills/model-usage` | `adapted-guidance` | `jq`, provider logs | provider keys masked | `jq --version` |
| `tmux` | `referensi/openclaw/skills/tmux` | `skills/tmux` | `adapted-guidance` | `tmux` | none in captures | `tmux -V` |
| `slack` | `referensi/openclaw/skills/slack` | `skills/slack` | `adapted-guidance` | Slack CLI/API client | `SLACK_BOT_TOKEN` or auth profile | `test -f skills/slack/SKILL.md` |
| `discord` | `referensi/openclaw/skills/discord` | `skills/discord` | `adapted-guidance` | Discord bot/API client | `DISCORD_BOT_TOKEN` | `test -f skills/discord/SKILL.md` |
| `wacli` | `referensi/openclaw/skills/wacli` | `skills/wacli` | `adapted-guidance` | `wacli` | WhatsApp auth profile | `wacli --help` |
| `notion` | `referensi/openclaw/skills/notion` | `skills/notion` | `adapted-guidance` | Notion API client or `curl` | `NOTION_TOKEN` | `test -f skills/notion/SKILL.md` |
| `trello` | `referensi/openclaw/skills/trello` | `skills/trello` | `adapted-guidance` | `curl`, `jq` | Trello key/token via env | `test -f skills/trello/SKILL.md` |
| `summarize` | `referensi/openclaw/skills/summarize` | `skills/summarize` | `adapted-guidance` | `summarize` CLI | provider key via env | `summarize --help` |
| `weather` | `referensi/openclaw/skills/weather` | `skills/weather` | `adapted-executable` | `fetch`, `wttr.in` | none | `bun skills/workshop.mjs validate skills/weather` |
| `nano-pdf` | `referensi/openclaw/skills/nano-pdf` | `skills/nano-pdf` | `adapted-guidance` | PDF extraction CLI | private document paths | `test -f skills/nano-pdf/SKILL.md` |
| `openai-whisper` | `referensi/openclaw/skills/openai-whisper` | `skills/openai-whisper` | `adapted-guidance` | local Whisper CLI | local media only | `test -f skills/openai-whisper/SKILL.md` |
| `openai-whisper-api` | `referensi/openclaw/skills/openai-whisper-api` | `skills/openai-whisper-api` | `adapted-guidance` | OpenAI-compatible API | `AI_API_KEY` or provider key | `test -f skills/openai-whisper-api/SKILL.md` |
| `xurl` | `referensi/openclaw/skills/xurl` | `skills/xurl` | `adapted-guidance` | `xurl` | X app/account secrets | `xurl --help` |
| `skill-creator` | `referensi/openclaw/skills/skill-creator` | `skills/skill-creator` | `adapted-guidance` | Bun, `skills/workshop.mjs` | none | `bun skills/workshop.mjs validate skills/echo-text` |
| `sag` | `referensi/openclaw/skills/sag` | `skills/sag` | `adapted-guidance` | agent runtime or coding agent tool | inherited env only | `test -f skills/sag/SKILL.md` |
| `obsidian` | `referensi/openclaw/skills/obsidian` | `skills/obsidian` | `adapted-guidance` | Linux-accessible vault, `rg` | local note content | `test -f skills/obsidian/SKILL.md` |
| `oracle` | `referensi/openclaw/skills/oracle` | `skills/oracle` | `adapted-guidance` | Oracle client or driver | DB credentials via env | `test -f skills/oracle/SKILL.md` |
| `apple-notes` | `referensi/openclaw/skills/apple-notes` | `skills/apple-notes` | `deferred` | macOS Notes | local account | macOS-only |
| `apple-reminders` | `referensi/openclaw/skills/apple-reminders` | `skills/apple-reminders` | `deferred` | macOS Reminders | local account | macOS-only |
| `bear-notes` | `referensi/openclaw/skills/bear-notes` | `skills/bear-notes` | `deferred` | Bear app on macOS | local notes | macOS-only |
| `things-mac` | `referensi/openclaw/skills/things-mac` | `skills/things-mac` | `deferred` | Things 3 on macOS | local tasks | macOS-only |
| `imsg` | `referensi/openclaw/skills/imsg` | `skills/imsg` | `deferred` | iMessage on macOS | message database | macOS-only |
| `camsnap` | `referensi/openclaw/skills/camsnap` | `skills/camsnap` | `deferred` | local camera hardware | captured media | hardware-specific |
| `peekaboo` | `referensi/openclaw/skills/peekaboo` | `skills/peekaboo` | `deferred` | screen capture support | screenshots | platform-specific |
| `blucli` | `referensi/openclaw/skills/blucli` | `skills/blucli` | `deferred` | Bluetooth hardware | device ids | hardware-specific |
| `openhue` | `referensi/openclaw/skills/openhue` | `skills/openhue` | `deferred` | Hue bridge | Hue token | account/hardware-specific |
| `sonoscli` | `referensi/openclaw/skills/sonoscli` | `skills/sonoscli` | `deferred` | Sonos speakers | local network data | hardware-specific |
| `spotify-player` | `referensi/openclaw/skills/spotify-player` | `skills/spotify-player` | `deferred` | Spotify account/player | Spotify tokens | account/player-specific |
| `sherpa-onnx-tts` | `referensi/openclaw/skills/sherpa-onnx-tts` | `skills/sherpa-onnx-tts` | `deferred` | ONNX TTS models | none | model/runtime-specific |
| `1password` | `referensi/openclaw/skills/1password` | `skills/1password` | `deferred` | `op` CLI | 1Password auth | account-specific |
| `blogwatcher` | `referensi/openclaw/skills/blogwatcher` | `skills/blogwatcher` | `deferred` | RSS/feed tooling | optional account tokens | future content monitoring |
| `canvas` | `referensi/openclaw/skills/canvas` | `skills/canvas` | `deferred` | Canvas account/API | Canvas token | account-specific |
| `eightctl` | `referensi/openclaw/skills/eightctl` | `skills/eightctl` | `deferred` | Eight Sleep hardware | account token | hardware-specific |
| `gemini` | `referensi/openclaw/skills/gemini` | `skills/gemini` | `deferred` | Gemini CLI/API | Gemini key | future provider skill |
| `gifgrep` | `referensi/openclaw/skills/gifgrep` | `skills/gifgrep` | `deferred` | GIF search tooling | optional provider token | low-priority utility |
| `gog` | `referensi/openclaw/skills/gog` | `skills/gog` | `deferred` | GOG account/API | account token | low-priority platform |
| `goplaces` | `referensi/openclaw/skills/goplaces` | `skills/goplaces` | `deferred` | Google Places API | API key | account-specific |
| `himalaya` | `referensi/openclaw/skills/himalaya` | `skills/himalaya` | `deferred` | `himalaya` mail CLI | mail credentials | account-specific |
| `mcporter` | `referensi/openclaw/skills/mcporter` | `skills/mcporter` | `adapted-guidance` | MCP tooling, `mcporter` binary | auth profiles/env only | `mcporter --help` |
| `node-connect` | `referensi/openclaw/skills/node-connect` | `skills/node-connect` | `deferred` | OpenClaw node concepts | varies | needs project-native design |
| `ordercli` | `referensi/openclaw/skills/ordercli` | `skills/ordercli` | `deferred` | account-specific CLI | commerce secrets | low-priority platform |
| `songsee` | `referensi/openclaw/skills/songsee` | `skills/songsee` | `deferred` | lyrics/music source | optional tokens | copyright-sensitive utility |
| `video-frames` | `referensi/openclaw/skills/video-frames` | `skills/video-frames` | `deferred` | `ffmpeg` | private media | future media workflow |
| `voice-call` | `referensi/openclaw/skills/voice-call` | `skills/voice-call` | `deferred` | telephony provider | phone/API tokens | account-specific |
| `clawhub` | `referensi/openclaw/skills/clawhub` | `skills/clawhub` | `ignored` | none | none | OpenClaw hub-specific; replaced by this skills index |
