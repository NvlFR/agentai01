# AGENTS.md

Telegraph style. Root rules only. Baca scoped `AGENTS.md` sebelum kerja di subtree.

## Start

- Repo: `agentai01` — AI Company Runtime Platform
- Replies: gunakan path relatif dari root repo: `src/runtime-app/telegramBot.ts:80`. Jangan pakai absolute path atau `~/`.
- Fix/triage butuh: source, tests, behavior saat ini, dan bukti dependency contract.
- Behavior yang didukung dependency: baca upstream docs/source/types dulu. Jangan tebak API/default/error/timing.
- Live-verify kalau memungkinkan. Jangan pernah print secrets.
- Missing deps: `npm install`, retry sekali, lalu report error pertama yang actionable.
- Jangan edit `node_modules`.

## Map

- Core domain: `src/domain/` — types dan kontrak utama
- Agents: `src/agents/` — CEO, engineering, marketing, product, project-manager, sales, support
- Runtime: `src/runtime/` — orchestrator dan runtime index
- Runtime App: `src/runtime-app/` — HTTP server, worker, scheduler, Telegram bot, UI, providers
- Registry: `src/registry/` — AgentRegistry
- App: `src/app/` — app-level exports
- Docs: `docs/` — dokumentasi project
- Referensi: `referensi/openclaw/` — referensi adaptasi dari OpenClaw (jangan edit)

## Architecture

- Core tetap agent-agnostic. Jangan hardcode agent ID/defaults/policy di core kalau bisa lewat registry/capability contract.
- Agent hanya boleh cross ke core via domain types dan registry contracts.
- Provider code: tidak boleh import langsung dari agent internals.
- Runtime app adalah operator shell — in-memory state untuk local run, bukan multi-tenant boundary.
- Hot paths harus bawa prepared facts ke depan: provider id, model ref, agent id, capability. Jangan rediscover ulang.
- Inline comments: singkat, hanya untuk logic yang tricky atau bug-prone.
- Split file di sekitar ~700 LOC kalau clarity/testability membaik.
- Naming: TypeScript strict, ESM, no `any`, prefer real types atau `unknown`.
- Bahasa kode: English. Bahasa docs/comments: bebas (Indonesia atau English).

## Commands

- Runtime: Bun 1.3.x + Node 20+ untuk toolchain compatibility.
- Install: `npm install`.
- Dev server: `npm run dev` (watch mode).
- Runtime app: `npm run runtime:app`.
- Worker: `npm run runtime:worker`.
- Scheduler: `npm run runtime:scheduler`.
- Smoke test: `npm run runtime:smoke`.
- Telegram bot: `npm run runtime:telegram`.
- Tests: `bun test`.
- Typecheck: `npm run check`.

## Validation

- Jalankan `npm run check` sebelum push untuk typecheck.
- Jalankan `bun test` untuk unit tests.
- Jalankan `npm run runtime:smoke` untuk end-to-end smoke test dengan provider nyata.
- Sebelum handoff/push: buktikan surface yang disentuh sudah ditest.
- Jangan landing kode dengan failing typecheck, test, atau smoke.

## Code

- TypeScript ESM strict. Hindari `any`; prefer real types, `unknown`, narrow adapters.
- Tidak ada `@ts-nocheck`. Lint suppressions hanya kalau intentional dan ada penjelasan.
- External boundaries: gunakan zod atau schema helpers yang sudah ada.
- Runtime branching: discriminated unions/closed codes, bukan freeform strings.
- Hindari semantic sentinels (`?? 0`, empty object/string).
- Classes: tidak ada prototype mixins/mutations. Prefer inheritance/composition.
- Comments: singkat, hanya untuk logic non-obvious.

## Tests

- Bun test. Colocated `*.test.ts`.
- Prefer behavior tests.
- Clean timers/env/globals/mocks/temp dirs setelah test.
- Prefer injection dan narrow mocks daripada broad barrel mocks.
- Jangan edit baseline/snapshot/expected-failure files tanpa approval eksplisit.

## Git

- Commits: conventional-ish, concise, grouped.
- Stage hanya file yang intended.
- Jangan hapus/rename file yang tidak diharapkan; tanya kalau blocking.
- Push ke branch baru, bukan langsung ke `main`, kecuali diminta eksplisit.

## Security

- Jangan pernah commit credentials, tokens, API keys, atau secrets ke repo.
- Secrets: simpan di `.env.local` (tidak di-commit) atau environment variable.
- `.env` boleh berisi defaults non-secret saja.
- `OPERATOR_TOKEN` dan `AI_API_KEY` harus selalu dari env, tidak pernah hardcoded.
- UI harus mask `AI_API_KEY`; jangan tampilkan raw secret ke operator.
- Lihat `SECURITY.md` untuk full security policy.

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
## Provider

- Provider untuk saat ini development pake OpenAI-compatible (base URL + API key + model).
- Default: `AI_BASE_URL=http://127.0.0.1:8045/v1`, `AI_MODEL=gemini-3-flash`.
- `AI_API_KEY` wajib ada agar `/ready` menjadi ready.
- Timeout default: 30 detik (`AI_TIMEOUT_MS`).
