# Summary Task 1.6 — Pecah `src/secrets/` ke Sub-Files

## Objective
Modularisasi `src/secrets/` menjadi sub-file yang granular dan testable sesuai dengan Requirement 8 dan Task 1.6.

## Perubahan Utama
- **`src/secrets/redact.ts`**: Implementasi logic redaction baru.
    - Secret < 8 karakter: Full mask (`****`).
    - Secret >= 8 karakter: Reveal 4 karakter pertama + suffix (`...****`).
- **`src/secrets/key-detect.ts`**: Logic deteksi sensitive keys menggunakan pattern case-insensitive.
- **`src/secrets/types.ts`**: Pemisahan type definitions dan constants.
- **`src/secrets/accessor.ts`**: Implementasi `SecretsAccessor`.
- **`src/secrets/ref.ts`**: Implementasi `SecretRef` resolution dan validation.
- **`src/secrets/index.ts`**: Barrel file (re-exports only).

## Bukti Selesai
1.  **Typecheck**: `npm run check` berhasil (Exit code 0).
2.  **Tests**: `bun test src/secrets/` pass semua (14 tests).
    - `isSecretKey`: Validasi pattern `api_key`, `token`, `password`, `authorization`.
    - `redactSecret`: Validasi masking logic untuk short/long secrets.
    - `redactSensitiveValue`: Validasi deep redaction pada objek.
3.  **Smoke Test**: `npm run runtime:smoke` berhasil tanpa regresi pada integrasi provider.

## Catatan
- Menghapus `src/secrets/index.test.ts` yang lama karena behavior `redactSecret` berubah dan sudah di-cover oleh `*.test.ts` baru yang colocated.
- Menggunakan `as any` pada test `redactSensitiveValue` untuk menangani perubahan type dari `number` ke `string` saat redaction terjadi pada value non-string.
