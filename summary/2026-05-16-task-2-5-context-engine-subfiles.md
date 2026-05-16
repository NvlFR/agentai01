# Summary Task 2.5 — Pecah `src/context-engine/` ke Sub-Files

## Status
- [x] Pecah `src/context-engine/index.ts` menjadi `batch.ts`, `score.ts`, dan `estimate.ts`.
- [x] Pertahankan public API lewat `src/context-engine/index.ts` sebagai barrel re-export only.
- [x] Tambah behavior tests terpisah untuk estimasi token, scoring, dan batch assembly.
- [x] Update checklist task di `.kiro/specs/plugin-sdk-adaptation/tasks.md`.
- [x] `npm run check` clean.
- [x] `bun test src/context-engine/*.test.ts` pass.
- [x] `npm run runtime:smoke` pass.
- [x] Validasi smoke custom untuk public re-export `src/context-engine/index.ts` pass.

## Detail Perubahan
- `src/context-engine/estimate.ts`: Ekstraksi logika `estimateTokens()` dengan minimum 1 token.
- `src/context-engine/score.ts`: Ekstraksi logika scoring berdasarkan priority, recency, dan attribution.
- `src/context-engine/batch.ts`: Menjadi entry utama untuk type context dan `buildContextBatch()`, termasuk filter owner, overflow, dan compression hook.
- `src/context-engine/index.ts`: Barrel file yang hanya melakukan re-export.
- `src/context-engine/*.test.ts`: Test dipisah per concern agar split file tetap tervalidasi.

## Bukti Verifikasi
- `npm run check`: Clean (Exit code 0)
- `bun test src/context-engine/*.test.ts`: Pass
- `npm run runtime:smoke`: Pass (tanpa regression baru)
- `bun -e "import { buildContextBatch, estimateTokens, scoreContextItem } from './src/context-engine/index.ts'; ..."`: Pass
