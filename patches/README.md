# Patches

Folder ini menyimpan patch files untuk dependency yang membutuhkan modifikasi targeted.

## Format

File patch menggunakan format: `<package-name>+<version>.patch`

Contoh: `some-package+1.2.3.patch`

## Cara Kerja

Patch diaplikasikan otomatis setelah `npm install` via script `postinstall` di `package.json`.
Mekanisme ini menggunakan `patch-package` (atau implementasi ekuivalen).

Patch bersifat idempotent: mengaplikasikan patch yang sama dua kali menghasilkan state yang sama.

## Menambah Patch Baru

1. Install dependency dan modifikasi file di `node_modules/<package>/...` secara manual.
2. Jalankan `npx patch-package <package-name>` untuk menghasilkan file patch.
3. Commit file patch bersama perubahan lain.
4. Dokumentasikan patch baru di bagian "Daftar Patch" di bawah.

## Daftar Patch

<!-- Tambahkan entri baru di sini setiap kali patch baru dibuat. Format: -->
<!-- | Package | Versi | Alasan | Tanggal | -->

| Package | Versi | Alasan | Tanggal |
|---------|-------|--------|---------|
| _(belum ada)_ | – | – | – |

## Catatan

- Jangan edit file di `node_modules/` secara langsung tanpa membuat patch.
- Jika versi dependency berubah dan patch gagal diaplikasikan, script akan melaporkan nama package, versi yang diharapkan, dan versi aktual.
- Hapus patch yang sudah tidak relevan (upstream sudah fix) dan update tabel di atas.
