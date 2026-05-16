# Design Document — Plugin SDK Adaptation

## Overview

Dokumen ini mendeskripsikan arsitektur adaptasi dari `referensi/openclaw/src/` ke project `agentai01`. Tujuannya adalah mengisi semua module yang masih stub, memecah single-file monolitik ke sub-modules, dan menambahkan channel Telegram + WhatsApp sebagai implementasi nyata.

Semua adaptasi mengikuti prinsip: **pola diambil, platform-specific dibuang, kontrak reusable dipertahankan**.

---

## Layer Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  runtime-app/  (operator shell — HTTP, worker, scheduler, UI)   │
│  ┌──────────┐ ┌──────────┐ ┌────────────┐ ┌─────────────────┐  │
│  │ speech/  │ │generation│ │diagnostics/│ │  channels/      │  │
│  │ tts/stt  │ │ registry │ │ logger+    │ │  telegram/      │  │
│  └──────────┘ └──────────┘ │ health     │ │  whatsapp/      │  │
│                             └────────────┘ └─────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  plugin-sdk/   (plugin contracts, registry, loader, hot-reload) │
├─────────────────────────────────────────────────────────────────┤
│  provider-runtime/  sessions/  memory/  context-engine/         │
│  hooks/  flows/  tasks/  routing/  plugin-state/  tools/        │
├─────────────────────────────────────────────────────────────────┤
│  config/  security/  secrets/  logging/  infra/  shared/        │
│  utils/   web-fetch/  web-search/                               │
└─────────────────────────────────────────────────────────────────┘
```

Aturan dependency antar layer (tidak boleh dilanggar):
- Layer atas boleh import layer bawah, tidak sebaliknya
- `shared/` tidak boleh import dari module `src/` manapun
- `infra/` hanya boleh import dari `shared/`
- `agents/` hanya boleh cross ke core via `domain/` types dan `registry/` contracts

---

## Module Dependency Graph

```
shared
  └── infra
        ├── secrets
        │     └── security
        │           └── logging
        │                 └── config
        │                       └── provider-runtime
        │                             └── sessions
        │                             └── memory
        │                             └── context-engine
        │                             └── tools
        │                             └── hooks
        │                             └── flows
        │                             └── tasks
        │                             └── routing
        │                             └── plugin-state
        │                             └── plugin-sdk
        │                                   └── channels/telegram
        │                                   └── channels/whatsapp
        └── utils
              └── web-fetch
              └── web-search
```

---

## File Structure Per Module

### `src/shared/` (Req 5, 73)

```
src/shared/
├── result.ts          # Result<T,E>, Option<T>, ok, err, some, none
├── deferred.ts        # Deferred<T>, createDeferred
├── lazy.ts            # LazyAsync<T>, createLazyAsync
├── pagination.ts      # Page<T>, PageRequest, paginate
├── id.ts              # generateId, generateCorrelationId
├── time.ts            # formatIso8601, parseIso8601
├── coerce.ts          # coerceString, coerceNumber, coerceBoolean
├── guard.ts           # isString, isNumber, isBoolean, isRecord
├── deep.ts            # mapDeep, assertNever
└── index.ts           # re-exports only
```

### `src/infra/` (Req 4, 73)

```
src/infra/
├── fs.ts              # resolveInside, readFileSafe, writeFileAtomic
├── temp.ts            # createTempDirectory, TempDirectory
├── atomic.ts          # atomicWrite helper
└── index.ts           # re-exports only
```

### `src/utils/` (Req 74, 73)

```
src/utils/
├── fetch-timeout.ts   # fetchWithTimeout(url, options, timeoutMs)
├── safe-json.ts       # safeParseJson, safeStringifyJson
├── mask-api-key.ts    # maskApiKey(key) → "sk-ab...****"
├── timer-delay.ts     # sleep(ms), delay(ms)
├── with-timeout.ts    # withTimeout(promise, ms, message?)
├── queue-helpers.ts   # enqueue, dequeue, drain
├── run-with-concurrency.ts  # runWithConcurrency(tasks, limit)
├── parse-json-compat.ts     # parseJsonCompat(value)
├── usage-format.ts    # formatTokenUsage(usage)
├── chunk-items.ts     # chunkArray(arr, size)
└── index.ts           # re-exports only
```

### `src/logging/` (Req 6, 73)

```
src/logging/
├── logger.ts          # createLogger, Logger interface
├── redaction.ts       # redactSecrets, REDACT_PATTERNS
├── file-writer.ts     # createFileLogWriter(filePath)
├── subsystem.ts       # createSubsystemLogger(subsystem)
└── index.ts           # re-exports only
```

### `src/security/` (Req 7, 73)

```
src/security/
├── audit.ts           # createAuditTrail, AuditEvent
├── operator-token.ts  # validateOperatorToken, validateOperatorTokenMatch
├── dangerous-config.ts # detectDangerousConfig
├── sanitize.ts        # sanitizeInput, serializeAuditSafe
└── index.ts           # re-exports only
```

### `src/secrets/` (Req 8, 73)

```
src/secrets/
├── redact.ts          # redactSecret(value)
├── key-detect.ts      # isSecretKey(key)
└── index.ts           # re-exports only
```

### `src/config/` (Req 9, 73)

```
src/config/
├── parse.ts           # parseConfig, ConfigParseResult
├── readers.ts         # readString, readInteger, readBoolean, readObject
├── env-source.ts      # envSource(env)
├── runtime-app-bridge.ts  # (sudah ada)
└── index.ts           # re-exports only
```

### `src/provider-runtime/` (Req 10, 73)

```
src/provider-runtime/
├── execute.ts         # executeProviderOperation
├── circuit-breaker.ts # createCircuitBreaker, CircuitOpenError
├── retry.ts           # calculateRetryDelayMs, RetryStrategy
├── timeout.ts         # ProviderTimeoutError, withProviderTimeout
├── health.ts          # checkProviderHealth, ProviderRuntimeHealth
└── index.ts           # re-exports only
```

### `src/sessions/` (Req 13, 73)

```
src/sessions/
├── registry.ts        # SessionRegistry class
├── lifecycle.ts       # state machine transitions
├── transcript.ts      # appendTranscript, TranscriptEntry
└── index.ts           # re-exports only
```

### `src/memory/` (Req 14, 73)

```
src/memory/
├── store.ts           # write, read, list
├── migrate.ts         # migrate(namespace, migrations)
├── repair.ts          # repair(namespace)
├── path.ts            # sanitizeSegment, resolveNamespacePath
└── index.ts           # re-exports only
```

### `src/context-engine/` (Req 15, 73)

```
src/context-engine/
├── batch.ts           # buildContextBatch
├── score.ts           # scoreContextItem
├── estimate.ts        # estimateTokens
└── index.ts           # re-exports only
```

### `src/tools/` (Req 16, 73)

```
src/tools/
├── descriptor.ts      # validateToolDescriptor
├── availability.ts    # evaluateToolAvailability
├── plan.ts            # buildToolPlan
├── result.ts          # normalizeToolResult, normalizeToolError
└── index.ts           # re-exports only
```

### `src/hooks/` (Req 17, 73)

```
src/hooks/
├── registry.ts        # createHookRegistry, HookRegistry
├── handler.ts         # HookHandler, HookHandlerResult
└── index.ts           # re-exports only
```

### `src/flows/` (Req 18, 73)

```
src/flows/
├── engine.ts          # executeFlow
├── store.ts           # InMemoryFlowStateStore
├── validate.ts        # validateFlowDefinition
└── index.ts           # re-exports only
```

### `src/tasks/` (Req 19, 73)

```
src/tasks/
├── registry.ts        # TaskRegistry class
├── graph.ts           # dependency graph, cycle detection
├── transitions.ts     # valid state transitions
└── index.ts           # re-exports only
```

### `src/routing/` (Req 20, 73)

```
src/routing/
├── resolve.ts         # resolveRoute
├── dead-letter.ts     # DeadLetterQueue, routeOrDeadLetter
└── index.ts           # re-exports only
```

### `src/plugin-state/` (Req 21, 73)

```
src/plugin-state/
├── store.ts           # InMemoryPluginStateStore
├── migrate.ts         # migrate(key, targetVersion, migrations)
└── index.ts           # re-exports only
```

### `src/plugin-sdk/` (Req 23–44, 80)

```
src/plugin-sdk/
├── types.ts           # PluginManifest, ToolDefinition, Plugin, PluginAPI
├── plugin-entry.ts    # definePluginEntry, defineChannelPluginEntry
├── channel-core.ts    # createChatChannelPlugin, createChannelPluginBase
├── provider-entry.ts  # defineSingleProviderPlugin
├── memory-core.ts     # memory host re-exports
├── approval-renderers.ts  # buildApprovalPendingReplyPayload
├── keyed-async-queue.ts   # KeyedAsyncQueue, enqueueKeyedTask
├── lazy-value.ts      # createCachedLazyValueGetter
├── registry.ts        # createPluginRegistry
├── loader.ts          # createPluginLoader (zod validation)
├── hot-reload.ts      # watchExtensions (chokidar)
└── index.ts           # re-exports only
```

### `src/channels/telegram/` (Req 46–56, 70)

```
src/channels/telegram/
├── token.ts           # resolveTelegramToken
├── fetch.ts           # resolveTelegramTransport, normalizeTelegramApiRoot
├── normalize.ts       # normalizeTelegramMessagingTarget, looksLikeTelegramTargetId
├── update-offset-store.ts  # createTelegramUpdateOffsetStore
├── polling-status.ts  # createTelegramPollingStatusPublisher
├── error-policy.ts    # resolveTelegramErrorPolicy, shouldReportTelegramError
├── draft-chunking.ts  # resolveTelegramDraftStreamingChunking
├── draft-stream.ts    # createTelegramDraftStream, TelegramDraftStream
├── bot-updates.ts     # buildTelegramUpdateKey, createTelegramUpdateDedupeCache
├── send.ts            # sendTelegramText, sendTelegramMedia, sendTelegramPoll
└── index.ts           # re-exports only
```

### `src/channels/whatsapp/` (Req 57–69, 71)

```
src/channels/whatsapp/
├── normalize-target.ts    # normalizeWhatsAppMessagingTarget, isWhatsAppGroupJid
├── socket-timing.ts       # resolveWhatsAppSocketTiming
├── reconnect.ts           # resolveReconnectPolicy, resolveHeartbeatSeconds
├── group-session-key.ts   # resolveWhatsAppGroupSessionRoute
├── inbound/
│   ├── extract.ts         # extractWhatsAppMessageContent, resolveWhatsAppMessageKind
│   ├── access-control.ts  # checkInboundAccessControl
│   └── dedupe.ts          # claimInboundWhatsAppMessage, recordOutboundWhatsAppMessage
├── send.ts                # sendWhatsAppText, sendWhatsAppMedia, sendWhatsAppReaction
├── auth-store.ts          # resolveWebCredsPath, writeCredsJsonAtomically, enqueueCredsSave
├── connection-controller.ts  # createWhatsAppConnectionController, registry
├── auto-reply/
│   ├── monitor-state.ts   # createWhatsAppMonitorState
│   └── monitor/
│       └── process-message.ts  # processWhatsAppInboundMessage
└── index.ts               # re-exports only
```

### `src/web-fetch/` (Req 75)

```
src/web-fetch/
├── types.ts           # WebFetchResult, WebFetchOptions
├── runtime.ts         # fetchWebContent(url, options?)
├── content-extractors.ts  # extractReadableContent (readability + linkedom)
└── index.ts           # re-exports only
```

### `src/web-search/` (Req 76)

```
src/web-search/
├── types.ts           # WebSearchRequest, WebSearchResult (adapted from runtime-types.ts)
├── runtime.ts         # createWebSearchClient
├── providers/
│   ├── tavily.ts      # Tavily provider (TAVILY_API_KEY)
│   └── duckduckgo.ts  # DuckDuckGo fallback (no key)
└── index.ts           # re-exports only
```

### `src/runtime-app/speech/` (Req 77)

```
src/runtime-app/speech/
├── types.ts           # SpeechProvider, SynthesizeOptions, TranscribeOptions
├── provider.ts        # createOpenAICompatibleSpeechProvider
├── registry.ts        # createSpeechProviderRegistry
├── core.ts            # orchestration (sudah ada, perlu dilengkapi)
├── tts/               # (sudah ada)
└── stt/               # (sudah ada)
```

### `src/runtime-app/generation/` (Req 78)

```
src/runtime-app/generation/
├── types.ts           # GenerationType, GenerationRequest, GenerationResult, GenerationProvider
├── registry.ts        # createGenerationRegistry
├── providers/
│   └── openai-image.ts  # createOpenAIImageProvider (DALL-E)
└── index.ts           # re-exports only
```

### `src/runtime-app/diagnostics/` (Req 79)

```
src/runtime-app/diagnostics/
├── logger.ts          # createLogger(name), rootLogger (tslog)
├── health.ts          # createHealthState, HealthState
├── diagnosticsCore.ts # (sudah ada)
└── index.ts           # re-exports only
```

### `skills/` (Req 81)

```
skills/
├── web-search/
│   └── SKILL.md
└── summarize/
    └── SKILL.md
```

---

## Data Flow

### Inbound Telegram Message

```
Telegram API
  → polling (update-offset-store tracks last ID)
  → bot-updates.ts (dedup by update key)
  → normalize.ts (normalize chat ID)
  → channels/index.ts (normalizeChannelMessage)
  → security/operator-token.ts (auth check)
  → hooks/registry.ts (handleInbound)
  → routing/resolve.ts (resolveRoute → agent_type)
  → agents/<type>/flow.ts (process)
  → sessions/registry.ts (appendTranscript)
  → provider-runtime/execute.ts (AI call with retry + circuit breaker)
  → context-engine/batch.ts (token budget)
  → send.ts (sendTelegramText / draft-stream.ts for streaming)
```

### Inbound WhatsApp Message

```
Baileys socket event
  → inbound/dedupe.ts (claimInboundWhatsAppMessage)
  → inbound/access-control.ts (checkInboundAccessControl)
  → inbound/extract.ts (extractWhatsAppMessageContent)
  → auto-reply/monitor/process-message.ts (processWhatsAppInboundMessage)
  → routing/resolve.ts
  → agents/<type>/flow.ts
  → send.ts (sendWhatsAppText)
```

### Plugin Load Flow

```
extensions/<plugin-dir>/
  → plugin-sdk/loader.ts (validate manifest via zod)
  → plugin-sdk/registry.ts (register)
  → plugin-sdk/hot-reload.ts (chokidar watch → reload on change)
  → plugin-sdk/plugin-entry.ts (definePluginEntry → register tools/providers)
```

### Provider AI Call

```
agent flow
  → provider-runtime/execute.ts
      → circuit-breaker.ts (check if open)
      → timeout.ts (AbortSignal with timeoutMs)
      → retry.ts (exponential backoff on retryable errors)
      → openaiCompatibleProvider.ts (HTTP POST /v1/chat/completions)
      → context-engine/batch.ts (token budget enforcement)
```

---

## Implementation Phases

### Phase 1 — Foundation (Req 1–9, 73, 74)
Semua module yang menjadi dependency layer bawah. Harus selesai sebelum phase lain bisa dimulai.

| Module | Action | Priority |
|--------|--------|----------|
| `src/shared/` | Pecah ke 9 sub-files | P0 |
| `src/infra/` | Pecah ke 3 sub-files | P0 |
| `src/utils/` | Pecah ke 10 sub-files dari referensi | P0 |
| `src/logging/` | Pecah ke 4 sub-files | P0 |
| `src/security/` | Pecah ke 4 sub-files | P0 |
| `src/secrets/` | Pecah ke 2 sub-files | P0 |
| `src/config/` | Pecah ke 3 sub-files | P0 |

### Phase 2 — Core Runtime (Req 10–21, 73)
Module runtime yang dibutuhkan oleh agent flows dan channel processing.

| Module | Action | Priority |
|--------|--------|----------|
| `src/provider-runtime/` | Pecah ke 5 sub-files | P1 |
| `src/sessions/` | Pecah ke 3 sub-files | P1 |
| `src/memory/` | Pecah ke 4 sub-files | P1 |
| `src/context-engine/` | Pecah ke 3 sub-files | P1 |
| `src/tools/` | Pecah ke 4 sub-files | P1 |
| `src/hooks/` | Pecah ke 2 sub-files | P1 |
| `src/flows/` | Pecah ke 3 sub-files | P1 |
| `src/tasks/` | Pecah ke 3 sub-files | P1 |
| `src/routing/` | Pecah ke 2 sub-files | P1 |
| `src/plugin-state/` | Pecah ke 2 sub-files | P1 |

### Phase 3 — Plugin SDK (Req 23–44, 45, 80)
Plugin contract layer yang dibutuhkan oleh channel plugins.

| Module | Action | Priority |
|--------|--------|----------|
| `src/plugin-sdk/` | Implementasi penuh dari type-only ke 11 sub-files | P1 |

### Phase 4 — Channel Implementations (Req 46–56, 57–69, 70, 71)
Channel Telegram dan WhatsApp — keduanya saat ini 0 files.

| Module | Action | Priority |
|--------|--------|----------|
| `src/channels/telegram/` | Buat 10 sub-files dari scratch | P1 |
| `src/channels/whatsapp/` | Buat 12 sub-files dari scratch | P1 |

### Phase 5 — Utility Layers (Req 75, 76)
Web fetch dan web search dengan provider pattern.

| Module | Action | Priority |
|--------|--------|----------|
| `src/web-fetch/` | Pecah ke 3 sub-files, tambah content extraction | P2 |
| `src/web-search/` | Pecah ke 3 sub-files, tambah Tavily + DuckDuckGo providers | P2 |

### Phase 6 — Runtime App Layers (Req 72, 77, 78, 79)
Speech, generation, diagnostics, dan LanceDB embedding fix.

| Module | Action | Priority |
|--------|--------|----------|
| `src/runtime-app/diagnostics/` | Tambah logger.ts + health.ts | P2 |
| `src/runtime-app/speech/` | Tambah types.ts + provider.ts + registry.ts | P2 |
| `src/runtime-app/generation/` | Tambah types.ts + registry.ts + openai-image.ts | P2 |
| `src/runtime-app/memory/lancedb/` | Ganti placeholderEmbedding dengan real embedding | P2 |

### Phase 7 — Skills dan Verifikasi (Req 81, 82)
Skills baru dan verifikasi zero OpenClaw imports.

| Task | Action | Priority |
|------|--------|----------|
| `skills/web-search/SKILL.md` | Buat baru | P3 |
| `skills/summarize/SKILL.md` | Buat baru | P3 |
| Zero OpenClaw import check | `grep -r "from.*openclaw" src/` harus kosong | P3 |

---

## Key Design Decisions

### 1. Split Strategy untuk Single-File Modules
Setiap `index.ts` yang melebihi ~200 baris implementasi dipecah ke sub-files. `index.ts` hanya berisi re-exports. Ini memungkinkan:
- Import granular (`import { resolveInside } from '../infra/fs.js'`)
- Test per sub-file tanpa load seluruh module
- Circular dependency lebih mudah dideteksi

### 2. Telegram menggunakan grammy, bukan raw HTTP
`src/channels/telegram/` menggunakan `grammy` (sudah ada di `package.json`) untuk bot lifecycle, bukan raw HTTP polling. `send.ts` tetap menggunakan grammy Bot API. `fetch.ts` menyediakan custom transport untuk grammy.

### 3. WhatsApp menggunakan Baileys via session.runtime.ts
WhatsApp channel bergantung pada Baileys (`makeWASocket`) yang di-wrap oleh `connection-controller.ts`. Baileys tidak ada di `package.json` saat ini — perlu ditambahkan: `bun add baileys`.

### 4. Plugin SDK tidak copy OpenClaw types
`src/plugin-sdk/` mendefinisikan ulang kontrak yang lebih sederhana sesuai kebutuhan AgentAI01, bukan copy verbatim dari OpenClaw. Nama-nama OpenClaw-specific (`OpenClawPluginApi`, `OpenClawConfig`) diganti ke nama neutral (`PluginAPI`, `RuntimeConfig`).

### 5. LanceDB embedding menggunakan AI_BASE_URL
`lancedbMemoryBackend.ts` akan memanggil `${AI_BASE_URL}/embeddings` dengan `AI_API_KEY` untuk menghasilkan real embeddings. Embedding function diinjeksikan sebagai dependency agar bisa di-mock di test.

### 6. Adaptation comment wajib
Setiap file yang diadaptasi dari referensi wajib memiliki komentar di baris pertama:
```ts
// Adapted from referensi/openclaw/src/<path>
```

---

## Constraints

- **Tidak boleh edit `referensi/`** — read-only
- **TypeScript ESM strict** — semua import pakai `.js` extension suffix
- **Tidak ada `any`** — gunakan `unknown` + narrow adapters
- **Tidak ada `@ts-nocheck`** tanpa penjelasan
- **Setiap sub-file punya colocated `*.test.ts`**
- **`bun test` harus pass** sebelum module dianggap selesai
- **`npm run check` harus zero errors** setelah setiap phase
- **Zero import dari `openclaw/*`** setelah semua phase selesai

---

## Coverage Requirements yang Belum Tercakup di Atas

### Req 11 — Plugin SDK Core Types

`src/plugin-sdk/types.ts` mendefinisikan kontrak minimal:

```
PluginKind = 'provider' | 'channel' | 'tool' | 'runtime'
PluginContext = { plugin_id, project_id?, logger? }
ProviderPlugin = { kind: 'provider', complete(prompt, ctx) }
ChannelPlugin  = { kind: 'channel', send(msg, ctx) }
ToolPlugin     = { kind: 'tool', tools, execute(name, input, ctx) }
RuntimePlugin  = ProviderPlugin | ChannelPlugin | ToolPlugin
PluginFactory  = (ctx: PluginContext) => RuntimePlugin | Promise<RuntimePlugin>
```

Semua nama OpenClaw-specific (`OpenClawPluginApi`, `OpenClawConfig`) diganti ke nama neutral.

---

### Req 12 — Channels Module (`src/channels/`)

`src/channels/index.ts` yang sudah ada dipecah ke:

```
src/channels/
├── normalize.ts       # normalizeChannelMessage(input, defaults) → Result<ChannelMessage, string[]>
├── auth.ts            # authenticateChannelMessage(ctx, msg)
├── route.ts           # routeInboundMessage(adapter, input, hook)
├── health.ts          # createChannelHealth(channelId, status, detail, now)
├── attachment.ts      # normalizeAttachments(raw) → ChannelAttachment[]
└── index.ts           # re-exports only
```

---

### Req 22 — Test Infrastructure

Tidak ada file baru yang dibuat untuk req ini. Ini adalah **cross-cutting constraint** yang berlaku untuk semua module:

- Semua test menggunakan `bun test`
- Filesystem tests pakai `createTempDirectory()` dari `src/infra/temp.ts` + dispose di `afterEach`
- Time-dependent behavior pakai injected `now` parameter
- Tidak ada `setTimeout`/`setInterval` tanpa cleanup

Diverifikasi via `bun test` di setiap phase sebelum lanjut ke phase berikutnya.

---

### Req 25–43 — Plugin SDK Sub-Modules Detail

Semua masuk ke `src/plugin-sdk/` dengan file mapping:

| Req | File | Fungsi Utama |
|-----|------|--------------|
| 25 | `keyed-async-queue.ts` | `KeyedAsyncQueue`, `enqueueKeyedTask` |
| 26 | `approval-renderers.ts` | `buildApprovalPendingReplyPayload`, `buildApprovalResolvedReplyPayload` |
| 27 | `session-route.ts` | `buildChannelOutboundSessionRoute`, `buildThreadAwareOutboundSessionRoute`, `stripChannelTargetPrefix` |
| 28 | `provider-entry.ts` | `defineSingleProviderPlugin` |
| 29 | `memory-core.ts` | re-export memory host helpers, `buildMemorySystemPromptAddition` |
| 30 | `config-schema.ts` | `buildPluginConfigSchema`, `buildChannelConfigSchema`, `emptyPluginConfigSchema` |
| 31 | `channel-config-helpers.ts` | `clearAccountEntryFields`, `deleteAccountFromConfigSection`, `setAccountEnabledInConfigSection` |
| 32 | `secure-random.ts` | `generateSecureToken`, `generateSecureUuid`, `createDedupeCache` |
| 33 | `lazy-value.ts` | `createCachedLazyValueGetter`, `LazyValue<T>` |
| 34 | `gateway-utils.ts` | `resolveGatewayBindUrl`, `buildAgentSessionKey`, `resolveThreadSessionKeys` |
| 35 | `secret-file.ts` | `loadSecretFileSync`, `tryReadSecretFileSync`, `DEFAULT_SECRET_FILE_MAX_BYTES` |
| 36 | `subsystem-logger.ts` | `createSubsystemLogger(subsystem)` |
| 37 | `acp-binding.ts` | `resolveConfiguredAcpBindingRecord`, `ensureConfiguredAcpBindingReady` |
| 38 | `pairing-helpers.ts` | `formatPairingApproveHint`, `parseOptionalDelimitedEntries` |
| 39 | `action-gate.ts` | `createActionGate`, `readStringParam`, `readNumberParam`, `jsonResult` |
| 40 | `network-utils.ts` | `isTrustedProxyAddress`, `resolveClientIp`, `formatZonedTimestamp` |
| 41 | `runtime-handlers.ts` | `registerUncaughtExceptionHandler`, `registerUnhandledRejectionHandler`, `createNonExitingRuntime` |
| 42 | `backup-utils.ts` | `createBackupArchive`, `detectPluginInstallPathIssue` |
| 43 | `tailscale.ts` | `resolveTailnetHostWithRunner` |

Updated file structure `src/plugin-sdk/`:

```
src/plugin-sdk/
├── types.ts                  # Req 11 — core plugin contracts
├── plugin-entry.ts           # Req 23 — definePluginEntry, defineChannelPluginEntry
├── channel-core.ts           # Req 24 — createChatChannelPlugin, createChannelPluginBase
├── keyed-async-queue.ts      # Req 25
├── approval-renderers.ts     # Req 26
├── session-route.ts          # Req 27
├── provider-entry.ts         # Req 28
├── memory-core.ts            # Req 29
├── config-schema.ts          # Req 30
├── channel-config-helpers.ts # Req 31
├── secure-random.ts          # Req 32
├── lazy-value.ts             # Req 33
├── gateway-utils.ts          # Req 34
├── secret-file.ts            # Req 35
├── subsystem-logger.ts       # Req 36
├── acp-binding.ts            # Req 37
├── pairing-helpers.ts        # Req 38
├── action-gate.ts            # Req 39
├── network-utils.ts          # Req 40
├── runtime-handlers.ts       # Req 41
├── backup-utils.ts           # Req 42
├── tailscale.ts              # Req 43
├── registry.ts               # Req 80 — createPluginRegistry
├── loader.ts                 # Req 80 — createPluginLoader (zod)
├── hot-reload.ts             # Req 80 — watchExtensions (chokidar)
└── index.ts                  # Req 44 — barrel re-export semua
```

---

### Req 44 — Plugin SDK Index Barrel

`src/plugin-sdk/index.ts` hanya berisi re-exports dari semua 23 sub-files di atas. Tidak ada implementasi langsung di `index.ts`.

---

### Req 45 — No Stub Implementations

Ini adalah **enforcement constraint** yang berlaku di semua phase. Checklist per file sebelum dianggap selesai:

1. Tidak ada `export type {}` tanpa runtime exports
2. Tidak ada `() => {}` sebagai implementasi final
3. Tidak ada `throw new Error('not implemented')`
4. Test file ada dan exercise behavior nyata (bukan hanya `typeof fn === 'function'`)
5. `bun test` pass untuk file tersebut

---

### Req 70, 71 — Channel Dirs Kosong

Sudah tercakup di Phase 4. Ditambahkan ke phase table secara eksplisit:

| Module | Status | Action |
|--------|--------|--------|
| `src/channels/telegram/` | 0 files | Buat 10 sub-files (Req 46–55) + index (Req 56) |
| `src/channels/whatsapp/` | 0 files | Buat 12 sub-files (Req 57–68) + index (Req 69) |

Kedua channel ini adalah **blocker** untuk runtime-app Telegram bot dan WhatsApp channel di `src/runtime-app/channels/`.

---

### Req 73 — Core Modules Single-File Split

Semua module berikut perlu dipecah. Sudah tercakup di Phase 1 dan 2, tapi tabel lengkapnya:

| Module | Lines saat ini | Target sub-files |
|--------|---------------|-----------------|
| `src/shared/` | ~200 | 9 sub-files |
| `src/infra/` | ~100 | 3 sub-files |
| `src/logging/` | ~280 | 4 sub-files |
| `src/security/` | ~260 | 4 sub-files |
| `src/secrets/` | ~180 | 2 sub-files |
| `src/config/` | ~160 | 3 sub-files |
| `src/provider-runtime/` | ~290 | 5 sub-files |
| `src/sessions/` | ~220 | 3 sub-files |
| `src/memory/` | ~270 | 4 sub-files |
| `src/context-engine/` | ~145 | 3 sub-files |
| `src/tools/` | ~390 | 4 sub-files |
| `src/hooks/` | ~110 | 2 sub-files |
| `src/flows/` | ~210 | 3 sub-files |
| `src/tasks/` | ~245 | 3 sub-files |
| `src/routing/` | ~97 | 2 sub-files |
| `src/plugin-state/` | ~93 | 2 sub-files |
| `src/plugin-sdk/` | ~45 (type-only) | 23 sub-files |

Split rule: `index.ts` hanya re-exports. Semua implementasi di sub-files. Backward compatibility dijaga — semua existing imports via `index.ts` tetap valid.

---

### Req 80 — Plugin SDK Registry, Loader, Hot-Reload

Sudah masuk ke `src/plugin-sdk/registry.ts`, `loader.ts`, `hot-reload.ts` di tabel Req 25–43 di atas.

Dependency tambahan yang dibutuhkan:
- `chokidar` — sudah ada di `package.json`
- `zod` — sudah ada di `package.json`

---

### Req 82 — Zero OpenClaw Import Verification

Ini adalah **exit gate** untuk seluruh project. Dijalankan di akhir Phase 7:

```bash
# Semua harus output kosong
grep -r "from.*openclaw" src/ --include="*.ts"
grep -r "from.*@openclaw" src/ --include="*.ts"
grep -r "from.*@earendil" src/ --include="*.ts"

# Semua harus pass
npm run check
bun test
```

Jika ada yang masih import dari `openclaw/*`, file tersebut belum selesai diadaptasi dan harus dikembalikan ke phase yang sesuai.

---

## Requirements Coverage Matrix

| Req | Topik | Phase | File Target |
|-----|-------|-------|-------------|
| 1 | Adaptation rules | semua | cross-cutting |
| 2 | TS ESM strict | semua | cross-cutting |
| 3 | Colocated tests | semua | `*.test.ts` per sub-file |
| 4 | Infra | 1 | `src/infra/fs.ts`, `temp.ts`, `atomic.ts` |
| 5 | Shared | 1 | `src/shared/result.ts` … `deep.ts` |
| 6 | Logging | 1 | `src/logging/logger.ts` … `subsystem.ts` |
| 7 | Security | 1 | `src/security/audit.ts` … `sanitize.ts` |
| 8 | Secrets | 1 | `src/secrets/redact.ts`, `key-detect.ts` |
| 9 | Config | 1 | `src/config/parse.ts`, `readers.ts`, `env-source.ts` |
| 10 | Provider runtime | 2 | `src/provider-runtime/execute.ts` … `health.ts` |
| 11 | Plugin SDK core types | 3 | `src/plugin-sdk/types.ts` |
| 12 | Channels module | 2 | `src/channels/normalize.ts` … `attachment.ts` |
| 13 | Sessions | 2 | `src/sessions/registry.ts` … `transcript.ts` |
| 14 | Memory | 2 | `src/memory/store.ts` … `path.ts` |
| 15 | Context engine | 2 | `src/context-engine/batch.ts` … `estimate.ts` |
| 16 | Tools | 2 | `src/tools/descriptor.ts` … `result.ts` |
| 17 | Hooks | 2 | `src/hooks/registry.ts`, `handler.ts` |
| 18 | Flows | 2 | `src/flows/engine.ts` … `validate.ts` |
| 19 | Tasks | 2 | `src/tasks/registry.ts` … `transitions.ts` |
| 20 | Routing | 2 | `src/routing/resolve.ts`, `dead-letter.ts` |
| 21 | Plugin state | 2 | `src/plugin-state/store.ts`, `migrate.ts` |
| 22 | Test infra | semua | cross-cutting constraint |
| 23 | Plugin entry | 3 | `src/plugin-sdk/plugin-entry.ts` |
| 24 | Channel plugin builders | 3 | `src/plugin-sdk/channel-core.ts` |
| 25 | Keyed async queue | 3 | `src/plugin-sdk/keyed-async-queue.ts` |
| 26 | Approval renderers | 3 | `src/plugin-sdk/approval-renderers.ts` |
| 27 | Session route builders | 3 | `src/plugin-sdk/session-route.ts` |
| 28 | Provider entry helpers | 3 | `src/plugin-sdk/provider-entry.ts` |
| 29 | Memory host core | 3 | `src/plugin-sdk/memory-core.ts` |
| 30 | Config schema builders | 3 | `src/plugin-sdk/config-schema.ts` |
| 31 | Channel config helpers | 3 | `src/plugin-sdk/channel-config-helpers.ts` |
| 32 | Secure random + dedupe | 3 | `src/plugin-sdk/secure-random.ts` |
| 33 | Lazy value | 3 | `src/plugin-sdk/lazy-value.ts` |
| 34 | Gateway + routing utils | 3 | `src/plugin-sdk/gateway-utils.ts` |
| 35 | Secret file utils | 3 | `src/plugin-sdk/secret-file.ts` |
| 36 | Subsystem logger | 3 | `src/plugin-sdk/subsystem-logger.ts` |
| 37 | ACP binding | 3 | `src/plugin-sdk/acp-binding.ts` |
| 38 | Pairing helpers | 3 | `src/plugin-sdk/pairing-helpers.ts` |
| 39 | Action gate + tool helpers | 3 | `src/plugin-sdk/action-gate.ts` |
| 40 | Security + network utils | 3 | `src/plugin-sdk/network-utils.ts` |
| 41 | Runtime error handlers | 3 | `src/plugin-sdk/runtime-handlers.ts` |
| 42 | Backup + install path | 3 | `src/plugin-sdk/backup-utils.ts` |
| 43 | Tailscale | 3 | `src/plugin-sdk/tailscale.ts` |
| 44 | Plugin SDK index barrel | 3 | `src/plugin-sdk/index.ts` |
| 45 | No stubs | semua | cross-cutting enforcement |
| 46 | Telegram token | 4 | `src/channels/telegram/token.ts` |
| 47 | Telegram fetch transport | 4 | `src/channels/telegram/fetch.ts` |
| 48 | Telegram normalize | 4 | `src/channels/telegram/normalize.ts` |
| 49 | Telegram offset store | 4 | `src/channels/telegram/update-offset-store.ts` |
| 50 | Telegram polling status | 4 | `src/channels/telegram/polling-status.ts` |
| 51 | Telegram error policy | 4 | `src/channels/telegram/error-policy.ts` |
| 52 | Telegram draft chunking | 4 | `src/channels/telegram/draft-chunking.ts` |
| 53 | Telegram draft stream | 4 | `src/channels/telegram/draft-stream.ts` |
| 54 | Telegram update dedup | 4 | `src/channels/telegram/bot-updates.ts` |
| 55 | Telegram send | 4 | `src/channels/telegram/send.ts` |
| 56 | Telegram index | 4 | `src/channels/telegram/index.ts` |
| 57 | WhatsApp normalize target | 4 | `src/channels/whatsapp/normalize-target.ts` |
| 58 | WhatsApp socket timing | 4 | `src/channels/whatsapp/socket-timing.ts` |
| 59 | WhatsApp reconnect | 4 | `src/channels/whatsapp/reconnect.ts` |
| 60 | WhatsApp group session key | 4 | `src/channels/whatsapp/group-session-key.ts` |
| 61 | WhatsApp inbound extract | 4 | `src/channels/whatsapp/inbound/extract.ts` |
| 62 | WhatsApp access control | 4 | `src/channels/whatsapp/inbound/access-control.ts` |
| 63 | WhatsApp inbound dedup | 4 | `src/channels/whatsapp/inbound/dedupe.ts` |
| 64 | WhatsApp send | 4 | `src/channels/whatsapp/send.ts` |
| 65 | WhatsApp auth store | 4 | `src/channels/whatsapp/auth-store.ts` |
| 66 | WhatsApp connection controller | 4 | `src/channels/whatsapp/connection-controller.ts` |
| 67 | WhatsApp monitor state | 4 | `src/channels/whatsapp/auto-reply/monitor-state.ts` |
| 68 | WhatsApp process message | 4 | `src/channels/whatsapp/auto-reply/monitor/process-message.ts` |
| 69 | WhatsApp index | 4 | `src/channels/whatsapp/index.ts` |
| 70 | Telegram dir kosong | 4 | semua file di `src/channels/telegram/` |
| 71 | WhatsApp dir kosong | 4 | semua file di `src/channels/whatsapp/` |
| 72 | LanceDB placeholder embedding | 6 | `src/runtime-app/memory/lancedb/lancedbMemoryBackend.ts` |
| 73 | Core modules single-file | 1–3 | semua `index.ts` yang dipecah |
| 74 | Utils sub-modules | 1 | `src/utils/*.ts` |
| 75 | Web fetch | 5 | `src/web-fetch/runtime.ts`, `content-extractors.ts`, `types.ts` |
| 76 | Web search | 5 | `src/web-search/runtime.ts`, `providers/tavily.ts`, `providers/duckduckgo.ts` |
| 77 | Speech | 6 | `src/runtime-app/speech/types.ts`, `provider.ts`, `registry.ts` |
| 78 | Generation | 6 | `src/runtime-app/generation/types.ts`, `registry.ts`, `providers/openai-image.ts` |
| 79 | Diagnostics | 6 | `src/runtime-app/diagnostics/logger.ts`, `health.ts` |
| 80 | Plugin SDK registry/loader | 3 | `src/plugin-sdk/registry.ts`, `loader.ts`, `hot-reload.ts` |
| 81 | Skills | 7 | `skills/web-search/SKILL.md`, `skills/summarize/SKILL.md` |
| 82 | Zero OpenClaw imports | 7 | exit gate — grep check |
