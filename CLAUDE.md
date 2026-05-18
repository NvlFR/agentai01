# CLAUDE.md

Orientasi cepat untuk agent yang masuk ke repo `agentai01`.

## Baca Dulu

1. `AGENTS.md`
2. `CODEX.md`
3. `SECURITY.md`
4. `VISION.md`
5. `docs/README.md`

## Repo Snapshot

Repo ini adalah AI company runtime platform dengan 4 tier:

`Owner -> CEO -> Department Heads -> Specialists`

Surface aktif yang penting:
- HTTP runtime app
- terminal UI operator
- Telegram runtime
- agent creation flow
- MCP bootstrap + project config

## Fokus Engineering

- jaga domain contracts tetap ketat
- jaga hierarchy registry tetap valid
- jangan longgarkan allowed MCP tools sembarangan
- prefer enhancement bertahap pada runtime aktif daripada menghidupkan stack referensi besar sekaligus

## Saat Menambah Fitur

- cek apakah sudah ada contract/module aktif yang cocok
- kalau adaptasi dari `restored-src` atau `referensi/openclaw`, petakan dulu ke boundary repo ini
- tambahkan test lokal yang membuktikan surface yang disentuh
- update docs yang relevan

## Saat Menutup Pekerjaan

- jelaskan outcome
- sebut verifikasi yang dijalankan
- sebut blocker bila ada
