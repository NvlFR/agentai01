# Adaptation Module Map

Pemetaan kasar referensi `openclaw/src` ke repo aktif:

## Core

- `logging`, `shared`, `utils`, `security`, `secrets`
  - target: `src/logging/`, `src/shared/`, `src/utils/`, `src/security/`, `src/secrets/`

## Runtime

- `process`, `status`, `config`, `bootstrap`
  - target: `src/process/`, `src/status/`, `src/config/`, `src/bootstrap/`

## Agent and orchestration

- `agents`, `tasks`, `flows`, `routing`, `memory`, `context-engine`
  - target: modul sejenis di `src/`

## Operator surfaces

- `web`, `cli`, `terminal`, `tui`, `interactive`
  - target: `src/runtime-app/`, `src/cli/`, `src/interactive/`, TUI aktif repo ini

## MCP and integrations

- `mcp`, `channels`, `plugins`, `gateway`
  - target: `src/mcp/`, `src/channels/`, `src/runtime-app/`, `src/tools/`
