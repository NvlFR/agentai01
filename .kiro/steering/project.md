---
inclusion: always
---

# Project Overview

**AI Company Runtime Platform** — runtime untuk menjalankan perusahaan AI dengan agen-agen yang berkoordinasi secara nyata.

Bukan chatbot. Bukan demo. Sebuah runtime di mana agen AI bekerja bersama menjalankan proyek: dari lead masuk, proposal, discovery, implementasi, QA, sampai delivery ke klien.

## Stack

- **Runtime**: Bun 1.3.x + Node 20+
- **Language**: TypeScript ESM strict
- **Provider**: OpenAI-compatible (configurable via env)
- **Test**: Bun test (`bun test`)
- **Typecheck**: `npm run check` (tsc)

## Struktur Folder

```
src/
  domain/          # types dan kontrak utama (Lifecycle_State, Agent_Message, dll)
  agents/          # CEO, engineering, marketing, product, project-manager, sales, support
  runtime/         # orchestrator
  runtime-app/     # HTTP server, worker, scheduler, Telegram bot, UI, providers
    auth/          # operator auth
    config/        # config loader
    http/          # HTTP handlers
    providers/     # OpenAI-compatible provider adapter
    queue/         # job queue dan lifecycle
    workers/       # worker pool
    ui/            # operator web UI
    storage/       # persistence layer
  registry/        # AgentRegistry
  app/             # app-level exports
docs/              # dokumentasi project
referensi/         # referensi OpenClaw (JANGAN EDIT)
```

## Environment Variables Penting

| Variable | Keterangan |
|----------|------------|
| `AI_BASE_URL` | Base URL provider (default: `http://127.0.0.1:8045/v1`) |
| `AI_API_KEY` | API key provider — wajib untuk `/ready` |
| `AI_MODEL` | Model yang dipakai (default: `gemini-3-flash`) |
| `OPERATOR_TOKEN` | Token operator untuk aksi mutasi |
| `TOKEN_TELE` | Telegram bot token |
| `ID_CHAT` | Allowed Telegram chat IDs (comma-separated) |
| `APP_PORT` | Port HTTP server (default: `3000`) |

Secrets disimpan di `.env.local` (tidak di-commit). `.env` hanya untuk defaults non-secret.

## Dokumen Utama

- `AGENTS.md` — full policy dan architecture rules
- `SECURITY.md` — security policy dan secrets handling
- `VISION.md` — visi dan roadmap project
- `TODO.md` — daftar adaptasi dari referensi OpenClaw
- `CODEX.md` — ringkasan untuk Codex worktree
