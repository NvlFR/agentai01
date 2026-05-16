# Tasks

## Operator Control UI

---

## Task List

- [x] 1. Setup Vite Build Tooling
  - [x] 1.1 Buat `src/runtime-app/ui/package.json` dengan dependencies Lit dan Vite yang di-pin ke versi eksak
  - [x] 1.2 Buat `src/runtime-app/ui/vite.config.ts` dengan `base: "./"`, `sourcemap: true`, dan proxy `/api/*` ke port 3000
  - [x] 1.3 Buat `src/runtime-app/ui/tsconfig.json` dengan `strict: true` dan `target: "ES2022"`
  - [x] 1.4 Buat `src/runtime-app/ui/index.html` sebagai entry point HTML untuk Vite
  - [x] 1.5 Tambahkan script `ui:dev`, `ui:build`, dan `ui:check` ke `package.json` root
  - [x] 1.6 Tambahkan `src/runtime-app/ui/dist/` ke `.gitignore`

- [x] 2. Foundation Files
  - [x] 2.1 Buat `src/runtime-app/ui/src/main.ts` yang mengimpor `base.css` dan `app.ts`
  - [x] 2.2 Buat `src/runtime-app/ui/src/styles/base.css` dengan CSS variables dark mode dan light mode
  - [x] 2.3 Buat `src/runtime-app/ui/src/types/snapshot.ts` dengan interface `RuntimeAppSnapshot` lengkap (mirror `src/runtime-app/state.ts`)
  - [x] 2.4 Buat `src/runtime-app/ui/src/types/snapshot.mock.ts` dengan mock data untuk dev mode (tidak di-bundle ke production)

- [x] 3. App Shell Component
  - [x] 3.1 Buat `src/runtime-app/ui/src/ui/app.ts` sebagai `<agent-runtime-shell>` Lit component
  - [x] 3.2 Implementasikan state: `snapshot`, `activeTab`, `settings`, `loading`, `error`, `_fetching`
  - [x] 3.3 Implementasikan `loadSettings()` — baca dari localStorage key `agentai01.operator.settings.v1` dengan fallback ke defaults
  - [x] 3.4 Implementasikan `saveSettings()` — tulis ke localStorage sinkron
  - [x] 3.5 Implementasikan `fetchSnapshot()` dengan guard overlap (`_fetching`) dan error handling
  - [x] 3.6 Implementasikan poller: `startPoller()` dan `stopPoller()` via `setInterval`/`clearInterval`
  - [x] 3.7 Panggil `stopPoller()` di `disconnectedCallback` untuk mencegah memory leak
  - [x] 3.8 Implementasikan layout: sidebar (branding, nav 7 item, env info, theme toggle) + main (loading/error/view)
  - [x] 3.9 Simpan `activeTab` ke settings saat tab berubah, trigger `fetchSnapshot()` segera

- [x] 4. Theming
  - [x] 4.1 Implementasikan `applyTheme(mode)` yang menerapkan `data-theme-mode` ke `document.documentElement`
  - [x] 4.2 Implementasikan listener `prefers-color-scheme` untuk mode `system` — update tema otomatis tanpa reload
  - [x] 4.3 Baca tema dari settings sebelum render pertama untuk mencegah flash of unstyled content
  - [x] 4.4 Tambahkan tombol toggle tema di sidebar yang bersiklus antara `dark`, `light`, `system`

- [x] 5. View Components — Read-Only
  - [x] 5.1 Buat `src/runtime-app/ui/src/ui/views/dashboard.ts` — KPI cards, operational issues, health status
  - [x] 5.2 Buat `src/runtime-app/ui/src/ui/views/projects.ts` — daftar proyek dengan lifecycle state dan assigned agents
  - [x] 5.3 Buat `src/runtime-app/ui/src/ui/views/audit.ts` — audit log entries diurutkan terbaru ke terlama
  - [x] 5.4 Semua view menerima `snapshot` sebagai Lit property, tidak ada fetch langsung dari view

- [x] 6. View Components — Aksi
  - [x] 6.1 Buat `src/runtime-app/ui/src/ui/views/approvals.ts` — daftar pending approvals, tombol approve/reject/revise, form notes, emit event `approval-respond`
  - [x] 6.2 Buat `src/runtime-app/ui/src/ui/views/jobs.ts` — daftar jobs dengan status badge, tombol retry untuk status `failed`, emit event `job-retry`
  - [x] 6.3 Buat `src/runtime-app/ui/src/ui/views/messages.ts` — communication log, tombol retry untuk pesan rejected, emit event `message-retry`
  - [x] 6.4 Buat `src/runtime-app/ui/src/ui/views/directive.ts` — textarea directive, tombol Execute, riwayat respons, emit event `directive-execute`

- [x] 7. Action Handlers di App Shell
  - [x] 7.1 Implementasikan handler `approval-respond` — POST `/api/approvals/{id}/respond`, refresh snapshot
  - [x] 7.2 Implementasikan handler `job-retry` — POST `/api/jobs/{id}/retry`, refresh snapshot
  - [x] 7.3 Implementasikan handler `message-retry` — POST `/api/messages/{id}/retry`, refresh snapshot
  - [x] 7.4 Implementasikan handler `directive-execute` — POST `/api/directives`, tampilkan respons di view
  - [x] 7.5 Implementasikan confirmation dialog untuk aksi yang mengembalikan `requires_confirmation: true` — resend dengan `confirm: true`
  - [x] 7.6 Tambahkan konfirmasi sebelum API call untuk aksi destruktif: `reject` dan `revise`

- [x] 8. Bun Server Static File Handler
  - [x] 8.1 Tambahkan static file handler di Bun server yang meng-serve file dari `src/runtime-app/ui/dist/`
  - [x] 8.2 Implementasikan SPA fallback — path yang tidak cocok dengan file atau API route dikembalikan `dist/index.html`
  - [x] 8.3 Kembalikan 503 HTML dengan instruksi `npm run ui:build` jika `dist/index.html` tidak ditemukan
  - [x] 8.4 Pastikan API routes (`/health`, `/ready`, `/api/*`) tetap diproses sebelum static handler

- [x] 9. UX States
  - [x] 9.1 Tambahkan loading skeleton atau spinner saat `loading === true` di App Shell
  - [x] 9.2 Tambahkan error banner dengan `role="alert"` saat fetch gagal — poller tetap berjalan
  - [x] 9.3 Gunakan warna status konsisten: hijau untuk `ok`/`completed`, kuning untuk `warn`/`running`, merah untuk `danger`/`failed`
  - [x] 9.4 Gunakan elemen semantik (`<nav>`, `<main>`, `<section>`, `<button>`) — tidak ada `<div>` untuk elemen interaktif
  - [x] 9.5 Tambahkan `aria-label` pada tombol yang tidak memiliki teks deskriptif

- [x] 10. Typecheck dan Build Validation
  - [x] 10.1 Pastikan `npm run check` dari root memeriksa kode UI tanpa error
  - [x] 10.2 Pastikan `npm run ui:build` gagal jika ada TypeScript error
  - [x] 10.3 Pastikan tidak ada `any` atau `@ts-nocheck` di seluruh kode UI
  - [x] 10.4 Pastikan semua type-only imports menggunakan `import type`
  - [x] 10.5 Jalankan `npm run ui:build` dan verifikasi output di `src/runtime-app/ui/dist/` berisi `index.html` dan asset yang di-hash
