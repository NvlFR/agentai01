# Summary — Task 1-2.5 Restored Src Baseline and Prompt Fabric

## Scope

- Menyelesaikan task `1` sampai `2.5` pada spec `.kiro/specs/restored-src-modules-adaptation/tasks.md`.
- Mendaratkan baseline adaptasi `restored-src` sebagai manifest yang executable dan teruji.
- Menambahkan fondasi awal `query`, preprocessing input, message normalization, prompt suggestion, dan routing context runtime-relevant ke surface repo yang tepat.

## Implemented

- Baseline adaptasi capability mandatory ditambahkan di `src/compat/restored-src-adaptation.ts` beserta test coverage di `src/compat/restored-src-adaptation.test.ts`.
- Fondasi `query` ditambahkan di `src/runtime/query/`:
  - `config.ts` untuk snapshot config query dan gate default.
  - `deps.ts` untuk dependency injection ringan.
  - `stopHooks.ts` untuk registry keputusan block/prevent.
  - `tokenBudget.ts` untuk continuation tracking dan stop decision.
- Prompt fabric awal ditambahkan di `src/runtime-app/prompt/`:
  - `inputPipeline.ts` untuk klasifikasi slash command, bash command, dan text prompt.
  - `messageNormalization.ts` untuk normalization dan provider mapping message runtime.
  - `suggestions.ts` untuk autocomplete/prompt suggestion lintas command, skill, dan recent prompt.
  - `contextRoutes.ts` untuk memetakan `restored-src/src/context/*` ke `src/runtime`, `src/runtime-app/prompt`, `src/runtime-app/ui`, `src/runtime-app/diagnostics`, dan `src/runtime-app/speech`.
- Export runtime diperluas lewat `src/runtime/index.ts` dan `src/compat/index.ts`.
- Checkbox task `1` sampai `2.5` diperbarui menjadi selesai di `.kiro/specs/restored-src-modules-adaptation/tasks.md`.

## Validation

- Targeted tests untuk batch ini ✅:
  - `bun test src/compat/restored-src-adaptation.test.ts src/runtime/query/index.test.ts src/runtime-app/prompt/fabric.test.ts src/runtime-app/prompt/promptPlumbing.test.ts`
- `npm run runtime:smoke` ✅
  - Provider request sukses (`status: 200`), `/health` sehat, `/ready` mengembalikan `200`, dan scenario runtime menutup project ke state `delivered`.
- `npm run check` ❌ tidak hijau pada baseline repo saat ini.
  - Batch ini sempat memunculkan union type mismatch di `src/compat/restored-src-adaptation.ts` dan sudah diperbaiki.
  - Kegagalan tersisa yang terlihat berasal dari surface lama repo, terutama banyak missing-module/type errors di `src/logging/*`, `src/runtime-app/services/*`, `src/runtime-app/tools/computer-use/*`, dan `src/tools/*`.
- `bun test` full repo ❌ tidak hijau pada baseline repo saat ini.
  - Failure yang teramati:
    - `src/runtime-app/runtimeApp.test.ts` — `executes real runbook directives through runtime app state`
    - `src/runtime-app/integrations/integrations.test.ts` — `reads Google Drive about data through the Google adapter`

## Notes

- Mission Control `start` POST gagal karena `http://localhost:3010` tidak bisa dihubungi dari environment ini.
