# CLAUDE.md

Telegraph style. AI Company Runtime Platform — runtime platform untuk agen otonom.

## Commands

- Install: `npm install`
- Dev Server: `npm run dev`
- Typecheck: `npm run check`
- Unit Tests: `bun test`
- Smoke Test: `npm run runtime:smoke`
- Worker: `npm run runtime:worker`
- Scheduler: `npm run runtime:scheduler`
- Telegram: `npm run runtime:telegram`

## Code Style

- **TypeScript ESM**: Strict mode, no `any`, no `@ts-nocheck`.
- **Runtime Branching**: Prefer discriminated unions over freeform strings.
- **Project Isolation**: Agents only cross via domain types & registry contracts.
- **Provider**: OpenAI-compatible default. Adapter patterns for Anthropic/Google.
- **Secrets**: Mask `AI_API_KEY`, use `.env.local` for credentials.
- **File Size**: Split around ~700 LOC.
- **Comments**: Concise, logic-only.

## Testing

- **Engine**: Bun test.
- **Location**: Colocated `*.test.ts`.
- **Strategy**: Behavior-driven, clean state (env/timers/mocks) per test.
- **Mocks**: Narrow mocks, prefer injection.

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


## Project Map

- `src/domain/`: Core types, contracts, lifecycle.
- `src/agents/`: Specialized agent implementations.
- `src/runtime/`: Orchestrator core.
- `src/runtime-app/`: Operator shell, HTTP server, storage, providers.
- `src/registry/`: `AgentRegistry` (central state).
- `src/app/`: Application-level read models/snapshots.
- `.kiro/specs/`: Requirements, designs, and task lists.

Refer to `AGENTS.md` for full policy and `VISION.md` for product roadmap.
