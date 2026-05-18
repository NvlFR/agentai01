# CODEX.md

Panduan coding untuk agent yang mengubah repo ini.

## Prinsip Utama

- TypeScript ESM strict
- import relatif wajib pakai suffix `.js`
- hindari `any`
- boundary eksternal harus tervalidasi
- test behavior lebih penting daripada test implementasi
- jangan commit secret

## Repo Expectations

- `src/domain/` tetap jadi source of truth kontrak
- `src/runtime-app/` adalah shell operator aktif
- `src/agents/subagents/` harus mengikuti hierarchy + allowed MCP tools
- `src/mcp/` harus menjaga config merge yang non-destructive
- TUI/operator UX boleh berkembang, tapi jangan merusak contract runtime

## Editing Rules

- jangan pakai `@ts-nocheck`
- jangan ubah `node_modules`
- jangan hapus perubahan user yang tidak relevan
- default ke perubahan kecil, teruji, dan bisa dijelaskan
- kalau adaptasi dari referensi eksternal, lakukan sebagai translasi arsitektur, bukan copy mentah

## Validation

Minimum sebelum handoff:

```bash
npm run check
bun test
```

Kalau surface runtime disentuh, tambahkan:

```bash
npm run runtime:smoke
```

## Documentation Rule

Kalau perilaku berubah:
- update file root yang relevan
- update `docs/`
- utamakan pecah docs per topik, jangan timbun satu file besar
