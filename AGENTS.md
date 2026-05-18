# AGENTS.md

Telegraph style. Root rules only.

## Start

- Repo: `agentai01`
- Produk: AI company runtime platform
- Jawaban pakai path relatif dari root repo
- Mission Control wajib untuk task nyata
- Jangan print secrets

## Read First

- `CODEX.md`
- `CLAUDE.md`
- `SECURITY.md`
- `VISION.md`
- `docs/README.md`

## Repo Map

- `src/domain/` — kontrak utama
- `src/registry/` — runtime registry + hierarchy registry
- `src/runtime/` — orchestration core
- `src/agents/` — CEO, departments, specialists
- `src/runtime-app/` — server, TUI, providers, channels
- `src/mcp/` — bootstrap dan config
- `docs/` — dokumentasi detail per topik

## Working Rules

- pahami behavior saat ini sebelum edit
- jangan tebak contract dependency
- jangan revert perubahan user yang tidak diminta
- kalau ada referensi eksternal, adaptasi ke arsitektur aktif
- jangan landing code dengan typecheck/test merah

## Validation

- `npm run check`
- `bun test`
- `npm run runtime:smoke` bila runtime/provider/operator flow disentuh

## Security

- `AI_API_KEY` dan `OPERATOR_TOKEN` hanya dari env
- UI/log wajib mask secret
- lihat `SECURITY.md`
