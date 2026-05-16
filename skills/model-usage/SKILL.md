# Model Usage

Status: guidance-only.
Source: `referensi/openclaw/skills/model-usage`

## Use When

- The operator asks which model/provider is active or how much model traffic is being generated.
- You need usage visibility for provider-backed runtime work, smoke tests, or long-running agent sessions.
- You are estimating cost from token counts and model metadata rather than relying on provider billing exports.

## Requirements

- `jq` for JSON/JSONL analysis. Linux install: `sudo apt-get install jq`.
- `rg` for locating model/provider fields. Linux install: `sudo apt-get install ripgrep`.
- Runtime config fields: `AI_BASE_URL`, `AI_MODEL`, `AI_TIMEOUT_MS`, provider-specific env, and `AI_LOG_LATENCY`.
- Runtime surfaces: `/health`, `/ready`, `/api/snapshot`, operational logs, and source-level model catalog helpers in `src/model-catalog/`.
- No reference-project log format is assumed.

## Workflow

1. Identify the question: current configured model, recent model calls, per-provider latency, cost estimate, or all-model breakdown.
2. Check current runtime configuration without printing secrets:

```bash
APP_BASE_URL="${APP_BASE_URL:-http://${APP_HOST:-127.0.0.1}:${APP_PORT:-3000}}"
curl -fsS "$APP_BASE_URL/api/snapshot" | jq '.data.environment | {env, ai_model}'
```

3. Search operational logs for model/provider metadata:

```bash
APP_ENV="${APP_ENV:-development}"
OP_ROOT="${RUNTIME_OPERATIONAL_ROOT:-runtime/$APP_ENV/operational}"
rg -n '"model"|"model_ref"|"provider"|"latencyMs"|"usage"|"tokens"' "$OP_ROOT/logs" 2>/dev/null
```

4. Summarize JSONL fields when present:

```bash
jq -r '
  select(.payload.model? or .payload.model_ref? or .payload.provider?)
  | [.timestamp, (.payload.provider // "unknown"), (.payload.model // .payload.model_ref // "unknown")] | @tsv
' "$OP_ROOT/logs"/*.jsonl 2>/dev/null | sort | uniq -c | sort -rn
```

5. If token counts are available, estimate cost with `src/model-catalog/` pricing data or an explicitly supplied price table. State assumptions and units.
6. If no usage fields are persisted, report the gap and recommend adding structured provider telemetry before claiming cost totals.

## Safety

- Do not print `AI_API_KEY`, authorization headers, request bodies containing private user content, or raw provider responses unless the operator explicitly asks and secrets are redacted first.
- Treat model usage as approximate unless sourced from provider billing exports or persisted token accounting.
- Distinguish configured model from actually used model; provider adapters may return a model in the response.
- Redact account ids, private base URLs, bearer tokens, `sk-*`, GitHub tokens, Slack tokens, Google API keys, and key/value secret patterns.
- Do not call paid provider APIs just to estimate usage unless the operator confirms.

## Validation

```bash
command -v jq
command -v rg
npm run check
bun test src/model-catalog
rg -n 'open[c]law|codex[b]ar|~/\.[o]penclaw' skills/model-usage || true
```

When validating live usage, prefer existing logs and `/api/snapshot`; avoid creating extra billable traffic unless the operator requests it.
