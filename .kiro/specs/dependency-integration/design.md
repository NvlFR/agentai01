# Design Document — Dependency Integration

## Overview

Dokumen ini mendeskripsikan bagaimana dependencies yang sudah tersedia di `package.json` diaktifkan menjadi capability nyata di `agentai01`. Fokusnya adalah integrasi bertahap, berbasis domain, dan tetap selaras dengan arsitektur runtime yang sudah ada.

Spec ini tidak mengharuskan semua package dipakai sekaligus dalam satu commit. Sebaliknya, design ini membagi implementasi ke beberapa workstream yang bisa dikerjakan bertahap sambil menjaga `npm run check`, `bun test`, dan `npm run runtime:smoke` tetap terkontrol.

---

## Principles

- Setiap dependency harus punya owner module yang jelas.
- Tidak ada “usage palsu” berupa import kosong atau helper tanpa consumer.
- Package overlap harus diputuskan secara eksplisit, bukan dibiarkan redundan.
- Semua adapter eksternal harus bisa diuji dengan injection atau mock client.
- Fitur baru harus masuk ke layer yang tepat, bukan menembus core domain tanpa alasan.

---

## Workstreams

### 1. Operator and CLI

Packages:
- `commander`
- `chalk`
- `@clack/core`
- `@clack/prompts`

Target surfaces:

```
src/cli/
  commands/
    doctor.ts
    runtime.ts
    integrations.ts
  render/
    terminal-theme.ts
    prompts.ts
```

Design:
- `commander` menjadi router command utama untuk operator CLI.
- `chalk` dipakai untuk rendering status, warning, dan success state.
- `@clack/prompts` dipakai untuk guided setup dan destructive confirmation.
- `@clack/core` dipakai hanya jika dibutuhkan untuk flow interaktif yang lebih custom.

---

### 2. HTTP, API, and Realtime Transport

Packages:
- `express`
- `hono`
- `ws`
- `@grammyjs/runner`
- `@grammyjs/transformer-throttler`
- `eventemitter3`

Target surfaces:

```
src/runtime-app/
  transport/
    http/
      express-app.ts
      hono-routes.ts
    realtime/
      operator-events.ts
      websocket-hub.ts
  telegram/
    runner.ts
    throttling.ts
```

Design:
- `express` tetap cocok untuk operator server utama yang stateful dan existing.
- `hono` dipakai untuk lightweight route composition atau future tool/micro-endpoint surfaces.
- `ws` dipakai untuk operator event streaming atau live diagnostics.
- `eventemitter3` menjadi local event bus di runtime-app transport layer.
- `@grammyjs/runner` dan throttler diaktifkan di bot runtime agar polling/update handling lebih robust.

Decision boundary:
- Jangan jalankan server Express dan Hono paralel tanpa boundary yang jelas.
- Hono sebaiknya jadi route composition layer atau sub-surface, bukan server duplikat penuh.

---

### 3. Scheduling and Work Execution

Packages:
- `cron`
- `croner`
- `p-queue`

Target surfaces:

```
src/runtime-app/
  scheduler/
    registry.ts
    recurring-jobs.ts
  queue/
    work-queue.ts
    concurrency-limiter.ts
```

Design:
- `croner` jadi default scheduler modern untuk recurring runtime jobs.
- `cron` dipertahankan hanya bila ada compatibility use case yang memang perlu `CronJob`.
- `p-queue` dipakai untuk IO-heavy fanout tasks seperti provider warmup, integration sync, atau batch delivery.

---

### 4. Persistence and Storage

Packages:
- `better-sqlite3`
- `kysely`
- `postgres`
- `sqlite-vec`

Target surfaces:

```
src/runtime-app/storage/
  sql/
    sqlite-driver.ts
    postgres-driver.ts
    schema.ts
    migrations.ts
  vector/
    sqlite-vec-index.ts
```

Design:
- `better-sqlite3` digunakan untuk local-first runtime state dan fast embedded SQL operations.
- `kysely` jadi typed query layer agar storage code tidak tersebar sebagai raw SQL.
- `postgres` disiapkan untuk mode non-local atau external persistence.
- `sqlite-vec` hanya diaktifkan bila vector search dibutuhkan pada SQLite mode.

Constraint:
- Semua driver harus diakses lewat repository/storage adapter.
- Jangan campur direct DB calls ke agent runtime atau plugin core.

---

### 5. Config, Auth, and Structured Documents

Packages:
- `dotenv`
- `yaml`
- `js-yaml`
- `jose`

Target surfaces:

```
src/config/
  dotenv-loader.ts
  yaml-config.ts
  token-verifier.ts
```

Design:
- `dotenv` dipakai untuk bootstrap env loading yang konsisten.
- `yaml` dipakai untuk runtime config documents yang modern dan typed parsing path.
- `js-yaml` hanya dipertahankan jika dibutuhkan oleh legacy-compatible scripts/tooling.
- `jose` dipakai untuk signed token, JWT verification, atau JWK-backed auth extensions.

---

### 6. Media and Document Tooling

Packages:
- `file-type`
- `pdf-lib`
- `pdfjs-dist`
- `node-html-parser`
- `jszip`

Target surfaces:

```
src/runtime-app/tools/
  documents/
    pdf-read.ts
    pdf-write.ts
    archive-inspect.ts
    binary-detect.ts
src/web-fetch/
  html-fallback-parser.ts
```

Design:
- `pdfjs-dist` dipakai untuk extraction/read path.
- `pdf-lib` dipakai untuk write/merge/manipulate path.
- `file-type` dipakai untuk binary sniffing sebelum processing.
- `jszip` dipakai untuk archive inspection/export packaging.
- `node-html-parser` dipakai sebagai lighter fallback HTML parse path saat readability flow tidak cocok.

---

### 7. External Integrations

Packages:
- `@modelcontextprotocol/sdk`
- `@notionhq/client`
- `@octokit/rest`
- `@slack/web-api`
- `googleapis`
- `stripe`
- `nodemailer`
- `elevenlabs`
- `web-push`
- `@google/genai`

Target surfaces:

```
src/runtime-app/integrations/
  github/
  slack/
  notion/
  google/
  billing/
  email/
  push/
  mcp/
src/runtime-app/providers/
  gemini/
  elevenlabs/
```

Design:
- Setiap SDK mendapat adapter sendiri plus config reader.
- Integration adapters mengembalikan project-native result/error objects.
- `@google/genai` menjadi alternate provider adapter yang tidak bergantung pada OpenAI-compatible shim.
- `elevenlabs` dipakai untuk speech provider path.
- `@modelcontextprotocol/sdk` dipakai untuk MCP server/client integration yang typed.

---

### 8. Search and HTTP Client Layer

Packages:
- `axios`
- `tavily`

Target surfaces:

```
src/http/
  axios-client.ts
  retrying-client.ts
src/web-search/
  providers/
    tavily-sdk.ts
```

Design:
- `axios` dipakai bila ada benefit nyata seperti interceptors, upload progress, atau common response shaping.
- `fetch`/`undici` tetap dipakai untuk lightweight runtime paths.
- `tavily` SDK-based provider bisa coexist dengan current fetch implementation jika dibuktikan memberi value.

Decision:
- Jangan mempertahankan dua implementasi Tavily tanpa alasan. Pilih satu sebagai primary, yang lain hanya jika punya fallback/testing value.

---

### 9. Observability Stack

Packages:
- `pino`
- `pino-pretty`

Target surfaces:

```
src/runtime-app/diagnostics/
  pino-adapter.ts
  transport.ts
```

Design:
- `tslog` yang sudah ada bisa tetap jadi API ergonomics layer.
- `pino` dipakai sebagai structured sink untuk mode production/performance-sensitive logging.
- `pino-pretty` dipakai hanya pada local/dev transport.
- Harus ada adapter supaya field redaction dan correlation metadata tetap konsisten.

---

## Dependency-to-Surface Matrix

| Cluster | Dependencies | Primary Surface |
|---|---|---|
| CLI | `commander`, `chalk`, `@clack/*` | `src/cli/` |
| Transport | `express`, `hono`, `ws`, `@grammyjs/*`, `eventemitter3` | `src/runtime-app/transport/`, Telegram runtime |
| Scheduling | `cron`, `croner`, `p-queue` | `src/runtime-app/scheduler/`, `src/runtime-app/queue/` |
| Storage | `better-sqlite3`, `kysely`, `postgres`, `sqlite-vec` | `src/runtime-app/storage/`, memory/vector layers |
| Config/Auth | `dotenv`, `yaml`, `js-yaml`, `jose` | `src/config/` |
| Media | `file-type`, `pdf-lib`, `pdfjs-dist`, `node-html-parser`, `jszip` | tools, web-fetch, document utilities |
| Integrations | `@modelcontextprotocol/sdk`, `@notionhq/client`, `@octokit/rest`, `@slack/web-api`, `googleapis`, `stripe`, `nodemailer`, `elevenlabs`, `web-push`, `@google/genai` | `src/runtime-app/integrations/`, providers |
| Search/HTTP | `axios`, `tavily` | `src/http/`, `src/web-search/` |
| Observability | `pino`, `pino-pretty` | `src/runtime-app/diagnostics/` |

---

## Rollout Strategy

### Phase 1
- CLI foundation
- Scheduler and queue foundation
- Config/auth/documentation helpers

### Phase 2
- Transport/realtime foundation
- Logging/observability adapter
- Search/http normalization

### Phase 3
- Storage and vector backends
- Media/document tooling

### Phase 4
- External service adapters
- Telegram runner/throttling hardening
- MCP typed integration

---

## Verification Model

- Typecheck: `npm run check`
- Focused tests: `bun test <files>`
- Smoke test: `npm run runtime:smoke`
- Optional cluster checks:
  - CLI smoke
  - transport health checks
  - integration config validation
  - document/media round-trip behavior
