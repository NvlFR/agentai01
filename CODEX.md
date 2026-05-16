# CODEX.md

Symlink ke `AGENTS.md`. Baca `AGENTS.md` untuk full policy.
Dokumen ini adalah ringkasan cepat untuk Codex worktree.

## Project

AI Company Runtime Platform — runtime untuk menjalankan perusahaan AI dengan agen-agen yang berkoordinasi.
Stack: TypeScript ESM strict, Bun 1.3.x, Node 20+, OpenAI-compatible provider.

## Map

```
src/
  domain/          # types dan kontrak utama
  agents/          # CEO, engineering, marketing, product, project-manager, sales, support
  runtime/         # orchestrator
  runtime-app/     # HTTP server, worker, scheduler, Telegram bot, UI, providers
  registry/        # AgentRegistry
  app/             # app-level exports
```

## Commands

```bash
npm install                  # install deps
npm run dev                  # dev server dengan watch mode
npm run check                # TypeScript typecheck
bun test                     # unit tests
npm run runtime:smoke        # smoke test end-to-end
npm run runtime:telegram     # Telegram bot
npm run runtime:worker       # worker loop
npm run runtime:scheduler    # scheduler loop
```

## Validation Rules

- Jalankan `npm run check` sebelum push — typecheck wajib hijau.
- Jalankan `bun test` untuk unit tests.
- Jangan landing kode dengan failing typecheck atau test.
- Untuk perubahan provider/auth/secrets: jalankan `npm run runtime:smoke` juga.

## Code Rules

- TypeScript ESM strict. Tidak ada `any`. Tidak ada `@ts-nocheck`.
- Discriminated unions untuk runtime branching, bukan freeform strings.
- Tidak ada hardcoded secrets, tokens, atau API keys.
- Split file di ~700 LOC kalau clarity membaik.
- Comments: singkat, hanya untuk logic non-obvious.

## Test Rules

- Bun test. Colocated `*.test.ts`.
- Prefer behavior tests.
- Clean timers/env/mocks/temp dirs setelah test.
- Prefer injection dan narrow mocks.

## Git Rules

- Commits: conventional-ish, concise.
- Stage hanya file yang intended — jangan `git add .` sembarangan.
- Push ke branch baru, bukan langsung ke `main`.
- Jangan commit `.env.local`, secrets, atau credentials.

## Security Rules

- Jangan pernah print atau log raw secrets.
- `OPERATOR_TOKEN`, `AI_API_KEY`, `TOKEN_TELE` harus dari env — tidak pernah hardcoded.
- UI harus mask `AI_API_KEY`.
- Lihat `SECURITY.md` untuk full policy.
## Aturan Global (berlaku untuk SEMUA task)

**Larangan keras di setiap task:**
- Dilarang menghasilkan file yang hanya berisi `export type {}` atau type definitions tanpa runtime code
- Dilarang menggunakan `throw new Error('not implemented')` sebagai implementasi final
- Dilarang menggunakan `() => {}` sebagai body function yang seharusnya punya behavior
- Dilarang meninggalkan `// TODO` di production code path — catat di `TODO.md` root jika benar-benar blocked
- Dilarang menggunakan `any`; gunakan real types, `unknown`, atau narrow adapter
- Dilarang import relatif tanpa suffix `.js` pada TypeScript ESM
- Dilarang copy platform-specific OpenClaw code (iOS, macOS native, browser extension, product-specific glue)
- Dilarang commit jika `npm run check` masih error
- Dilarang commit jika `bun test` masih failing untuk file yang disentuh

**Verifikasi wajib di setiap task:**
1. `npm run check` — zero TypeScript errors
2. `bun test <file>.test.ts` — semua test pass
3. **AI smoke test** — jalankan `npm run runtime:smoke` dan pastikan output tidak ada error baru yang disebabkan oleh perubahan task ini. Smoke test memanggil AI provider nyata via `AI_BASE_URL` + `AI_API_KEY`.

**Test dan boundary rules:**
- External boundary wajib pakai Zod atau schema helper yang sudah ada.
- Module parse/serialize wajib punya round-trip behavior test.
- Time-dependent behavior wajib pakai injected `now`, bukan `Date.now()` langsung di test.
- Timer, env, globals, mocks, dan temp dirs wajib dibersihkan.
- Filesystem test wajib pakai `createTempDirectory()` setelah tersedia.
- Index barrel hanya re-export; implementasi tetap di sub-file.

**Format bukti selesai:**
Setiap task dianggap selesai hanya jika ada bukti nyata:
- Output `npm run check` clean
- Output `bun test` semua pass
- Output `npm run runtime:smoke` tidak ada regression

## Specs

Semua specs ada di `.kiro/specs/`. Setiap spec punya `requirements.md`, `design.md`, dan `tasks.md`.
**Baca `tasks.md` untuk daftar task yang perlu dikerjakan.**
Konvensi task status di `tasks.md`:
- `[x]` — selesai
- `[ ]` — belum dikerjakan
- `[~]` — in progress / sebagian selesai

## Referensi

- Full policy: `AGENTS.md`
- Security: `SECURITY.md`
- Vision: `VISION.md`
- Referensi OpenClaw: `referensi/openclaw/` (jangan edit)
