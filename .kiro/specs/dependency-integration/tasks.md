# Tasks — Dependency Integration

## Aturan Global

- Semua implementasi harus punya behavior nyata, bukan import kosong.
- Semua file TypeScript baru wajib ESM strict dan suffix `.js` untuk relative imports.
- Dilarang `any`, `@ts-nocheck`, `throw new Error('not implemented')`, atau `// TODO` di production path.
- Semua adapter eksternal harus support injection atau mockable boundary untuk test.
- Secrets dan token tidak boleh pernah tampil raw di log, UI, atau test snapshot.

## Status Markers

- `[ ]` = Belum dikerjakan
- `[~]` = In progress
- `[x]` = Selesai

---

## Phase 1 — Operator, Config, Scheduler

### [x] Task 1.1 — Operator CLI Foundation

Dependencies:
- `commander`
- `chalk`
- `@clack/core`
- `@clack/prompts`

Yang harus dihasilkan:
- CLI entry/operator command routing berbasis `commander`
- terminal rendering helper berbasis `chalk`
- interactive confirmation/setup flow berbasis `@clack/prompts`
- non-interactive safe mode untuk CI/script usage

Verifikasi:
- `npm run check`
- focused CLI tests

### [x] Task 1.2 — Env and Structured Config Integration

Dependencies:
- `dotenv`
- `yaml`
- `js-yaml`
- `jose`

Yang harus dihasilkan:
- env bootstrap loader
- YAML config parsing helper
- clear split antara modern YAML path dan legacy-compatible parser path
- token/JWT verification helper berbasis `jose`

Verifikasi:
- `npm run check`
- focused config/auth tests

### [x] Task 1.3 — Scheduler and Queue Foundation

Dependencies:
- `cron`
- `croner`
- `p-queue`

Yang harus dihasilkan:
- scheduler registry
- recurring job abstractions
- concurrency-limited background queue
- documented role split atau consolidation antara `cron` dan `croner`

Verifikasi:
- `npm run check`
- focused scheduler/queue tests

---

## Phase 2 — Transport and Observability

### [x] Task 2.1 — HTTP and Operator Transport Layer

Dependencies:
- `express`
- `hono`
- `ws`
- `eventemitter3`

Yang harus dihasilkan:
- operator server layering decision
- optional websocket event hub
- local runtime event bus
- tests untuk route/event behavior

Verifikasi:
- `npm run check`
- transport-focused tests

### [x] Task 2.2 — Telegram Runtime Hardening

Dependencies:
- `@grammyjs/runner`
- `@grammyjs/transformer-throttler`

Yang harus dihasilkan:
- long-running runner integration untuk Telegram bot
- throttling policy wrapper
- safe shutdown/restart behavior

Verifikasi:
- `npm run check`
- Telegram-focused tests

### [x] Task 2.3 — Observability Adapter

Dependencies:
- `pino`
- `pino-pretty`

Yang harus dihasilkan:
- adapter dari logging stack sekarang ke `pino`
- pretty transport untuk dev
- structured transport untuk production-like mode

Verifikasi:
- `npm run check`
- focused diagnostics/logging tests

### [x] Task 2.4 — HTTP Client Rationalization

Dependencies:
- `axios`
- `tavily`

Yang harus dihasilkan:
- keputusan teknis kapan memakai `axios`
- one clear Tavily primary integration path
- normalized error handling

Verifikasi:
- `npm run check`
- focused search/http tests

---

## Phase 3 — Storage and Media

### [x] Task 3.1 — SQLite and Typed Query Layer

Dependencies:
- `better-sqlite3`
- `kysely`

Yang harus dihasilkan:
- SQLite driver wrapper
- typed query/repository layer
- storage integration tests

Verifikasi:
- `npm run check`
- storage-focused tests

### [x] Task 3.2 — Postgres Runtime Support

Dependencies:
- `postgres`

Yang harus dihasilkan:
- optional Postgres adapter
- runtime config bridge
- graceful missing-config path

Verifikasi:
- `npm run check`
- focused Postgres adapter tests

### [x] Task 3.3 — Vector Storage Extension

Dependencies:
- `sqlite-vec`

Yang harus dihasilkan:
- vector index adapter untuk SQLite mode
- compatibility story dengan memory/vector backends yang sudah ada

Verifikasi:
- `npm run check`
- vector-store tests

### [x] Task 3.4 — Document and Binary Tooling

Dependencies:
- `file-type`
- `pdf-lib`
- `pdfjs-dist`
- `node-html-parser`
- `jszip`

Yang harus dihasilkan:
- binary type inspection helper
- PDF read helper
- PDF write/manipulation helper
- archive inspection helper
- lightweight HTML parse fallback

Verifikasi:
- `npm run check`
- focused document/media tests

---

## Phase 4 — External Integrations

### [x] Task 4.1 — GitHub and Slack Adapters

Dependencies:
- `@octokit/rest`
- `@slack/web-api`

Yang harus dihasilkan:
- typed GitHub adapter
- typed Slack adapter
- config validation

Verifikasi:
- `npm run check`
- adapter tests with mocked clients

### [x] Task 4.2 — Notion and Google Adapters

Dependencies:
- `@notionhq/client`
- `googleapis`

Yang harus dihasilkan:
- Notion adapter
- Google adapter surface
- runtime-safe credential handling

Verifikasi:
- `npm run check`
- mocked integration tests

### [x] Task 4.3 — Billing, Email, and Push Adapters

Dependencies:
- `stripe`
- `nodemailer`
- `web-push`

Yang harus dihasilkan:
- billing adapter
- email delivery adapter
- push notification adapter

Verifikasi:
- `npm run check`
- mocked adapter tests

### [x] Task 4.4 — Speech and Model Provider Expansion

Dependencies:
- `elevenlabs`
- `@google/genai`

Yang harus dihasilkan:
- ElevenLabs provider usage formalized under speech/provider surfaces
- Google GenAI native adapter path
- provider selection and error normalization

Verifikasi:
- `npm run check`
- provider-focused tests

### [x] Task 4.5 — MCP Typed Integration

Dependencies:
- `@modelcontextprotocol/sdk`

Yang harus dihasilkan:
- typed MCP integration layer
- config validation
- local test harness or mocked transport boundary

Verifikasi:
- `npm run check`
- MCP-focused tests

---

## Phase 5 — Final Audit

### [x] Task 5.1 — Dependency Usage Audit

Yang harus dihasilkan:
- mapping package → capability surface
- explicit deferred list untuk dependency yang tetap belum diaktifkan
- summary bukti package mana yang benar-benar aktif

Verifikasi:
- `npm run check`
- grep/import audit as needed

### [x] Task 5.2 — Final Integration Verification

Yang harus diverifikasi:
- typecheck clean
- focused tests per cluster clean
- `npm run runtime:smoke` tidak regress
- tidak ada adapter baru yang menyimpan raw secret di output/log

Verifikasi:
- `npm run check`
- `bun test <relevant files>`
- `npm run runtime:smoke`
