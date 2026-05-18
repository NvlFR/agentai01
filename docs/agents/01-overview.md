# Project Overview

`agentai01` adalah AI Company Runtime Platform yang menjalankan hierarki agent 4 tingkat untuk operasi lintas departemen.

## Tujuan

- Menyediakan runtime operasional untuk koordinasi agent CEO, head department, dan specialist.
- Menyediakan permukaan operator yang nyata: HTTP API, terminal UI, worker, scheduler, dan bot channel.
- Menjaga boundary runtime tetap ketat lewat registry, schema validation, dan kontrak tool/MCP.

## Surface Utama

- `src/runtime-app/` — aplikasi operasional utama
- `src/runtime/` — orchestration, baton passing, scratchpad
- `src/domain/` — type dan kontrak inti
- `src/registry/` — registry agent dan sub-agent
- `src/agents/` — agent utama per departemen
- `src/agents/subagents/` — specialist dan head hierarchy
- `src/mcp/` — konfigurasi MCP, bootstrap vendor, dan project config

## Cara Menjalankan Cepat

1. Install dependency dengan `npm install`.
2. Siapkan environment dasar, minimal `AI_API_KEY`, `AI_BASE_URL`, dan `AI_MODEL`.
3. Jalankan server dengan `npm run runtime:app`.
4. Jalankan terminal UI dengan `npm run runtime:tui`.
5. Verifikasi health lewat `GET /health` dan readiness lewat `GET /ready`.

## Surface Operator

- HTTP API untuk dashboard, directives, approvals, jobs, messages, channel webhook, dan agent wizard
- Terminal UI untuk operator console, live pane, readiness, dan agent management
- Telegram runner untuk integrasi bot berbasis env

## Bacaan Lanjutan

- Setup: [02-installation-and-setup.md](./02-installation-and-setup.md)
- HTTP API: [03-runtime-app-http.md](./03-runtime-app-http.md)
- TUI: [04-terminal-ui.md](./04-terminal-ui.md)
- Arsitektur: [08-architecture-and-registries.md](./08-architecture-and-registries.md)
