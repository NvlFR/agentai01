# Design Document: Operator Control UI

## Overview

Upgrade Operator Control UI dari arsitektur saat ini (single-file `App.ts`, `bun build`) ke arsitektur multi-file berbasis Vite + Lit Web Components. UI tetap di-serve oleh Bun HTTP server yang sudah ada. Perubahan utama: build tooling, component decomposition, polling, tab views lengkap, theming, dan settings persistence.

---

## Architecture

### Struktur Direktori Target

```
src/runtime-app/ui/
├── index.html                    # Vite entry point HTML
├── package.json                  # dependencies UI (Lit, Vite) — pin versi eksak
├── tsconfig.json                 # strict: true, target: ES2022
├── vite.config.ts                # Vite config (base: "./", proxy /api/* → :3000)
└── src/
    ├── main.ts                   # entry: import CSS global + App_Shell
    ├── styles/
    │   └── base.css              # CSS variables dark/light, reset minimal
    ├── types/
    │   └── snapshot.ts           # RuntimeAppSnapshot type (mirror state.ts)
    └── ui/
        ├── app.ts                # <agent-runtime-shell> — App_Shell root
        └── views/
            ├── dashboard.ts      # <agent-view-dashboard>
            ├── projects.ts       # <agent-view-projects>
            ├── approvals.ts      # <agent-view-approvals>
            ├── jobs.ts           # <agent-view-jobs>
            ├── messages.ts       # <agent-view-messages>
            ├── audit.ts          # <agent-view-audit>
            └── directive.ts      # <agent-view-directive>
```

### Integrasi dengan Bun Server

```
Browser
  │  GET /          → Bun_Server → dist/index.html
  │  GET /assets/*  → Bun_Server → dist/assets/*
  │  GET /api/*     → Bun_Server → API handlers (tidak berubah)
  │  GET /health    → Bun_Server → health handler (tidak berubah)
  │
  │  (dev mode)
  │  GET /          → Vite Dev Server :5173
  │  GET /api/*     → Vite proxy → Bun_Server :3000
```

Bun_Server menambahkan static file handler sebelum API routes. Jika `dist/index.html` tidak ada, kembalikan 503 HTML dengan instruksi `npm run ui:build`.

---

## Component Design

### App_Shell (`app.ts`)

`<agent-runtime-shell>` adalah root component. Bertanggung jawab atas:

- **State global**: `snapshot: RuntimeAppSnapshot`, `activeTab: string`, `settings: OperatorSettings`, `loading: boolean`, `error: string | null`
- **Poller**: `setInterval` 5000ms (atau dari settings), guard agar tidak overlap request, stop di `disconnectedCallback`
- **Settings**: baca dari localStorage saat `connectedCallback`, tulis sinkron saat berubah
- **Theming**: terapkan `data-theme-mode` ke `document.documentElement`, listen `prefers-color-scheme` jika mode `system`
- **Layout**: sidebar (nav + env info + theme toggle) + main (tab content)

```
AgentRuntimeShell
├── <aside>
│   ├── branding
│   ├── <nav> (7 nav items)
│   ├── env info card
│   └── theme toggle button
└── <main>
    ├── loading skeleton (saat fetch)
    ├── error banner (saat fetch gagal)
    └── <agent-view-{activeTab}> (slot aktif)
```

Setiap view component menerima `snapshot` sebagai property dan memancarkan events untuk aksi (approve, retry, execute directive).

### View Components

Setiap view adalah Lit component terpisah. Menerima `snapshot` via property, emit custom events ke App_Shell untuk aksi yang butuh API call.

| Component | Custom Element | Input | Events |
|---|---|---|---|
| `dashboard.ts` | `<agent-view-dashboard>` | `snapshot` | — |
| `projects.ts` | `<agent-view-projects>` | `snapshot` | — |
| `approvals.ts` | `<agent-view-approvals>` | `snapshot` | `approval-respond` |
| `jobs.ts` | `<agent-view-jobs>` | `snapshot` | `job-retry` |
| `messages.ts` | `<agent-view-messages>` | `snapshot` | `message-retry` |
| `audit.ts` | `<agent-view-audit>` | `snapshot` | — |
| `directive.ts` | `<agent-view-directive>` | `snapshot` | `directive-execute` |

App_Shell menangani semua API calls. View components hanya render dan emit events.

---

## Data Flow

### Polling Loop

```
connectedCallback
  → loadSettings()
  → applyTheme()
  → fetchSnapshot()   ← immediate
  → startPoller()     ← setInterval(fetchSnapshot, pollIntervalMs)

fetchSnapshot()
  if (this._fetching) return          // guard overlap
  this._fetching = true
  try:
    res = await fetch('/api/snapshot')
    if (!res.ok) throw error
    this.snapshot = await res.json()
    this.error = null
  catch:
    this.error = message
  finally:
    this._fetching = false

disconnectedCallback
  → clearInterval(this._pollerId)
```

### Action Flow (Approvals, Jobs, Messages, Directive)

```
View emits event  →  App_Shell handler
  → if requires_confirmation: show confirm dialog
  → POST /api/{resource}/{id}/{action}
  → if response.requires_confirmation: show confirm dialog, resend with confirm: true
  → fetchSnapshot() untuk refresh data
```

### Settings Persistence

```typescript
interface OperatorSettings {
  theme: 'dark' | 'light'
  themeMode: 'system' | 'light' | 'dark'
  activeTab: string
  pollIntervalMs: number
}

const SETTINGS_KEY = 'agentai01.operator.settings.v1'
const DEFAULTS: OperatorSettings = {
  theme: 'dark',
  themeMode: 'system',
  activeTab: 'dashboard',
  pollIntervalMs: 5000,
}
```

Baca: `JSON.parse(localStorage.getItem(SETTINGS_KEY))` dengan fallback ke `DEFAULTS` jika null atau parse error.  
Tulis: `localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))` sinkron setiap kali settings berubah.

---

## Theming

CSS variables didefinisikan di `base.css` dengan dua set: `:root[data-theme-mode="dark"]` dan `:root[data-theme-mode="light"]`. App_Shell menerapkan atribut ke `document.documentElement`.

```css
/* base.css */
:root[data-theme-mode="dark"] {
  --bg: #0b0c10;
  --bg-accent: #13151b;
  --bg-elevated: #1a1d23;
  --card: #161920;
  --ink: #f4f4f5;
  --text: #d4d4d8;
  --muted: #838387;
  --accent: #10b981;
  --ok: #22c55e;
  --warn: #f59e0b;
  --danger: #ef4444;
  --line: rgba(255,255,255,0.08);
}

:root[data-theme-mode="light"] {
  --bg: #f8f9fa;
  --bg-accent: #ffffff;
  --bg-elevated: #f1f3f5;
  --card: #ffffff;
  --ink: #111827;
  --text: #374151;
  --muted: #9ca3af;
  --accent: #059669;
  --ok: #16a34a;
  --warn: #d97706;
  --danger: #dc2626;
  --line: rgba(0,0,0,0.08);
}
```

Mode `system`: App_Shell listen `window.matchMedia('(prefers-color-scheme: dark)')` dan update `data-theme-mode` saat berubah.

---

## Vite Configuration

```typescript
// vite.config.ts
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
```

---

## Bun Server Changes

File yang diubah: `src/runtime-app/http/server.ts` (atau handler utama).

Tambahkan static file handler sebelum API routes:

```typescript
// pseudo-code
const DIST_DIR = resolve(import.meta.dir, '../ui/dist')

function serveStatic(path: string): Response {
  const indexPath = join(DIST_DIR, 'index.html')
  if (!existsSync(indexPath)) {
    return new Response(UI_NOT_BUILT_HTML, { status: 503, headers: { 'Content-Type': 'text/html' } })
  }
  const filePath = join(DIST_DIR, path)
  if (existsSync(filePath) && !isDirectory(filePath)) {
    return new Response(Bun.file(filePath))  // Bun auto-sets Content-Type
  }
  return new Response(Bun.file(indexPath))   // SPA fallback
}
```

API routes (`/health`, `/ready`, `/api/*`) tetap diproses sebelum static handler.

---

## TypeScript Types

```typescript
// src/runtime-app/ui/src/types/snapshot.ts
// Mirror dari src/runtime-app/state.ts — update bersama jika state berubah

export interface RuntimeAppSnapshot {
  environment: {
    ai_model: string
    port: number | string
    app_env: string
  }
  dashboard: {
    kpis: {
      active_project_count: number
      pending_approval_count: number
      active_job_count: number
    }
    operational_issues: Array<{ summary: string; severity: string }>
    health_status: 'ok' | 'warn' | 'danger'
  }
  projects: Array<{
    id: string
    client_id: string
    lifecycle_state: string
    assigned_agents: string[]
  }>
  approvals: Array<{
    id: string
    project_id: string
    description: string
    requested_by: string
    status: 'pending' | 'approved' | 'rejected' | 'revised'
  }>
  jobs: Array<{
    id: string
    kind: string
    status: 'queued' | 'running' | 'completed' | 'failed'
    created_at: string
  }>
  messages: Array<{
    id: string
    from: string
    to: string
    message_type: string
    project_id: string
    timestamp: string
    status?: 'ok' | 'rejected'
  }>
  audit: Array<{
    id: string
    action: string
    actor: string
    timestamp: string
    detail?: string
  }>
}
```

---

## Build & Dev Scripts (package.json root)

```json
{
  "scripts": {
    "ui:dev": "cd src/runtime-app/ui && npm run dev",
    "ui:build": "cd src/runtime-app/ui && npm run build",
    "ui:check": "cd src/runtime-app/ui && npm run check"
  }
}
```

`npm run check` di root sudah ada — pastikan juga memeriksa `src/runtime-app/ui/src/**/*.ts`.

---

## Dev Mode Stub

Saat `Vite_Dev_Server` berjalan tanpa Bun_Server, App_Shell mendeteksi via `import.meta.env.DEV` dan menggunakan mock snapshot jika fetch `/api/snapshot` gagal (network error). Mock data disimpan di `src/runtime-app/ui/src/types/snapshot.mock.ts` — tidak di-bundle ke production build.

---

## Confirmation Dialog

Untuk aksi yang mengembalikan `requires_confirmation: true`, App_Shell menampilkan dialog native (`window.confirm`) atau custom `<dialog>` element. Jika operator konfirmasi, request dikirim ulang dengan body `{ ...original, confirm: true }`.

Aksi destruktif yang selalu butuh konfirmasi sebelum API call: `reject`, `revise`.

---

## Aksesibilitas

- Gunakan `<nav>`, `<main>`, `<section>`, `<button>` — bukan `<div>` untuk elemen interaktif
- Setiap `<button>` punya label yang deskriptif atau `aria-label`
- Loading state: skeleton cards atau `aria-busy="true"` pada container
- Error state: `role="alert"` pada error banner
- Status badge menggunakan warna + teks (tidak hanya warna)
- Tab navigation: `tabindex` natural, tidak ada focus trap kecuali di dialog

---

## Constraints

- Tidak ada framework selain Lit — tidak ada React, Vue, atau Alpine
- Tidak ada `any` atau `@ts-nocheck` di kode UI
- CSS hanya via Lit `css` tagged template atau `base.css` — tidak ada inline style kecuali untuk nilai dinamis
- Semua API calls dari App_Shell — view components tidak boleh fetch langsung
- `dist/` tidak di-commit ke git (tambahkan ke `.gitignore`)
