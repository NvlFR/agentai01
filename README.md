# AgentAI01

Platform runtime untuk menjalankan "AI company" dengan struktur:

`Owner -> CEO Agent -> Department Heads -> Specialist Sub-Agents`

Repo ini sekarang mencakup:
- runtime app HTTP
- operator terminal UI
- registry agent dan sub-agent
- provider-backed execution
- MCP bootstrap dan project config
- agent creation wizard

## Quick Start

```bash
npm install
npm run check
bun test
npm run runtime:app
```

Terminal UI:

```bash
npm run runtime:tui
```

Smoke test:

```bash
npm run runtime:smoke
```

## Core Commands

```bash
npm run dev
npm run runtime:app
npm run runtime:worker
npm run runtime:scheduler
npm run runtime:telegram
npm run runtime:tui
npm run runtime:smoke
npm run check
bun test
```

## Main Areas

- `src/domain/` — kontrak domain, lifecycle, hierarchy, MCP tool IDs
- `src/registry/` — registry runtime agents dan sub-agent hierarchy
- `src/runtime/` — orchestration, baton passing, scratchpad
- `src/agents/` — department agents dan sub-agent specialists
- `src/runtime-app/` — HTTP server, TUI, channels, providers, memory, generation
- `src/mcp/` — bootstrap, catalog, project config
- `docs/` — dokumentasi yang sudah dipecah per topik

## Operator Surfaces

- Web/runtime API via `runtime:app`
- Telegram bot via `runtime:telegram`
- Terminal UI via `runtime:tui`

Terminal UI saat ini sudah punya:
- runtime dashboard
- operator console
- live messages/jobs/audit pane
- agent management
- restored-style create agent wizard

## Important Docs

- [VISION.md](./VISION.md)
- [AGENTS.md](./AGENTS.md)
- [CODEX.md](./CODEX.md)
- [CLAUDE.md](./CLAUDE.md)
- [SECURITY.md](./SECURITY.md)
- [docs/README.md](./docs/README.md)

## Current Direction

- stabilisasi runtime dan operator surfaces
- aktivasi MCP servers yang benar-benar dipakai
- pengayaan prompt/spec specialist
- dokumentasi adaptasi `restored-src` dan `openclaw` secara terstruktur
