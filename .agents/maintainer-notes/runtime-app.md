# Maintainer Note: src/runtime-app/

**Area:** `src/runtime-app/` — operator shell, HTTP server, worker, scheduler, channels, storage.

## Overview

`src/runtime-app/` adalah lapisan operator shell. Ini bukan multi-tenant boundary.
In-memory state untuk local run. Authenticated callers diperlakukan sebagai trusted operators.

## File Kunci

- `server.ts` — HTTP server dan routing utama
- `state.ts` — in-memory runtime state (besar, ~700+ LOC — split jika clarity membaik)
- `telegramBot.ts` — Telegram channel implementation
- `capabilities.ts` — capability registration
- `providers/` — LLM provider adapters
- `smoke.ts` — end-to-end smoke test terhadap provider nyata

## Struktur Extension (Medium Adaptation)

Folder-folder baru yang diperkenalkan medium-priority-adaptation:

```
src/runtime-app/
  channels/whatsapp/    — WhatsApp channel (analog Telegram)
  channels/qa-channel/  — virtual channel untuk QA automation
  memory/               — memory backends (lancedb, wiki, active-memory)
  speech/               — speech core (deepgram STT, tts-local-cli)
  generation/           — image/video generation core
  tools/                — search tools dan tool plugins
  diagnostics/          — otel dan prometheus backends
  extensions/           — infra extensions (bonjour, tokenjuice, dll)
```

## Gotchas dan Pitfalls

- `state.ts` sudah besar — jangan tambah fitur besar langsung ke sana tanpa split.
- Hot paths harus bawa prepared facts ke depan (provider id, model ref, agent id) — jangan rediscover ulang.
- Provider code tidak boleh import langsung dari agent internals.
- Semua secrets harus dari env, tidak pernah hardcoded.

## Extension Enable/Disable Pattern

Semua extension medium priority harus bisa diaktifkan/dimatikan via config tanpa ubah core code path.
Pattern: cek env var di startup, log warning jika optional extension tidak aktif.

## Changelog

- 2026-05-16: Initial maintainer note dibuat, struktur extension medium adaptation didokumentasikan.
