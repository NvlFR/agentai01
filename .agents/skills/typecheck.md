# Skill: Typecheck

**Kapabilitas:** Menjalankan TypeScript typecheck untuk memastikan kode valid sebelum commit/push.

## Instruksi

Jalankan:

```bash
npm run check
```

Ini menjalankan `tsc -p tsconfig.json --noEmit` — memeriksa seluruh codebase tanpa menghasilkan output file.

## Kapan Dijalankan

- Sebelum setiap commit (otomatis via `pre-commit` git hook).
- Setelah menambah file baru atau mengubah types.
- Sebelum handoff/push — wajib clean.

## Error Umum

- `Cannot find module` — cek import path, pastikan file ada dan ekstensi `.ts` benar.
- `Type ... is not assignable` — periksa type compatibility, gunakan narrow types bukan `any`.
- `Property ... does not exist` — cek interface/type definition yang relevan.

## Catatan

- `@ts-nocheck` dan `any` dilarang kecuali ada penjelasan intentional.
- Jika typecheck lolos tapi runtime error, cek logic di test (`bun test`).
