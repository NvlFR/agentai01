# Requirements Document

## Introduction

Upgrade Operator Control UI dari arsitektur saat ini (Lit + Bun build, single-file `App.ts`) menjadi arsitektur modern yang terinspirasi dari referensi OpenClaw UI (Lit + Vite, multi-file, polling, theming, tab views lengkap).

UI tetap di-serve oleh Bun HTTP server yang sudah ada. Perubahan mencakup:
1. Migrasi build tooling dari `bun build` ke Vite
2. Refactor `App.ts` menjadi multi-file component architecture
3. Penambahan fitur: polling/auto-refresh, tab views lengkap (projects, approvals, jobs, audit, directive), theming (dark/light/system), dan settings persistence via localStorage
4. Dev workflow: Vite dev server untuk development, Vite build untuk production (static files di-serve oleh Bun HTTP server)

---

## Glossary

- **Operator_UI**: Aplikasi web Lit yang berjalan di browser operator untuk memonitor dan mengontrol runtime.
- **Vite_Build**: Proses build menggunakan Vite yang menghasilkan static files di `src/runtime-app/ui/dist/`.
- **Bun_Server**: HTTP server berbasis Bun yang meng-serve static files hasil Vite build dan API endpoints.
- **Snapshot**: Payload JSON `RuntimeAppSnapshot` yang dikembalikan oleh endpoint `/api/snapshot`.
- **Poller**: Mekanisme `setInterval` di sisi browser yang secara periodik memanggil `/api/snapshot` untuk memperbarui data UI.
- **Tab**: Salah satu dari tujuh view utama UI: `dashboard`, `projects`, `approvals`, `jobs`, `messages`, `audit`, `directive`.
- **Theme**: Kombinasi nama tema (`dark`, `light`) dan mode (`system`, `light`, `dark`) yang menentukan tampilan visual UI.
- **Settings**: Preferensi pengguna (tema, tab aktif terakhir, interval polling) yang disimpan di `localStorage`.
- **Static_File_Server**: Bagian dari Bun_Server yang meng-serve file statis dari direktori `src/runtime-app/ui/dist/`.
- **Vite_Dev_Server**: Server development Vite (port 5173) yang digunakan saat development, dengan HMR.
- **Component**: Satu file TypeScript yang mendefinisikan satu Lit Web Component.
- **App_Shell**: Komponen root `<agent-runtime-shell>` yang mengorkestrasi layout, navigasi, dan state global.

---

## Requirements

### Requirement 1: Migrasi Build Tooling ke Vite

**User Story:** Sebagai developer, saya ingin build tooling UI menggunakan Vite agar mendapatkan HMR saat development dan output yang dioptimasi saat production.

#### Acceptance Criteria

1. THE Vite_Build SHALL menghasilkan static files di direktori `src/runtime-app/ui/dist/` ketika perintah `npm run ui:build` dijalankan.
2. WHEN perintah `npm run ui:dev` dijalankan, THE Vite_Dev_Server SHALL berjalan di port 5173 dengan Hot Module Replacement aktif.
3. THE Vite_Build SHALL menghasilkan file `index.html` dan asset-asset JavaScript/CSS yang di-hash untuk cache busting.
4. THE Vite_Build SHALL menggunakan `base: "./"` agar asset paths bersifat relatif dan kompatibel dengan serving dari sub-path.
5. IF file `src/runtime-app/ui/dist/` tidak ada saat Bun_Server dijalankan, THEN THE Bun_Server SHALL mengembalikan respons HTTP 503 dengan pesan yang menginstruksikan operator untuk menjalankan `npm run ui:build`.
6. THE Vite_Build SHALL menghasilkan source maps untuk memudahkan debugging.
7. THE Operator_UI SHALL menggunakan `package.json` terpisah di `src/runtime-app/ui/` dengan dependencies Vite dan Lit yang di-pin ke versi eksak.

### Requirement 2: Refactor ke Multi-File Component Architecture

**User Story:** Sebagai developer, saya ingin UI dipecah menjadi file-file komponen terpisah agar lebih mudah di-maintain dan di-extend.

#### Acceptance Criteria

1. THE App_Shell SHALL didefinisikan di file `src/runtime-app/ui/src/ui/app.ts` sebagai Lit Web Component `<agent-runtime-shell>`.
2. THE Operator_UI SHALL memiliki struktur direktori: `src/runtime-app/ui/src/ui/` untuk komponen, `src/runtime-app/ui/src/styles/` untuk CSS global, dan `src/runtime-app/ui/src/types/` untuk TypeScript types.
3. WHEN sebuah Tab memiliki lebih dari 150 baris template HTML, THE Component SHALL dipecah menjadi file komponen terpisah di subdirektori `src/runtime-app/ui/src/ui/views/`.
4. THE Operator_UI SHALL memiliki file entry point `src/runtime-app/ui/src/main.ts` yang mengimpor CSS global dan komponen App_Shell.
5. THE Operator_UI SHALL memiliki file `src/runtime-app/ui/index.html` sebagai entry point HTML untuk Vite.
6. THE App_Shell SHALL menggunakan TypeScript strict tanpa `any` dan tanpa `@ts-nocheck`.
7. WHEN komponen baru ditambahkan, THE Component SHALL didaftarkan sebagai custom element dengan nama yang diawali `agent-`.

### Requirement 3: Static File Serving oleh Bun Server

**User Story:** Sebagai operator, saya ingin mengakses UI melalui Bun HTTP server yang sama dengan API endpoints agar tidak perlu konfigurasi proxy tambahan.

#### Acceptance Criteria

1. WHEN request GET diterima untuk path `/`, THE Bun_Server SHALL meng-serve file `src/runtime-app/ui/dist/index.html`.
2. WHEN request GET diterima untuk path yang cocok dengan file di `src/runtime-app/ui/dist/`, THE Bun_Server SHALL meng-serve file tersebut dengan `Content-Type` yang sesuai.
3. WHEN request GET diterima untuk path yang tidak cocok dengan file maupun API route, THE Bun_Server SHALL meng-serve `src/runtime-app/ui/dist/index.html` (SPA fallback).
4. THE Bun_Server SHALL meng-serve file JavaScript dengan header `Content-Type: application/javascript`.
5. THE Bun_Server SHALL meng-serve file CSS dengan header `Content-Type: text/css`.
6. THE Static_File_Server SHALL tidak mengubah API routes yang sudah ada (`/health`, `/ready`, `/api/*`).
7. IF `src/runtime-app/ui/dist/index.html` tidak ditemukan, THEN THE Bun_Server SHALL mengembalikan respons HTML dengan status 503 yang menginstruksikan operator untuk menjalankan `npm run ui:build`.

### Requirement 4: Polling dan Auto-Refresh

**User Story:** Sebagai operator, saya ingin UI secara otomatis memperbarui data dari server agar saya selalu melihat status runtime terkini tanpa perlu refresh manual.

#### Acceptance Criteria

1. WHEN App_Shell pertama kali dimuat, THE Poller SHALL mulai memanggil endpoint `/api/snapshot` setiap 5000ms.
2. WHEN Tab aktif berubah, THE Poller SHALL segera memanggil `/api/snapshot` untuk memperbarui data Tab yang baru aktif.
3. WHEN respons dari `/api/snapshot` berhasil diterima, THE App_Shell SHALL memperbarui state internal dan merender ulang komponen yang terpengaruh.
4. IF request `/api/snapshot` gagal (network error atau status >= 400), THEN THE App_Shell SHALL menampilkan indikator error di UI tanpa menghentikan Poller.
5. WHEN App_Shell di-disconnect dari DOM (lifecycle `disconnectedCallback`), THE Poller SHALL dihentikan untuk mencegah memory leak.
6. THE Poller SHALL menggunakan interval default 5000ms yang dapat dikonfigurasi melalui Settings.
7. WHILE request `/api/snapshot` sedang berlangsung, THE App_Shell SHALL tidak memulai request baru (debounce/guard).

### Requirement 5: Tab Views Lengkap

**User Story:** Sebagai operator, saya ingin memiliki tab views yang lengkap untuk semua aspek runtime agar saya dapat memonitor dan mengontrol setiap bagian sistem.

#### Acceptance Criteria

1. THE App_Shell SHALL menampilkan tujuh tab navigasi: `dashboard`, `projects`, `approvals`, `jobs`, `messages`, `audit`, `directive`.
2. WHEN tab `dashboard` aktif, THE App_Shell SHALL menampilkan KPI cards (active projects, pending approvals, active jobs), operational issues, dan runtime health status.
3. WHEN tab `projects` aktif, THE App_Shell SHALL menampilkan daftar proyek dengan lifecycle state, assigned agents, dan link ke detail proyek.
4. WHEN tab `approvals` aktif, THE App_Shell SHALL menampilkan daftar pending approvals dengan tombol approve/reject/revise dan form notes.
5. WHEN tab `jobs` aktif, THE App_Shell SHALL menampilkan daftar runtime jobs dengan status, kind, dan tombol retry untuk job yang berstatus `failed`.
6. WHEN tab `messages` aktif, THE App_Shell SHALL menampilkan communication log dengan from/to agent, message type, dan tombol retry untuk pesan yang ditolak.
7. WHEN tab `audit` aktif, THE App_Shell SHALL menampilkan audit log entries yang diurutkan dari terbaru ke terlama.
8. WHEN tab `directive` aktif, THE App_Shell SHALL menampilkan form textarea untuk input directive, tombol Execute, dan riwayat respons directive terakhir.
9. WHEN operator mengklik tombol approve/reject/revise pada tab `approvals`, THE App_Shell SHALL memanggil endpoint `POST /api/approvals/{id}/respond` dan memperbarui UI dengan respons.
10. WHEN operator mengklik tombol retry pada tab `jobs`, THE App_Shell SHALL memanggil endpoint `POST /api/jobs/{id}/retry` dan memperbarui UI dengan respons.
11. WHEN operator mengklik tombol retry pada tab `messages`, THE App_Shell SHALL memanggil endpoint `POST /api/messages/{id}/retry` dan memperbarui UI dengan respons.
12. WHEN operator mengklik Execute pada tab `directive`, THE App_Shell SHALL memanggil endpoint `POST /api/directives` dan menampilkan respons di bawah form.
13. IF aksi pada requirement 9, 10, 11, atau 12 mengembalikan `requires_confirmation: true`, THEN THE App_Shell SHALL menampilkan dialog konfirmasi sebelum mengirim ulang request dengan `confirm: true`.

### Requirement 6: Theming (Dark/Light/System)

**User Story:** Sebagai operator, saya ingin dapat memilih tema tampilan UI agar nyaman digunakan di berbagai kondisi pencahayaan.

#### Acceptance Criteria

1. THE Operator_UI SHALL mendukung tiga mode tema: `dark`, `light`, dan `system`.
2. WHEN mode tema `system` dipilih, THE Operator_UI SHALL mengikuti preferensi `prefers-color-scheme` dari sistem operasi.
3. WHEN mode tema berubah, THE Operator_UI SHALL menerapkan CSS variables yang sesuai pada `document.documentElement` melalui atribut `data-theme-mode`.
4. THE Operator_UI SHALL mendefinisikan CSS variables untuk dark mode dan light mode di file `src/runtime-app/ui/src/styles/base.css`.
5. WHEN halaman pertama kali dimuat, THE Operator_UI SHALL membaca tema tersimpan dari localStorage sebelum render pertama untuk mencegah flash of unstyled content.
6. THE Operator_UI SHALL menyediakan tombol toggle tema di sidebar atau header yang dapat diakses operator.
7. WHEN sistem operasi mengubah preferensi color scheme saat mode `system` aktif, THE Operator_UI SHALL secara otomatis memperbarui tema tanpa reload halaman.

### Requirement 7: Settings Persistence via localStorage

**User Story:** Sebagai operator, saya ingin preferensi UI saya tersimpan di browser agar tidak perlu mengatur ulang setiap kali membuka halaman.

#### Acceptance Criteria

1. THE Operator_UI SHALL menyimpan settings ke localStorage dengan key `agentai01.operator.settings.v1`.
2. THE Settings SHALL mencakup: `theme` (string), `themeMode` (string), `activeTab` (string), `pollIntervalMs` (number).
3. WHEN App_Shell pertama kali dimuat, THE App_Shell SHALL membaca settings dari localStorage dan menerapkannya sebelum render pertama.
4. WHEN settings berubah (tema, tab aktif), THE App_Shell SHALL menyimpan perubahan ke localStorage secara sinkron.
5. IF localStorage tidak tersedia atau data tersimpan corrupt, THEN THE App_Shell SHALL menggunakan default settings tanpa error.
6. THE Settings SHALL menggunakan default: `theme: "dark"`, `themeMode: "system"`, `activeTab: "dashboard"`, `pollIntervalMs: 5000`.

### Requirement 8: Dev Workflow dengan Vite Dev Server

**User Story:** Sebagai developer, saya ingin menggunakan Vite dev server saat development agar mendapatkan HMR dan iterasi yang cepat.

#### Acceptance Criteria

1. WHEN perintah `npm run ui:dev` dijalankan dari root project, THE Vite_Dev_Server SHALL berjalan di port 5173.
2. THE Vite_Dev_Server SHALL menyediakan stub endpoint `/__agentai/snapshot` yang mengembalikan mock `RuntimeAppSnapshot` untuk development tanpa Bun_Server.
3. WHEN file komponen UI diubah saat Vite_Dev_Server berjalan, THE Vite_Dev_Server SHALL melakukan Hot Module Replacement tanpa full page reload.
4. THE Vite_Dev_Server SHALL dikonfigurasi dengan `proxy` untuk meneruskan request `/api/*` ke Bun_Server di port 3000 saat keduanya berjalan bersamaan.
5. THE Operator_UI SHALL mendeteksi apakah berjalan di Vite dev mode dan menggunakan stub data jika endpoint `/api/snapshot` tidak tersedia.

### Requirement 9: Kompatibilitas TypeScript dan Build Pipeline

**User Story:** Sebagai developer, saya ingin seluruh kode UI lolos typecheck agar tidak ada runtime error yang bisa dicegah di compile time.

#### Acceptance Criteria

1. THE Operator_UI SHALL memiliki `tsconfig.json` di `src/runtime-app/ui/` yang menggunakan `strict: true` dan `target: "ES2022"`.
2. WHEN perintah `npm run check` dijalankan dari root project, THE TypeScript_Checker SHALL memeriksa kode UI tanpa error.
3. THE Operator_UI SHALL mendefinisikan TypeScript types untuk `RuntimeAppSnapshot` di `src/runtime-app/ui/src/types/snapshot.ts` yang kompatibel dengan tipe yang didefinisikan di `src/runtime-app/state.ts`.
4. THE Operator_UI SHALL tidak menggunakan `any` atau `@ts-nocheck`.
5. WHEN `npm run ui:build` dijalankan, THE Vite_Build SHALL gagal jika ada TypeScript error.
6. THE Operator_UI SHALL menggunakan `import type` untuk semua type-only imports.

### Requirement 10: Aksesibilitas dan UX Dasar

**User Story:** Sebagai operator, saya ingin UI yang dapat digunakan dengan keyboard dan memiliki kontras warna yang memadai agar dapat digunakan secara efektif.

#### Acceptance Criteria

1. THE Operator_UI SHALL menggunakan elemen HTML semantik (`<nav>`, `<main>`, `<section>`, `<button>`) untuk navigasi dan aksi.
2. WHEN operator menggunakan keyboard Tab, THE Operator_UI SHALL memindahkan fokus secara logis melalui elemen interaktif.
3. THE Operator_UI SHALL menampilkan loading state (skeleton atau spinner) saat data sedang di-fetch dari `/api/snapshot`.
4. THE Operator_UI SHALL menampilkan pesan error yang informatif jika fetch gagal, bukan blank screen.
5. THE Operator_UI SHALL menggunakan warna status yang konsisten: hijau untuk `ok`/`completed`, kuning untuk `warn`/`running`, merah untuk `danger`/`failed`.
6. WHEN aksi destruktif (reject, revise, retry) memerlukan konfirmasi, THE Operator_UI SHALL menampilkan dialog konfirmasi yang jelas dengan deskripsi konsekuensi aksi.
