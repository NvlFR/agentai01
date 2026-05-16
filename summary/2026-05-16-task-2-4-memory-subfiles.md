# Summary Task 2.4 — Pecah `src/memory/` ke Sub-Files

## Status
- [x] Pecah `src/memory/` ke `store.ts`, `migrate.ts`, `repair.ts`, `path.ts`, `types.ts`, `record.ts`.
- [x] Implementasi atomic write menggunakan `writeFileAtomic` dari `src/infra/`.
- [x] `sanitizeSegment` melempar error untuk path traversal.
- [x] `repair` memindahkan file corrupt ke `.repair/`.
- [x] `migrate` menjalankan migrasi secara berurutan.
- [x] `npm run check` clean (termasuk fix untuk module sessions).
- [x] `bun test src/memory/` pass.
- [x] `npm run runtime:smoke` pass.

## Detail Perubahan
- **src/memory/types.ts**: Ekstraksi tipe data.
- **src/memory/path.ts**: Logika sanitasi dan resolusi path aman.
- **src/memory/record.ts**: Helper internal untuk parsing record dan handling versi.
- **src/memory/store.ts**: Implementasi utama `MemoryFileStore` yang didelegasikan ke sub-modul lain untuk `migrate` dan `repair`.
- **src/memory/migrate.ts**: Fungsi standalone untuk migrasi data.
- **src/memory/repair.ts**: Fungsi standalone untuk perbaikan data corrupt.
- **src/memory/index.ts**: Barrel file yang menyatukan semua sub-modul.

## Bukti Verifikasi
- `npm run check`: Clean (Exit code 0)
- `npx bun test src/memory/index.test.ts`: 2 pass
- `npm run runtime:smoke`: Pass (Exit code 0)
