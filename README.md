# AgentAI01

`AgentAI01` adalah prototype runtime untuk **AI Company**, yaitu sistem multi-agent yang meniru operasi sebuah perusahaan digital. Di dalamnya ada agent untuk CEO, sales, marketing, product, engineering, project manager, dan support, lalu semuanya dijalankan lewat runtime app, HTTP API, worker, scheduler, dan operator UI web.

Project ini bukan clone OpenClaw, tetapi jelas mengambil banyak inspirasi struktur dan arah arsitektur dari `referensi/openclaw/`. Fokus repo ini adalah membangun lapisan aplikasi yang benar-benar bisa dijalankan di atas domain agent yang sudah ada.

## Tujuan Project

Target utama repo ini:

- membangun runtime operasional untuk kumpulan agent perusahaan
- menyediakan operator dashboard untuk memantau kondisi sistem
- menghubungkan runtime ke provider AI nyata lewat endpoint OpenAI-compatible
- menyimpan state, log, approval, dan artefak runtime secara lebih terstruktur
- menyiapkan pondasi agar arsitektur repo bisa makin mendekati kualitas referensi OpenClaw

## Agent yang Tersedia

Saat ini struktur agent di `src/agents/` mencakup:

- `ceo`: orkestrasi strategis dan prioritas lintas agent
- `sales`: lead intake, kualifikasi, proposal, dan handoff deal
- `marketing`: insight pasar, campaign, dan asset pendukung sales
- `product`: discovery kebutuhan dan spesifikasi solusi
- `engineering`: implementasi solusi dan workflow delivery
- `project-manager`: milestone, lifecycle, blocker, dan koordinasi delivery
- `support`: tiket pasca-delivery dan eskalasi operasional

## Gambaran Arsitektur

Secara garis besar, repo ini dibagi ke beberapa lapisan:

- `src/domain/`: type dan kontrak domain lintas agent
- `src/registry/`: registry agent, project, audit log, dan communication log
- `src/app/`: snapshot perusahaan dan dashboard read model
- `src/runtime/`: orchestrator shell untuk me-boot runtime perusahaan
- `src/runtime-app/`: aplikasi runnable yang berisi server HTTP, provider adapter, storage, queue, worker, scheduler, dan Telegram bot
- `src/agents/`: implementasi flow atau runtime per agent

Alur besarnya:

1. owner/operator mengakses operator UI atau API
2. runtime app me-boot shell operasional perusahaan
3. orchestrator membaca state agent, proyek, approvals, blocker, dan logs
4. worker/scheduler memproses job asynchronous
5. provider AI dipanggil lewat adapter OpenAI-compatible
6. hasilnya ditampilkan kembali ke dashboard, queue, approval flow, atau chat interface

## Fitur yang Sudah Terlihat di Repo

Berdasarkan struktur source saat ini, kemampuan yang sudah mulai terbentuk adalah:

- operator runtime app berbasis HTTP
- health check dan readiness check
- dashboard snapshot perusahaan
- approval flow
- worker pool dan scheduler
- queue backend
- file-based runtime storage
- integrasi provider OpenAI-compatible
- smoke scenario dan test runtime
- Telegram bot untuk chat dan command runtime

README ini sengaja menyebut “sudah terlihat di repo”, karena beberapa area masih berbentuk prototype atau development-grade, belum production-ready.

## Struktur Repo

Struktur utama repo saat ini:

```text
.
├── src/
│   ├── agents/
│   ├── app/
│   ├── domain/
│   ├── registry/
│   ├── runtime/
│   └── runtime-app/
├── runtime/
│   └── reports/
├── docs/
├── referensi/
│   └── openclaw/
├── restored-src/
├── .kiro/
│   └── specs/
├── TODO.md
├── SECURITY.md
└── VISION.md
```

Penjelasan singkat:

- `src/`: source utama project
- `runtime/`: output runtime/report development
- `docs/`: catatan dan dokumentasi internal repo ini
- `referensi/openclaw/`: referensi struktur dan arsitektur dari OpenClaw
- `restored-src/`: source restore/reference tambahan
- `.kiro/specs/`: requirements, design, dan task spec untuk agent dan runtime platform

## Spesifikasi Internal

Repo ini sudah punya spec yang cukup jelas di `.kiro/specs/`, terutama:

- `ai-company-agents`: spec induk alur bisnis lintas agent
- `ai-company-runtime-platform`: spec lapisan runtime aplikasi
- spec per agent:
  - `ceo-agent`
  - `sales-agent`
  - `marketing-agent`
  - `product-agent`
  - `engineering-agent`
  - `project-manager-agent`
  - `support-agent`

Kalau ingin memahami arah project sebelum coding, folder `.kiro/specs/` adalah titik baca terbaik.

## Dependency

Project ini saat ini menggunakan:

- `bun` `1.3.x`
- `typescript` `5.8.x`
- `node` `20+` untuk kompatibilitas toolchain lokal

## Environment

Runtime app membaca `.env`, lalu bisa dioverride oleh `.env.local` jika file itu ada.

Variable utama yang dipakai:

- `APP_ENV`: `development`, `test`, atau `production`
- `APP_HOST`: default `127.0.0.1`
- `APP_PORT`: default `3000`
- `APP_BASE_URL`: optional override URL publik app
- `OPERATOR_TOKEN`: token operator untuk aksi mutasi
- `AI_BASE_URL`: endpoint OpenAI-compatible
- `AI_API_KEY`: API key provider
- `AI_MODEL`: model default
- `AI_TIMEOUT_MS`: timeout request provider
- `STORAGE_ARTIFACTS_ROOT`: root artefak runtime
- `TOKEN_TELE`: token bot Telegram
- `ID_CHAT`: chat ID Telegram yang diizinkan

Contoh `.env.local`:

```env
APP_ENV=development
APP_HOST=127.0.0.1
APP_PORT=3310
OPERATOR_TOKEN=dev-owner-token
AI_BASE_URL=http://127.0.0.1:8045/v1
AI_API_KEY=sk-local-demo
AI_MODEL=gemini-3-flash
AI_TIMEOUT_MS=30000
STORAGE_ARTIFACTS_ROOT=runtime/artifacts
```

## Instalasi

```bash
npm install
```

Atau jika ingin konsisten dengan runtime utama project:

```bash
bun install
```

## Menjalankan Project

### Development server

```bash
npm run dev
```

Ini menjalankan runtime app utama dengan watch mode dari `src/runtime-app/index.ts`.

### Jalankan app tanpa watch

```bash
npm run runtime:app
```

### Jalankan worker

```bash
npm run runtime:worker
```

### Jalankan scheduler

```bash
npm run runtime:scheduler
```

### Jalankan smoke scenario

```bash
npm run runtime:smoke
```

### Jalankan Telegram bot

```bash
npm run runtime:telegram
```

## Commands Penting

- `npm run dev`: start runtime app dengan watch mode
- `npm run runtime:app`: start app utama tanpa watch
- `npm run runtime:worker`: start worker runtime
- `npm run runtime:scheduler`: start scheduler runtime
- `npm run runtime:smoke`: smoke test end-to-end
- `npm run runtime:telegram`: start Telegram runtime bot
- `npm run check`: TypeScript typecheck
- `npm run build`: compile TypeScript
- `npm test`: jalankan test dengan Bun

## Endpoint Dasar

Beberapa endpoint penting yang sudah disebut oleh struktur runtime app saat ini:

- `GET /health`
- `GET /ready`
- `GET /api/snapshot`

`/ready` dipakai untuk menilai apakah runtime benar-benar siap berjalan. Jika env penting seperti `AI_API_KEY` belum ada, endpoint ini seharusnya menandai runtime sebagai belum siap.

## Operator UI

README sebelumnya menunjukkan bahwa operator UI ini berfokus pada:

- dashboard perusahaan
- detail proyek
- approval queue
- runtime jobs
- message log
- audit log
- submit owner directive
- retry action
- status banner seperti `degraded` dan `not-ready`

Artinya, UI di repo ini bukan frontend marketing, tetapi control panel operasional untuk sistem agent.

## Telegram Runtime

Runtime juga punya interface Telegram untuk command/chat ringan.

Env yang dibutuhkan:

- `TOKEN_TELE`
- `ID_CHAT`

Command yang disebut di runtime:

- `/help`
- `/status`
- `/approvals`
- `/directive <instruksi>`
- `/reset`

Pesan biasa tanpa slash diteruskan sebagai chat ke provider AI.

## Status Project Saat Ini

Dari hasil analisa repo, kondisi project saat ini bisa diringkas seperti ini:

- domain dan kontrak antar-agent sudah ada
- runtime app runnable sudah mulai terbentuk
- provider adapter OpenAI-compatible sudah ada
- operator shell/dashboard sudah mulai dibangun
- worker, scheduler, queue, dan storage sudah tersedia dalam versi awal
- dokumentasi produk inti seperti `SECURITY.md`, `VISION.md`, dan `AGENTS.md` di root masih belum diisi
- repo masih dalam fase penguatan struktur agar lebih rapi dan lebih dekat ke referensi OpenClaw

Jadi ini sudah lebih dari sekadar eksperimen kecil, tetapi masih berada pada tahap fondasi dan penyelarasan arsitektur.

## Hubungan dengan OpenClaw

Folder `referensi/openclaw/` dipakai sebagai referensi arsitektur, struktur folder, dan pendekatan engineering. Adaptasi yang sedang dilacak ada di `TODO.md`, sementara penjelasan hasil analisa referensi sudah ditulis di folder `docs/`.

Dokumen yang relevan:

- `docs/openclaw-struktur-lengkap.md`
- `docs/openclaw-extensions.md`
- `docs/openclaw-terjemahan-kebijakan.md`
- `TODO.md`

## Pengembangan Berikutnya

Prioritas yang terlihat paling relevan untuk repo ini:

- merapikan dokumen root seperti `SECURITY.md`, `VISION.md`, dan `AGENTS.md`
- memperjelas positioning project di README dan docs
- menyesuaikan struktur repo dengan bagian OpenClaw yang benar-benar relevan
- memperkuat persistence, observability, dan auth operator
- memisahkan mana yang masih mock/development dan mana yang sudah siap operasional

## Catatan

Jika Anda baru masuk ke repo ini, urutan baca yang paling efektif:

1. `README.md`
2. `TODO.md`
3. `.kiro/specs/ai-company-agents/requirements.md`
4. `.kiro/specs/ai-company-runtime-platform/requirements.md`
5. `docs/openclaw-struktur-lengkap.md`

Dari sana baru masuk ke `src/runtime-app/` dan `src/agents/`.
