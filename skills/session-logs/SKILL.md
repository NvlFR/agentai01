# Session Logs

Status: guidance-only.
Source: `referensi/openclaw/skills/session-logs`

## Use When

- The operator asks what happened in an older session, runtime event stream, approval flow, or message route.
- You need message counts, tool/action summaries, audit evidence, or a redacted timeline.
- A bug needs correlation ids, worker/job events, or transcript-like operational context.

## Requirements

- `jq` for JSON and JSONL filtering. Linux install: `sudo apt-get install jq`.
- `rg` for fast text search. Linux install: `sudo apt-get install ripgrep`.
- Project storage roots:
  - `RUNTIME_OPERATIONAL_ROOT`, default `runtime/<APP_ENV>/operational`.
  - Operational logs live under `runtime/<APP_ENV>/operational/logs/*.jsonl`.
  - Runtime state lives under `runtime/<APP_ENV>/operational/state/*.json`.
- `src/sessions/` currently defines in-memory session records; durable transcript file location is project-specific until a persistence adapter writes session transcripts.

## Workflow

1. Identify the target: session id, correlation id, project id, agent id, channel, date range, or incident description.
2. Resolve the operational root without exposing env secrets:

```bash
APP_ENV="${APP_ENV:-development}"
OP_ROOT="${RUNTIME_OPERATIONAL_ROOT:-runtime/$APP_ENV/operational}"
find "$OP_ROOT/logs" -maxdepth 1 -type f -name '*.jsonl' -print 2>/dev/null | sort
```

3. Start read-only and narrow the search:

```bash
rg -n "correlation-id-or-keyword" "$OP_ROOT/logs" "$OP_ROOT/state" 2>/dev/null
jq -r 'select(.payload.correlationId == "corr-123")' "$OP_ROOT/logs"/*.jsonl
```

4. Summarize by log kind:

```bash
jq -r '.kind' "$OP_ROOT/logs"/*.jsonl | sort | uniq -c | sort -rn
```

5. Inspect message or job timelines:

```bash
jq -r '[.timestamp, .kind, (.payload.status // .payload.type // .payload.event // "n/a"), (.payload.correlationId // "no-correlation")] | @tsv' "$OP_ROOT/logs"/*.jsonl
```

6. For durable session records, inspect configured storage first. If no transcript files exist, state clearly that the current session registry is in-memory and only persisted operational logs are available.
7. Produce a concise, redacted timeline with source file names and line numbers when possible.

## Safety

- Never paste raw logs wholesale into prompts or external tools; extract the minimal fields needed.
- Redact secrets and high-risk identifiers before reporting: `apiKey`, `token`, `secret`, `password`, `authorization`, `cookie`, `session`, bearer tokens, `sk-*`, GitHub tokens, Slack tokens, Google API keys, Telegram tokens, chat ids, phone numbers, and private URLs.
- Prefer summaries over full transcripts. For private message content, quote only the minimum needed to identify behavior.
- Do not delete, rotate, truncate, or rewrite logs without explicit approval.
- If a command fails because logs are absent, report absence as evidence; do not create placeholder logs.

## Validation

```bash
command -v jq
command -v rg
APP_ENV="${APP_ENV:-development}"
OP_ROOT="${RUNTIME_OPERATIONAL_ROOT:-runtime/$APP_ENV/operational}"
test -d "$OP_ROOT" || true
rg -n 'open[c]law|~/\.[o]penclaw|open[c]law message send' skills/session-logs || true
```

Use `bun test src/runtime-app/storage/fileRuntimeStorage.test.ts` when changing operational storage behavior. This guidance file itself is validated by review and stale-reference search.
