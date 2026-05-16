# Summary Task 1.7 — Pecah `src/config/` ke Sub-Files

## Objective
Memecah `src/config/` menjadi sub-file yang kecil, testable, dan tetap backward compatible sesuai Requirement 9 dan Task 1.7.

## Perubahan Utama
- `src/config/parse.ts`: menampung `ConfigIssue`, `ConfigReader`, `ConfigSchema`, `ConfigParseResult`, dan `parseConfig`.
- `src/config/readers.ts`: memindahkan `readString`, `readInteger`, `readBoolean`, dan `readObject` ke modul terpisah.
- `src/config/env-source.ts`: memisahkan `envSource(env)` untuk normalisasi source berbasis environment.
- `src/config/index.ts`: diubah menjadi barrel `re-export only` tanpa implementasi langsung.
- Test lama `src/config/index.test.ts` dipecah menjadi:
  - `src/config/parse.test.ts`
  - `src/config/readers.test.ts`
  - `src/config/env-source.test.ts`
- `src/config/runtime-app-bridge.ts` tetap kompatibel karena kontrak publik `src/config/index.ts` dipertahankan.

## Bukti Selesai
1. `npm run check` clean.
2. `bun test src/config/parse.test.ts src/config/readers.test.ts src/config/env-source.test.ts src/config/runtime-app-bridge.test.ts` pass semua:
   - 18 tests pass, 0 fail.
3. `npm run runtime:smoke` clean:
   - provider call sukses
   - `/ready` status `200`
   - scenario runtime selesai tanpa error baru

## Catatan
- `bun test src/config/` tidak dipakai sebagai bukti final karena pola path itu ikut mengeksekusi suite di `referensi/openclaw/src/config/`, yang memang bukan target runnable repo ini dan gagal karena dependency referensi/Vitest yang tidak tersedia di workspace utama.
- Public API `src/config/index.ts` tetap sama, jadi consumer yang sudah ada tidak perlu diubah.
