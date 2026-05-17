# Dependency Integration Phase 1-5

Tanggal: 2026-05-17

## Scope implemented

- CLI/operator foundation:
  - `commander`, `chalk`, `@clack/core`, `@clack/prompts`
  - Surface: `src/cli/operatorCli.ts`
- Config/auth foundation:
  - `dotenv`, `yaml`, `js-yaml`, `jose`
  - Surface: `src/config/dotenv-loader.ts`, `src/config/yaml-config.ts`, `src/config/token-verifier.ts`
- Scheduler/queue foundation:
  - `cron`, `croner`, `p-queue`
  - Surface: `src/runtime-app/scheduler/registry.ts`, `src/runtime-app/queue/concurrencyLimiter.ts`
- HTTP/realtime transport:
  - `express`, `hono`, `ws`, `eventemitter3`
  - Surface: `src/runtime-app/transport/http/expressApp.ts`, `src/runtime-app/transport/http/honoRoutes.ts`, `src/runtime-app/transport/realtime/*`
- Telegram hardening:
  - `@grammyjs/runner`, `@grammyjs/transformer-throttler`
  - Surface: `src/runtime-app/telegram/runner.ts`
- Observability:
  - `pino`, `pino-pretty`
  - Surface: `src/runtime-app/diagnostics/logger.ts`
- HTTP/search:
  - `axios`, `tavily`
  - Surface: `src/http/axios-client.ts`, `src/web-search/providers/tavily-sdk.ts`
- Storage:
  - `better-sqlite3`, `kysely`, `postgres`, `sqlite-vec`
  - Surface: `src/runtime-app/storage/sql/*`, `src/runtime-app/storage/vector/sqliteVecIndex.ts`
- Media/document tooling:
  - `file-type`, `pdf-lib`, `pdfjs-dist`, `node-html-parser`, `jszip`
  - Surface: `src/runtime-app/tools/documents/*`, `src/web-fetch/html-fallback-parser.ts`
- External integrations:
  - `@octokit/rest`, `@slack/web-api`, `@notionhq/client`, `googleapis`, `stripe`, `nodemailer`, `web-push`, `@google/genai`, `@modelcontextprotocol/sdk`
  - Surface: `src/runtime-app/integrations/*`, `src/runtime-app/providers/google-genai/googleGenAiAdapter.ts`
- Existing provider already formalized:
  - `elevenlabs`
  - Surface: `src/runtime-app/providers/tts/elevenlabsProvider.ts`

## Mapping package -> capability

- `commander` -> operator command routing
- `chalk` -> terminal status rendering
- `@clack/core`, `@clack/prompts` -> interactive confirmation flow
- `dotenv` -> env bootstrap parser
- `yaml` -> modern YAML parse path
- `js-yaml` -> legacy-compatible YAML parse path
- `jose` -> JWT signing/verification helper
- `cron` -> compatibility recurring job engine
- `croner` -> default recurring job engine
- `p-queue` -> concurrency-limited work queue
- `express` -> operator HTTP shell
- `hono` -> micro-route composition
- `ws` -> operator websocket hub
- `eventemitter3` -> local operator event bus
- `@grammyjs/runner` -> long-running Telegram runner handle
- `@grammyjs/transformer-throttler` -> Telegram API throttling
- `pino`, `pino-pretty` -> structured vs pretty runtime-app logging
- `axios` -> normalized HTTP client
- `tavily` -> SDK-backed web search provider
- `better-sqlite3`, `kysely` -> SQLite fact store
- `postgres` -> optional Postgres runtime adapter
- `sqlite-vec` -> vector backend availability detection
- `file-type` -> binary MIME sniffing
- `pdf-lib` -> PDF generation
- `pdfjs-dist` -> PDF read summary
- `node-html-parser` -> HTML fallback parsing
- `jszip` -> archive inspection
- `@octokit/rest` -> GitHub repo adapter
- `@slack/web-api` -> Slack postMessage adapter
- `@notionhq/client` -> Notion page creation adapter
- `googleapis` -> Google Drive about adapter
- `stripe` -> checkout session adapter
- `nodemailer` -> email delivery adapter
- `web-push` -> web push adapter
- `@google/genai` -> Google GenAI text adapter
- `@modelcontextprotocol/sdk` -> in-memory MCP ping pair

## Deferred list

- Tidak ada dependency di spec ini yang dibiarkan unchecked setelah rollout ini.
- Catatan implementasi: `src/runtime-app/storage/sql/sqliteDriver.ts` fallback ke memory store bila native binding `better-sqlite3` belum tersedia di environment saat test/runtime lokal.

## Verification evidence

- `npm run check`
  - clean, zero TypeScript errors
- Focused tests
  - `bun test src/cli/operatorCli.test.ts src/config/dependencyIntegration.test.ts src/runtime-app/queue/concurrencyLimiter.test.ts src/runtime-app/scheduler/registry.test.ts src/runtime-app/transport/transport.test.ts src/runtime-app/telegram/runner.test.ts src/runtime-app/diagnostics/logger.test.ts src/http/axios-client.test.ts src/web-search/providers/tavily-sdk.test.ts src/runtime-app/storage/sql/sqliteDriver.test.ts src/runtime-app/storage/sql/postgresDriver.test.ts src/runtime-app/storage/vector/sqliteVecIndex.test.ts src/runtime-app/tools/documents/documents.test.ts src/runtime-app/integrations/integrations.test.ts`
  - result: 44 pass, 0 fail
- Smoke
  - `npm run runtime:smoke`
  - ready status 200, provider request success, scenario completed without regression
