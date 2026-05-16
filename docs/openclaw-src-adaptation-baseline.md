# OpenClaw Src Adaptation Baseline

Baseline ini mengikat adaptasi `referensi/openclaw/src/` ke arsitektur `agentai01`.
Referensi dipakai sebagai sumber pola, bukan sumber copy-paste.

## Module Map

| Reference module group | Target repo path |
| --- | --- |
| `logging`, `shared`, `utils`, `infra`, `secrets`, `security`, `types` | `src/logging/`, `src/shared/`, `src/utils/`, `src/infra/`, `src/secrets/`, `src/security/`, `src/types/` |
| `provider-runtime`, `process`, `status`, `config`, `bootstrap`, `bindings`, `compat` | `src/provider-runtime/`, `src/process/`, `src/status/`, `src/config/`, `src/bootstrap/`, `src/bindings/`, `src/compat/` |
| `sessions`, `memory`, `memory-host-sdk`, `context-engine` | `src/sessions/`, `src/memory/`, `src/memory-host-sdk/`, `src/context-engine/` |
| `tools`, `tasks`, `flows`, `hooks`, `routing`, `plugins`, `plugin-sdk`, `plugin-state` | Same names under `src/` |
| `channels`, `auto-reply`, `commitments`, `gateway`, `acp`, `mcp` | Same names under `src/` |
| `agents`, `cron`, `daemon` | Existing `src/agents/` plus `src/cron/`, `src/daemon/` |
| `web-fetch`, `web-search`, `link-understanding`, `media*`, `tts`, `talk`, `realtime-transcription` | Same names under `src/` |
| `web`, `cli`, `terminal`, `tui`, `markdown`, `interactive` | Same names under `src/` |
| `trajectory`, `proxy-capture`, `pairing`, `node-host`, `crestodian`, `docs`, `scripts`, `i18n`, `model-catalog`, `chat`, `commands`, `wizard` | Same names under `src/` |

## Adaptation Rules

- Rename OpenClaw-specific public names to project-neutral names before exposure.
- Drop unsupported platform branches: native app glue, mobile assumptions, and OpenClaw-specific product flows.
- Keep reusable contracts, state machines, lifecycle patterns, validation, redaction, and observability primitives.
- Keep core domain agent-agnostic; agent IDs, runtime policy, and provider defaults belong in registry/runtime-app configuration.
- Route filesystem, network, secrets, and audit behavior through `src/infra/`, `src/security/`, `src/secrets/`, and `src/logging/`.

## Coexistence Strategy

Existing modules are strengthened in place when public contracts already exist:

- `src/logging/`: add subsystem bindings, formatting, file/console writers, and redaction.
- `src/shared/`: extend generic helpers without importing runtime-app details.
- `src/secrets/` and `src/security/`: keep secret handling centralized and audit-safe.
- `src/types/`: expose utility types and runtime-safe helpers without moving domain contracts out of `src/domain/`.
- `src/runtime-app/`: stays the operator shell; helpers move out only when contracts are stable and tested.

## Test Convention

Every adapted module must include at least one colocated behavior test named `*.test.ts`.
Tests should validate public contracts and safety boundaries, not reference implementation shape.
