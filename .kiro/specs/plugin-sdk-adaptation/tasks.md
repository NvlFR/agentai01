# Tasks — Plugin SDK Adaptation

## Aturan Global (berlaku untuk SEMUA task)

**Larangan keras di setiap task:**
- Dilarang menghasilkan file yang hanya berisi `export type {}` atau type definitions tanpa runtime code
- Dilarang menggunakan `throw new Error('not implemented')` sebagai implementasi final
- Dilarang menggunakan `() => {}` sebagai body function yang seharusnya punya behavior
- Dilarang meninggalkan `// TODO` di production code path — catat di `TODO.md` root jika benar-benar blocked
- Dilarang menggunakan `any`; gunakan real types, `unknown`, atau narrow adapter
- Dilarang import relatif tanpa suffix `.js` pada TypeScript ESM
- Dilarang copy platform-specific OpenClaw code (iOS, macOS native, browser extension, product-specific glue)
- Dilarang commit jika `npm run check` masih error
- Dilarang commit jika `bun test` masih failing untuk file yang disentuh

**Verifikasi wajib di setiap task:**
1. `npm run check` — zero TypeScript errors
2. `bun test <file>.test.ts` — semua test pass
3. **AI smoke test** — jalankan `npm run runtime:smoke` dan pastikan output tidak ada error baru yang disebabkan oleh perubahan task ini. Smoke test memanggil AI provider nyata via `AI_BASE_URL` + `AI_API_KEY`.

**Test dan boundary rules:**
- External boundary wajib pakai Zod atau schema helper yang sudah ada.
- Module parse/serialize wajib punya round-trip behavior test.
- Time-dependent behavior wajib pakai injected `now`, bukan `Date.now()` langsung di test.
- Timer, env, globals, mocks, dan temp dirs wajib dibersihkan.
- Filesystem test wajib pakai `createTempDirectory()` setelah tersedia.
- Index barrel hanya re-export; implementasi tetap di sub-file.

**Format bukti selesai:**
Setiap task dianggap selesai hanya jika ada bukti nyata:
- Output `npm run check` clean
- Output `bun test` semua pass
- Output `npm run runtime:smoke` tidak ada regression

---

## Phase 1 — Foundation Layer

> Semua task di phase ini harus selesai sebelum phase 2 dimulai.
> Dependency: tidak ada — ini adalah layer paling bawah.

---

### Task 1.1 — Pecah `src/shared/` ke Sub-Files

**Requirements:** Req 5, 73
**Referensi:** `referensi/openclaw/src/shared/` (baca pola, jangan copy)

**Yang harus dihasilkan:**
```
src/shared/result.ts       — Result<T,E>, Option<T>, ok, err, some, none
src/shared/deferred.ts     — Deferred<T>, createDeferred
src/shared/lazy.ts         — LazyAsync<T>, createLazyAsync
src/shared/pagination.ts   — Page<T>, PageRequest, paginate
src/shared/id.ts           — generateId, generateCorrelationId
src/shared/time.ts         — formatIso8601, parseIso8601
src/shared/text.ts         — normalizeWhitespace
src/shared/coerce.ts       — coerceString, coerceNumber, coerceBoolean
src/shared/guard.ts        — isString, isNumber, isBoolean, isRecord
src/shared/deep.ts         — mapDeep, assertNever
src/shared/index.ts        — re-exports only, TIDAK ADA implementasi
```

**Setiap file harus punya colocated `*.test.ts`** yang menguji behavior nyata, bukan hanya `typeof fn === 'function'`.

**Larangan spesifik task ini:**
- `src/shared/` dilarang import dari module `src/` manapun — hanya Node built-ins
- `index.ts` dilarang punya implementasi langsung — hanya `export * from './result.js'` dll
- Dilarang mengubah public API yang sudah ada di `index.ts` — backward compatible

**Verifikasi:**
1. `npm run check` clean
2. `bun test src/shared/` semua pass
3. `npm run runtime:smoke` — tidak ada regression (smoke test pakai `shared` secara tidak langsung)

---

### Task 1.2 — Pecah `src/infra/` ke Sub-Files

**Requirements:** Req 4, 73
**Referensi:** `referensi/openclaw/src/infra/` (baca pola fs-safe)

**Yang harus dihasilkan:**
```
src/infra/fs.ts       — resolveInside, readFileSafe, writeFileAtomic
src/infra/temp.ts     — createTempDirectory, TempDirectory type
src/infra/atomic.ts   — atomicWrite(path, content) helper internal
src/infra/index.ts    — re-exports only
```

**Behavior yang wajib ada (bukan stub):**
- `resolveInside(root, unsafePath)` — return `err(...)` jika path escape root, TIDAK throw
- `readFileSafe(path)` — return `Result<string, string>`, TIDAK throw untuk missing file
- `writeFileAtomic(path, content)` — tulis ke temp file dulu, lalu rename — TIDAK langsung write
- `createTempDirectory()` — return `{ path, dispose() }` — `dispose()` harus benar-benar hapus dir

**Larangan spesifik:**
- Dilarang `fs.writeFileSync` langsung tanpa atomic pattern
- Dilarang throw untuk file not found — harus return `err(...)`
- `infra/` hanya boleh import dari `shared/` dan Node built-ins

**Verifikasi:**
1. `npm run check` clean
2. `bun test src/infra/` — termasuk test path traversal attack (`../../etc/passwd` harus return err)
3. `npm run runtime:smoke` clean

---

### Task 1.3 [x] — Pecah `src/utils/` ke Sub-Files dari Referensi

**Requirements:** Req 74, 73
**Referensi:** `referensi/openclaw/src/utils/fetch-timeout.ts`, `mask-api-key.ts`, `timer-delay.ts`, `with-timeout.ts`, `queue-helpers.ts`, `run-with-concurrency.ts`, `parse-json-compat.ts`, `usage-format.ts`, `chunk-items.ts`

**Yang harus dihasilkan:**
```
src/utils/fetch-timeout.ts        — fetchWithTimeout(url, init, timeoutMs)
src/utils/safe-json.ts            — safeParseJson, safeStringifyJson
src/utils/mask-api-key.ts         — maskApiKey("sk-abcd1234") → "sk-ab...****"
src/utils/timer-delay.ts          — sleep(ms), delay(ms)
src/utils/with-timeout.ts         — withTimeout(promise, ms, message?)
src/utils/queue-helpers.ts        — enqueue, dequeue, drain
src/utils/run-with-concurrency.ts — runWithConcurrency(tasks, limit)
src/utils/parse-json-compat.ts    — parseJsonCompat(value)
src/utils/usage-format.ts         — formatTokenUsage({ input, output, total })
src/utils/chunk-items.ts          — chunkArray(arr, size)
src/utils/index.ts                — re-exports only
```

**Behavior wajib:**
- `maskApiKey("sk-abcd1234efgh")` → `"sk-ab...****"` (4 char pertama + mask)
- `maskApiKey("short")` → `"****"` (kurang dari 8 char → full mask)
- `runWithConcurrency([...10 tasks], 3)` → max 3 berjalan bersamaan, semua selesai
- `withTimeout(neverResolves, 100)` → reject setelah 100ms dengan pesan timeout
- `chunkArray([1,2,3,4,5], 2)` → `[[1,2],[3,4],[5]]`

**Larangan spesifik:**
- Dilarang import dari `openclaw/*` — gunakan native `fetch` + `AbortController`
- Setiap file harus ada komentar `// Adapted from referensi/openclaw/src/utils/<filename>.ts` di baris pertama

**Verifikasi:**
1. `npm run check` clean
2. `bun test src/utils/` semua pass
3. `grep -r "from.*openclaw" src/utils/` harus kosong
4. `npm run runtime:smoke` clean

---

### Task 1.4 [x] — Pecah `src/logging/` ke Sub-Files

**Requirements:** Req 6, 73

**Yang harus dihasilkan:**
```
src/logging/logger.ts      — createLogger(options), Logger interface
src/logging/redaction.ts   — redactSecrets(text), REDACT_PATTERNS
src/logging/file-writer.ts — createFileLogWriter(filePath)
src/logging/subsystem.ts   — createSubsystemLogger(subsystem, options?)
src/logging/index.ts       — re-exports only
```

**Behavior wajib:**
- `redactSecrets('Bearer sk-abc123')` → `'Bearer [REDACTED]'`
- `redactSecrets('{"api_key":"secret"}')` → `'{"api_key":"[REDACTED]"}'`
- Logger dengan level `warn` tidak boleh output `debug` atau `info`
- `createFileLogWriter(path)` harus append JSON per baris ke file
- `createSubsystemLogger('telegram/network')` harus bind subsystem ke setiap log entry

**Larangan spesifik:**
- Dilarang log raw secret values — semua log harus melalui redaction
- `index.ts` dilarang punya implementasi

**Verifikasi:**
1. `npm run check` clean
2. `bun test src/logging/` — termasuk test bahwa secret tidak muncul di output
3. `npm run runtime:smoke` clean

---

### Task 1.5 — Pecah `src/security/` ke Sub-Files

**Requirements:** Req 7, 73

**Yang harus dihasilkan:**
```
src/security/audit.ts           — createAuditTrail(), auditLog(event), list()
src/security/operator-token.ts  — validateOperatorToken, validateOperatorTokenMatch
src/security/dangerous-config.ts — detectDangerousConfig(config)
src/security/sanitize.ts        — sanitizeInput, serializeAuditSafe
src/security/index.ts           — re-exports only
```

**Behavior wajib:**
- `validateOperatorTokenMatch(expected, actual)` — constant-time comparison (tidak boleh short-circuit)
- `detectDangerousConfig({ host: '0.0.0.0', operatorToken: 'dev' })` → findings array tidak kosong
- `sanitizeInput('hello\x00world')` → `'helloworld'` (strip control chars)
- `serializeAuditSafe({ api_key: 'secret' })` → `{ api_key: '[REDACTED]' }`

**Larangan spesifik:**
- `validateOperatorTokenMatch` dilarang pakai `===` langsung — harus constant-time
- Dilarang log raw token values

**Verifikasi:**
1. `npm run check` clean
2. `bun test src/security/`
3. `npm run runtime:smoke` clean

---

### Task 1.6 — Pecah `src/secrets/` ke Sub-Files

**Requirements:** Req 8, 73

**Yang harus dihasilkan:**
```
src/secrets/redact.ts     — redactSecret(value)
src/secrets/key-detect.ts — isSecretKey(key)
src/secrets/index.ts      — re-exports only
```

**Behavior wajib:**
- `redactSecret('sk-abcdefgh')` → `'sk-ab...****'`
- `redactSecret('short')` → `'****'` (< 8 chars → full mask)
- `isSecretKey('api_key')` → `true`
- `isSecretKey('username')` → `false`
- `isSecretKey('AUTHORIZATION')` → `true`

**Verifikasi:**
1. `npm run check` clean
2. `bun test src/secrets/`
3. `npm run runtime:smoke` clean

---

### Task 1.7 — Pecah `src/config/` ke Sub-Files

**Requirements:** Req 9, 73

**Yang harus dihasilkan:**
```
src/config/parse.ts      — parseConfig(source, schema)
src/config/readers.ts    — readString, readInteger, readBoolean, readObject
src/config/env-source.ts — envSource(env)
src/config/index.ts      — re-exports only (runtime-app-bridge.ts tetap ada)
```

**Behavior wajib:**
- `parseConfig({ port: '3000' }, { port: readInteger() })` → `{ ok: true, config: { port: 3000 } }`
- `parseConfig({}, { port: readInteger({ required: true }) })` → `{ ok: false, errors: [{ field: 'port', ... }] }`
- `readInteger({ min: 1, max: 65535 })` → error jika di luar range
- `envSource(process.env)` → filter undefined values

**Verifikasi:**
1. `npm run check` clean
2. `bun test src/config/`
3. `npm run runtime:smoke` clean

---

## Phase 2 — Core Runtime Layer

> Dependency: Phase 1 harus selesai semua.

---

### Task 2.1 — Pecah `src/provider-runtime/` ke Sub-Files

**Requirements:** Req 10, 73

**Yang harus dihasilkan:**
```
src/provider-runtime/execute.ts        — executeProviderOperation(options)
src/provider-runtime/circuit-breaker.ts — createCircuitBreaker(policy), CircuitOpenError
src/provider-runtime/retry.ts          — calculateRetryDelayMs(strategy, attempt)
src/provider-runtime/timeout.ts        — ProviderTimeoutError, withProviderTimeout
src/provider-runtime/health.ts         — checkProviderHealth(id, check, timeoutMs)
src/provider-runtime/index.ts          — re-exports only
```

**Behavior wajib:**
- Circuit breaker: setelah `failureThreshold` failures berturut-turut → state `open` → `CircuitOpenError` tanpa call
- Circuit breaker half-open: 1 success → reset ke `closed`
- Retry: exponential backoff `baseMs * factor^attempt` dengan optional jitter
- Timeout: `AbortSignal` dikirim ke operation, throw `ProviderTimeoutError` jika melebihi `timeoutMs`
- `executeProviderOperation` mengintegrasikan semua: circuit breaker → timeout → retry

**Larangan spesifik:**
- Dilarang `setTimeout` tanpa cleanup di test
- Circuit breaker state dilarang disimpan di global — harus per-instance

**Verifikasi:**
1. `npm run check` clean
2. `bun test src/provider-runtime/` — termasuk test circuit breaker open/half-open/closed cycle
3. **AI smoke test:** `npm run runtime:smoke` — smoke test memanggil provider nyata, pastikan retry dan timeout bekerja dengan `AI_BASE_URL` yang dikonfigurasi

---

### Task 2.2 — Pecah `src/channels/` ke Sub-Files

**Requirements:** Req 12, 73

**Yang harus dihasilkan:**
```
src/channels/normalize.ts    — normalizeChannelMessage(input, defaults)
src/channels/auth.ts         — authenticateChannelMessage(ctx, msg)
src/channels/route.ts        — routeInboundMessage(adapter, input, hook)
src/channels/health.ts       — createChannelHealth(channelId, status, detail, now)
src/channels/attachment.ts   — normalizeAttachments(raw)
src/channels/index.ts        — re-exports only
```

**Behavior wajib:**
- `normalizeChannelMessage` dengan field `id` missing → `err(['id is required'])`
- `normalizeChannelMessage` dengan semua field valid → `ok(ChannelMessage)`
- `authenticateChannelMessage` dengan token valid → allowed
- `normalizeAttachments` dengan entry missing `mimeType` → skip entry tersebut

**Verifikasi:**
1. `npm run check` clean
2. `bun test src/channels/`
3. `npm run runtime:smoke` clean

---

### Task 2.3 — Pecah `src/sessions/` ke Sub-Files

**Requirements:** Req 13, 73

**Yang harus dihasilkan:**
```
src/sessions/registry.ts    — SessionRegistry class
src/sessions/lifecycle.ts   — state machine: created→active→idle→closed/expired
src/sessions/transcript.ts  — appendTranscript, TranscriptEntry
src/sessions/index.ts       — re-exports only
```

**Behavior wajib:**
- `new SessionRegistry()` → `createSession()` → state `created`
- `appendTranscript` pada session `created` → auto-transition ke `active`
- `close(sessionId, reason)` → state `closed`, lifecycle array tercatat
- Mutasi pada session `closed` → throw error
- `cleanupExpired(now)` → semua session past `expiresAt` → state `expired`
- `setModelOverride(sessionId, modelOverride)` update model override tanpa mengubah lifecycle state

**Verifikasi:**
1. `npm run check` clean
2. `bun test src/sessions/` — termasuk test full lifecycle: create → active → close
3. `npm run runtime:smoke` clean

---

### Task 2.4 — Pecah `src/memory/` ke Sub-Files

**Requirements:** Req 14, 73

**Yang harus dihasilkan:**
```
src/memory/store.ts    — write(ns, key, value), read(ns, key), list(ns)
src/memory/migrate.ts  — migrate(ns, migrations)
src/memory/repair.ts   — repair(ns)
src/memory/path.ts     — sanitizeSegment(value), resolveNamespacePath
src/memory/index.ts    — re-exports only
```

**Behavior wajib:**
- `write` → atomic (temp file + rename)
- `read` untuk key tidak ada → `null` tanpa throw
- `sanitizeSegment('../etc')` → throw (path traversal)
- `sanitizeSegment('valid-key')` → `'valid-key'`
- `repair(ns)` → file JSON corrupt dipindah ke `.repair/` bukan dihapus
- `migrate` → apply migrations berurutan, skip record jika migration missing

**Verifikasi:**
1. `npm run check` clean
2. `bun test src/memory/` — gunakan `createTempDirectory()` dari `src/infra/temp.ts`, dispose di `afterEach`
3. `npm run runtime:smoke` clean

---

### Task 2.5 — Pecah `src/context-engine/` ke Sub-Files

**Requirements:** Req 15, 73

**Yang harus dihasilkan:**
```
src/context-engine/batch.ts    — buildContextBatch(owner, items, budget, compressionHook?)
src/context-engine/score.ts    — scoreContextItem(item, now)
src/context-engine/estimate.ts — estimateTokens(content)
src/context-engine/index.ts    — re-exports only
```

**Behavior wajib:**
- `estimateTokens('hello world')` → `ceil(11/4)` = `3`
- `estimateTokens('')` → `1` (minimum)
- `buildContextBatch` dengan items melebihi budget → include high-priority dulu, omit low-priority
- `buildContextBatch` dengan `compressionHook` → panggil hook untuk overflow items
- `scoreContextItem` → kombinasi priority weight + recency + attribution
- `buildContextBatch` dengan owner filter → hanya include items yang match semua field owner

**Verifikasi:**
1. `npm run check` clean
2. `bun test src/context-engine/`
3. **AI smoke test:** `npm run runtime:smoke` — context engine dipakai saat agent memproses pesan, pastikan tidak ada regression

---

### Task 2.6 — Pecah `src/tools/`, `src/hooks/`, `src/flows/`, `src/tasks/`, `src/routing/`, `src/plugin-state/`

**Requirements:** Req 16–21, 73

**Yang harus dihasilkan per module:**

`src/tools/`:
```
descriptor.ts   — validateToolDescriptor(descriptor)
availability.ts — evaluateToolAvailability(expression, context)
plan.ts         — buildToolPlan(descriptors, availability)
result.ts       — normalizeToolResult, normalizeToolError
index.ts        — re-exports only
```

`src/hooks/`:
```
registry.ts — createHookRegistry() dengan register, handleInbound, deregister
handler.ts  — HookHandler, HookHandlerResult types
index.ts    — re-exports only
```

`src/flows/`:
```
engine.ts   — executeFlow(definition, options)
store.ts    — InMemoryFlowStateStore
validate.ts — validateFlowDefinition(definition)
index.ts    — re-exports only
```

`src/tasks/`:
```
registry.ts    — TaskRegistry class
graph.ts       — dependency graph, cycle detection
transitions.ts — valid state transitions
index.ts       — re-exports only
```

`src/routing/`:
```
resolve.ts     — resolveRoute(message, table)
dead-letter.ts — DeadLetterQueue, routeOrDeadLetter
index.ts       — re-exports only
```

`src/plugin-state/`:
```
store.ts   — InMemoryPluginStateStore
migrate.ts — migrate(key, targetVersion, migrations)
index.ts   — re-exports only
```

**Behavior wajib (pilihan kritis):**
- `TaskRegistry.register` dengan dependency cycle → `err({ code: 'cycle' })` tanpa register
- `executeFlow` dengan step gagal + ada `recover` → lanjut eksekusi
- `executeFlow` dengan step gagal tanpa `recover` → return `err(flowError)`
- `executeFlow` persist state setelah setiap step berhasil sebelum lanjut
- `resolveRoute` dengan message tanpa `id` → dead letter dengan reason `invalid-message`
- `HookRegistry.handleInbound` menjalankan matching handlers concurrent; handler throw → record `failed`, tidak propagate
- `HookRegistry` mencatat register, deregister, dan execution di audit trail
- `InMemoryPluginStateStore` saving lalu loading record → equivalent round-trip
- `TaskRegistry` menolak transition invalid dan mencatat dependency graph yang cycle-free

**Verifikasi:**
1. `npm run check` clean
2. `bun test src/tools/ src/hooks/ src/flows/ src/tasks/ src/routing/ src/plugin-state/`
3. `npm run runtime:smoke` clean

---

## Phase 3 — Plugin SDK Layer

> Dependency: Phase 1 dan 2 harus selesai.
> Semua file adaptasi wajib membaca referensi di `referensi/openclaw/src/plugin-sdk/` lebih dulu, lalu adaptasi pola ke kontrak AgentAI01.

---

### Task 3.1 — Implementasi Plugin SDK Core Types dan Entry Contract

**Requirements:** Req 11, 23, 44, 45, 73
**Referensi:** `referensi/openclaw/src/plugin-sdk/index.ts`, `plugin-entry.ts`, `config-schema.ts`

**Yang harus dihasilkan:**
```
src/plugin-sdk/types.ts        — PluginKind, PluginContext, ProviderPlugin, ChannelPlugin, ToolPlugin, RuntimePlugin, PluginFactory
src/plugin-sdk/plugin-entry.ts — definePluginEntry, defineChannelPluginEntry, defineSetupPluginEntry
src/plugin-sdk/index.ts        — re-export semua public sub-module, tidak ada implementasi langsung
```

**Behavior wajib:**
- `ProviderPlugin.complete(prompt, ctx)` return `Promise<string>`.
- `ChannelPlugin.send(msg, ctx)` return `Promise<void>`.
- `ToolPlugin.execute(name, input, ctx)` return `Promise<ToolExecutionResult>`.
- `PluginContext` punya `plugin_id`, optional `project_id`, optional structured logger.
- `definePluginEntry` normalize `id`, `name`, `description`, `configSchema`, dan `register`.
- `configSchema` function dievaluasi lazy dan cache satu kali.
- `defineChannelPluginEntry` register channel capability via `api.registerChannel`.
- Mode `cli-metadata`, `discovery`, dan `full` memanggil registration hooks sesuai Req 23.
- `index.ts` tidak re-export platform-specific/OpenClaw-specific contracts.

**Verifikasi:**
1. `npm run check` clean
2. `bun test src/plugin-sdk/types.test.ts src/plugin-sdk/plugin-entry.test.ts`
3. `bun test src/plugin-sdk/`
4. `npm run runtime:smoke` clean

---

### Task 3.2 — Implementasi Channel Plugin Builders

**Requirements:** Req 24, 45
**Referensi:** `referensi/openclaw/src/plugin-sdk/core.ts`, `channel-core.ts`

**Yang harus dihasilkan:**
```
src/plugin-sdk/channel-core.ts — createChatChannelPlugin, createChannelPluginBase
```

**Behavior wajib:**
- `createChannelPluginBase(params)` membuat base channel plugin dan omit optional fields yang tidak ada.
- `createChatChannelPlugin(params)` merge `security`, `pairing`, `threading`, dan `outbound` adapters.
- Shorthand `security.dm` build DM security adapter.
- Shorthand `pairing.text` build inline text pairing adapter.
- `threading.topLevelReplyToMode` dan `threading.scopedAccountReplyToMode` build resolver yang sesuai.
- `outbound.attachedResults` attach channel name ke delivery result.
- Default `conversationBindings.supportsCurrentConversationBinding: true`.

**Verifikasi:**
1. `npm run check` clean
2. `bun test src/plugin-sdk/channel-core.test.ts`
3. `npm run runtime:smoke` clean

---

### Task 3.3 — Implementasi Plugin SDK Queue, Approval, dan Session Route Utilities

**Requirements:** Req 25, 26, 27, 45
**Referensi:** `referensi/openclaw/src/plugin-sdk/keyed-async-queue.ts`, `approval-renderers.ts`, `core.ts`

**Yang harus dihasilkan:**
```
src/plugin-sdk/keyed-async-queue.ts — KeyedAsyncQueue, enqueueKeyedTask
src/plugin-sdk/approval-renderers.ts — buildApprovalPendingReplyPayload, buildApprovalResolvedReplyPayload
src/plugin-sdk/session-route.ts      — buildChannelOutboundSessionRoute, buildThreadAwareOutboundSessionRoute, recoverCurrentThreadSessionId, stripChannelTargetPrefix, stripTargetKindPrefix
```

**Behavior wajib:**
- Same key queue serial; different keys concurrent.
- Rejected task tidak menghentikan task berikutnya untuk key yang sama.
- Tails map dibersihkan setelah key selesai; hooks `onEnqueue` dan `onSettle` terpanggil.
- Approval pending default `allowedDecisions: ['allow-once', 'allow-always', 'deny']` dan `approvalKind: 'exec'`.
- Approval payload punya `text`, `interactive`, dan `channelData.execApproval`.
- Thread-aware route default precedence `['replyToId', 'threadId', 'currentSession']`.
- Prefix strip helpers handle provider-specific dan target-kind prefixes.

**Verifikasi:**
1. `npm run check` clean
2. `bun test src/plugin-sdk/keyed-async-queue.test.ts src/plugin-sdk/approval-renderers.test.ts src/plugin-sdk/session-route.test.ts`
3. `npm run runtime:smoke` clean

---

### Task 3.4 — Implementasi Provider Entry, Memory Core, dan Config Helpers

**Requirements:** Req 28, 29, 30, 31, 45
**Referensi:** `referensi/openclaw/src/plugin-sdk/provider-entry.ts`, `memory-core.ts`, `memory-host-core.ts`, `config-schema.ts`, `channel-config-helpers.ts`, `config-mutation.ts`

**Yang harus dihasilkan:**
```
src/plugin-sdk/provider-entry.ts          — defineSingleProviderPlugin
src/plugin-sdk/memory-core.ts             — memory host core contracts/helpers
src/plugin-sdk/config-schema.ts           — buildPluginConfigSchema, buildJsonPluginConfigSchema, emptyPluginConfigSchema, buildChannelConfigSchema, buildJsonChannelConfigSchema, emptyChannelConfigSchema
src/plugin-sdk/channel-config-helpers.ts  — clear/delete/set/apply/migrate account helpers
```

**Behavior wajib:**
- `defineSingleProviderPlugin` register single provider, API-key auth, dan catalog builder/run.
- Memory host core expose embeddings, storage, multimodal, query, secret, status surfaces.
- `buildMemorySystemPromptAddition` dan `delegateCompactionToRuntime` punya behavior nyata.
- Config schema builders preserve field definitions dan support empty schemas.
- Channel config helpers mutate account fields safely, including legacy base-name migration.

**Verifikasi:**
1. `npm run check` clean
2. `bun test src/plugin-sdk/provider-entry.test.ts src/plugin-sdk/memory-core.test.ts src/plugin-sdk/config-schema.test.ts src/plugin-sdk/channel-config-helpers.test.ts`
3. `npm run runtime:smoke` clean

---

### Task 3.5 — Implementasi Plugin SDK Runtime Utilities

**Requirements:** Req 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 45
**Referensi:** `referensi/openclaw/src/plugin-sdk/core.ts`, `lazy-value.ts`, `reply-dedupe.ts`, `persistent-dedupe.ts`, `secret-file-runtime.ts`, `acp-runtime-backend.ts`, `acp-binding-resolve-runtime.ts`, `channel-setup.ts`, `provider-tools.ts`, `security-runtime.ts`, `runtime.ts`, `error-runtime.ts`

**Yang harus dihasilkan:**
```
src/plugin-sdk/secure-random.ts      — generateSecureToken, generateSecureUuid, createDedupeCache, resolveGlobalDedupeCache, PersistentDedupe
src/plugin-sdk/lazy-value.ts         — createCachedLazyValueGetter, LazyValue<T>
src/plugin-sdk/gateway-utils.ts      — resolveGatewayBindUrl, resolveGatewayPort, buildAgentSessionKey, resolveThreadSessionKeys, DEFAULT_ACCOUNT_ID, normalizeAccountId
src/plugin-sdk/secret-file.ts        — loadSecretFileSync, readSecretFileSync, tryReadSecretFileSync, DEFAULT_SECRET_FILE_MAX_BYTES
src/plugin-sdk/subsystem-logger.ts   — createSubsystemLogger, PluginLogger
src/plugin-sdk/acp-binding.ts        — resolveConfiguredAcpBindingRecord, ensureConfiguredAcpBindingReady
src/plugin-sdk/pairing-helpers.ts    — formatPairingApproveHint, parseOptionalDelimitedEntries, normalizeAtHashSlug, normalizeHyphenSlug
src/plugin-sdk/action-gate.ts        — createActionGate, jsonResult, readStringParam, readNumberParam, readStringArrayParam, readReactionParams, parseStrictPositiveInteger
src/plugin-sdk/network-utils.ts      — isTrustedProxyAddress, resolveClientIp, formatZonedTimestamp, collectProviderDangerousNameMatchingScopes
src/plugin-sdk/runtime-handlers.ts   — registerUncaughtExceptionHandler, registerUnhandledRejectionHandler, createNonExitingRuntime, defaultRuntime, resolveRuntimeEnv, resolveRuntimeEnvWithUnavailableExit
src/plugin-sdk/backup-utils.ts       — createBackupArchive, detectPluginInstallPathIssue, formatPluginInstallPathIssue
src/plugin-sdk/tailscale.ts          — resolveTailnetHostWithRunner
```

**Behavior wajib:**
- Random/token utilities pakai crypto-secure source.
- Dedupe TTL dan max-size eviction berfungsi; persistent dedupe survive restart.
- Lazy getter call factory maksimal satu kali dan cache hasil.
- Secret file helpers enforce `DEFAULT_SECRET_FILE_MAX_BYTES`, trim content, missing file returns `null` untuk `tryRead`.
- ACP binding missing return `{ ok: false, error: 'ACP binding not configured' }`.
- Action gate dan param readers throw descriptive error untuk required param missing.
- Network helpers hanya trust forwarded headers dari trusted proxy.
- Runtime handler tests tidak boleh benar-benar exit process; pakai injected runtime/non-exiting runtime.
- Tailscale resolver return `null` saat command missing/not running.

**Verifikasi:**
1. `npm run check` clean
2. `bun test src/plugin-sdk/secure-random.test.ts src/plugin-sdk/lazy-value.test.ts src/plugin-sdk/gateway-utils.test.ts src/plugin-sdk/secret-file.test.ts src/plugin-sdk/subsystem-logger.test.ts src/plugin-sdk/acp-binding.test.ts src/plugin-sdk/pairing-helpers.test.ts src/plugin-sdk/action-gate.test.ts src/plugin-sdk/network-utils.test.ts src/plugin-sdk/runtime-handlers.test.ts src/plugin-sdk/backup-utils.test.ts src/plugin-sdk/tailscale.test.ts`
3. `npm run runtime:smoke` clean

---

### Task 3.6 — Implementasi Plugin Registry, Loader, dan Hot Reload

**Requirements:** Req 80, 45
**Referensi:** pola plugin system di `referensi/openclaw/`

**Yang harus dihasilkan:**
```
src/plugin-sdk/registry.ts   — createPluginRegistry
src/plugin-sdk/loader.ts     — createPluginLoader dengan zod manifest validation
src/plugin-sdk/hot-reload.ts — watchExtensions menggunakan chokidar
```

**Behavior wajib:**
- Export `PluginManifest`, `ToolDefinition`, `Plugin`, dan `PluginAPI`.
- Registry punya `load(pluginPath)`, `enable(id)`, `disable(id)`, `list()`, dan `get(id)`.
- Loader validate manifest `id`, `name`, `version`, `description`, `author?`, `tools?`, `skills?` via Zod.
- Loader reject invalid manifest dengan diagnostic jelas.
- Hot reload watch `extensions/`, reload changed plugins, dan expose disposer/stop method.
- Tests mock filesystem/module loading/chokidar; tidak butuh network.

**Verifikasi:**
1. `npm run check` clean
2. `bun test src/plugin-sdk/registry.test.ts src/plugin-sdk/loader.test.ts src/plugin-sdk/hot-reload.test.ts`
3. `bun test src/plugin-sdk/`
4. `npm run runtime:smoke` clean

---

## Phase 4 — Channel Implementations

> Dependency: Phase 3 selesai. Channel modules tidak boleh monolitik dan tidak boleh type-only.

---

### Task 4.1 — Implementasi Telegram Token, Transport, Normalize, Offset, Status, dan Error Policy

**Requirements:** Req 46, 47, 48, 49, 50, 51, 70
**Referensi:** `referensi/openclaw/extensions/telegram/src/token.ts`, `fetch.ts`, `normalize.ts`, `update-offset-store.ts`, `polling-status.ts`, `error-policy.ts`

**Yang harus dihasilkan:**
```
src/channels/telegram/token.ts
src/channels/telegram/fetch.ts
src/channels/telegram/normalize.ts
src/channels/telegram/update-offset-store.ts
src/channels/telegram/polling-status.ts
src/channels/telegram/error-policy.ts
```

**Behavior wajib:**
- Token resolution precedence: `TOKEN_TELE` env, token file via `tryReadSecretFileSync`, config, lalu missing.
- Token result trim whitespace dan expose `status`, `value`, `source`.
- Transport default global `fetch`; proxy config pakai `ProxyAgent`; API root default `https://api.telegram.org`.
- Transport log mode via subsystem logger `telegram/network`.
- Telegram target normalize supports `telegram:` dan `tg:`, thread IDs, invalid empty input, lowercase output.
- Offset store read missing returns `null`; write atomic; version/token fingerprint mismatch resets offset.
- Polling status publisher no-op aman saat `setStatus` tidak ada.
- Error policy supports `always`, `once`, `silent`, default cooldown 4 jam, scope per account/chat/thread.

**Verifikasi:**
1. `npm run check` clean
2. `bun test src/channels/telegram/token.test.ts src/channels/telegram/fetch.test.ts src/channels/telegram/normalize.test.ts src/channels/telegram/update-offset-store.test.ts src/channels/telegram/polling-status.test.ts src/channels/telegram/error-policy.test.ts`
3. `npm run runtime:smoke` clean

---

### Task 4.2 — Implementasi Telegram Draft, Updates, Send, dan Index

**Requirements:** Req 52, 53, 54, 55, 56, 70
**Referensi:** `referensi/openclaw/extensions/telegram/src/draft-chunking.ts`, `draft-stream.ts`, `bot-updates.ts`, `send.ts`, `../index.ts`

**Yang harus dihasilkan:**
```
src/channels/telegram/draft-chunking.ts
src/channels/telegram/draft-stream.ts
src/channels/telegram/bot-updates.ts
src/channels/telegram/send.ts
src/channels/telegram/index.ts
```

**Behavior wajib:**
- Draft chunking default `{ minChars: 200, maxChars: 800, breakPreference: 'paragraph' }`.
- Chunking caps max to Telegram limit, clamps min to max, supports paragraph/newline/sentence.
- Draft stream exposes `update`, `flush`, `stop`, `clear`, `messageId`, `forceNewMessage`.
- Draft stream throttles edits, flushes on stop, deletes preview on clear, falls back when thread missing.
- Update key resolves update/callback/edited-message keys; dedupe TTL 5 menit max 2000.
- Send text/media/poll supports chunking >4096 chars, retryable backoff, optional `threadId`, inline keyboard, HTML sanitization.
- `index.ts` re-export all public Telegram contracts dan no OpenClaw-specific names.

**Verifikasi:**
1. `npm run check` clean
2. `bun test src/channels/telegram/draft-chunking.test.ts src/channels/telegram/draft-stream.test.ts src/channels/telegram/bot-updates.test.ts src/channels/telegram/send.test.ts`
3. `bun test src/channels/telegram/`
4. `npm run runtime:smoke` clean

---

### Task 4.3 — Implementasi WhatsApp Normalize, Timing, Reconnect, Group Route, Inbound Extract/Access/Dedupe

**Requirements:** Req 57, 58, 59, 60, 61, 62, 63, 71
**Referensi:** `referensi/openclaw/extensions/whatsapp/src/normalize-target.ts`, `normalize.ts`, `socket-timing.ts`, `reconnect.ts`, `group-session-key.ts`, `inbound/extract.ts`, `inbound/access-control.ts`, `inbound/dedupe.ts`

**Yang harus dihasilkan:**
```
src/channels/whatsapp/normalize-target.ts
src/channels/whatsapp/socket-timing.ts
src/channels/whatsapp/reconnect.ts
src/channels/whatsapp/group-session-key.ts
src/channels/whatsapp/inbound/extract.ts
src/channels/whatsapp/inbound/access-control.ts
src/channels/whatsapp/inbound/dedupe.ts
```

**Behavior wajib:**
- Target normalization supports WhatsApp prefix, group/newsletter/user JIDs, allowlist entries, and invalid inputs.
- Socket timing defaults `25000/60000/60000`, override precedence, positive integer validation.
- Reconnect defaults `initialMs: 2000`, `maxMs: 30000`, `factor: 1.8`, `jitter: 0.25`, `maxAttempts: 12`; clamp out-of-bounds values.
- Heartbeat default `60` seconds.
- Group session route appends account-scoped thread suffix only for non-default group sessions; legacy resolver strips suffix when applicable.
- Extract unwraps ephemeral/viewOnce wrappers and resolves text/kind for text, media, location, contact, unknown.
- Access control rejects self chat, enforces allowlist and pairing grace period.
- Dedupe claim returns first-true/subsequent-false within 20 min, max 5000, oldest eviction; outbound echo cache works.

**Verifikasi:**
1. `npm run check` clean
2. `bun test src/channels/whatsapp/normalize-target.test.ts src/channels/whatsapp/socket-timing.test.ts src/channels/whatsapp/reconnect.test.ts src/channels/whatsapp/group-session-key.test.ts src/channels/whatsapp/inbound/extract.test.ts src/channels/whatsapp/inbound/access-control.test.ts src/channels/whatsapp/inbound/dedupe.test.ts`
3. `npm run runtime:smoke` clean

---

### Task 4.4 — Implementasi WhatsApp Send, Auth Store, Connection Controller, Auto-Reply, dan Index

**Requirements:** Req 64, 65, 66, 67, 68, 69, 71
**Referensi:** `referensi/openclaw/extensions/whatsapp/src/send.ts`, `auth-store.runtime.ts`, `creds-persistence.ts`, `creds-files.ts`, `connection-controller.ts`, `connection-controller-registry.ts`, `auto-reply/monitor-state.ts`, `auto-reply/monitor/process-message.ts`, `../index.ts`

**Yang harus dihasilkan:**
```
src/channels/whatsapp/send.ts
src/channels/whatsapp/auth-store.ts
src/channels/whatsapp/connection-controller.ts
src/channels/whatsapp/auto-reply/monitor-state.ts
src/channels/whatsapp/auto-reply/monitor/process-message.ts
src/channels/whatsapp/index.ts
```

**Behavior wajib:**
- Send text/media/reaction via active Baileys socket; newsletter JID uses newsletter path.
- Markdown table mode conversion works when enabled.
- Missing active connection throws descriptive error with account ID.
- Auth store path/backup path resolution, raw read missing returns `null`, atomic write, restore backup if main missing/corrupt.
- `enqueueCredsSave` serializes writes per account using keyed async queue.
- Connection controller supports connect, disconnect, reconnect policy, max-attempts event, register/get/unregister registry.
- Monitor state start/stop/isRunning/waitForStop handles double-start error and stop resolution.
- `processWhatsAppInboundMessage` runs access control, dedupe, extraction, dispatch; returns `access-denied`, `duplicate`, or handled.
- `index.ts` re-export all public WhatsApp contracts dan no OpenClaw-specific names.

**Verifikasi:**
1. `npm run check` clean
2. `bun test src/channels/whatsapp/send.test.ts src/channels/whatsapp/auth-store.test.ts src/channels/whatsapp/connection-controller.test.ts src/channels/whatsapp/auto-reply/monitor-state.test.ts src/channels/whatsapp/auto-reply/monitor/process-message.test.ts`
3. `bun test src/channels/whatsapp/`
4. `npm run runtime:smoke` clean

---

## Phase 5 — Web Utility Layers

> Dependency: Phase 1–4 selesai.

---

### Task 5.1 — Implementasi `src/web-fetch/`

**Requirements:** Req 75
**Referensi:** `referensi/openclaw/src/web-fetch/runtime.ts`, `content-extractors.runtime.ts`

**Yang harus dihasilkan:**
```
src/web-fetch/types.ts              — WebFetchResult, WebFetchOptions
src/web-fetch/runtime.ts            — fetchWebContent
src/web-fetch/content-extractors.ts — HTML readable extraction
src/web-fetch/index.ts              — re-exports only
```

**Behavior wajib:**
- URL safety failure return `WebFetchResult` dengan `error`, bukan throw.
- HTTP GET pakai native `fetch`, timeout via `AbortController`, `timeoutMs`, `maxContentLength`, `userAgent`.
- HTML response diekstrak via `@mozilla/readability` + `linkedom`.
- Non-HTML response return raw text content.
- Tests mock fetch; tidak butuh network.

**Verifikasi:**
1. `npm run check` clean
2. `bun test src/web-fetch/`
3. `npm run runtime:smoke` clean

---

### Task 5.2 — Implementasi `src/web-search/`

**Requirements:** Req 76
**Referensi:** `referensi/openclaw/src/web-search/runtime.ts`, `runtime-types.ts`

**Yang harus dihasilkan:**
```
src/web-search/types.ts
src/web-search/runtime.ts
src/web-search/providers/tavily.ts
src/web-search/providers/duckduckgo.ts
src/web-search/index.ts
```

**Behavior wajib:**
- `createWebSearchClient(options)` return client dengan `search(query, options?)`.
- Default provider Tavily saat `TAVILY_API_KEY` tersedia.
- Fallback DuckDuckGo saat API key tidak tersedia.
- `normalizeSearchResults(raw, provider)` normalize provider output ke `WebSearchResult[]`.
- Providers pakai native `fetch`/available HTTP client; no OpenClaw import.
- Tests pakai mock HTTP responses; tidak butuh network.

**Verifikasi:**
1. `npm run check` clean
2. `bun test src/web-search/`
3. `npm run runtime:smoke` clean

---

## Phase 6 — Runtime App Layers

> Dependency: Phase 1–5 selesai.

---

### Task 6.1 — Ganti LanceDB Placeholder Embedding dengan Real Embedding Function

**Requirements:** Req 72
**Target:** `src/runtime-app/memory/lancedb/lancedbMemoryBackend.ts`

**Yang harus dihasilkan:**
```
src/runtime-app/memory/lancedb/lancedbMemoryBackend.ts — createEmbeddingFunction(options), real provider embedding path
```

**Behavior wajib:**
- Hapus production path hash/random/placeholder embedding.
- `createEmbeddingFunction(options)` injectable dan mockable.
- Saat `AI_BASE_URL` dan `AI_API_KEY` ada, call OpenAI-compatible `/v1/embeddings`.
- Provider unavailable return descriptive error, tidak silent fallback ke hash vector.
- Test membuktikan embedding function dipanggil oleh backend.

**Verifikasi:**
1. `npm run check` clean
2. `bun test src/runtime-app/memory/lancedb/`
3. `npm run runtime:smoke` clean

---

### Task 6.2 — Implementasi Runtime App Speech Layer

**Requirements:** Req 77
**Referensi:** `referensi/openclaw/src/tts/tts-types.ts`, `openai-compatible-speech-provider.ts`, `tts-core.ts`, `provider-registry.ts`

**Yang harus dihasilkan:**
```
src/runtime-app/speech/types.ts
src/runtime-app/speech/provider.ts
src/runtime-app/speech/registry.ts
src/runtime-app/speech/core.ts
src/runtime-app/speech/index.ts
```

**Behavior wajib:**
- Export `SpeechProvider` dengan `synthesize(text, options?)` dan `transcribe(audio, options?)`.
- `createOpenAICompatibleSpeechProvider(config)` pakai `openai` package.
- `createSpeechProviderRegistry()` register multiple providers dan resolve by capability.
- Saat `AI_BASE_URL` dan `AI_API_KEY` tersedia, provider memakai konfigurasi itu.
- Tests mock OpenAI client; tidak call network.

**Verifikasi:**
1. `npm run check` clean
2. `bun test src/runtime-app/speech/`
3. `npm run runtime:smoke` clean

---

### Task 6.3 — Implementasi Runtime App Generation Layer

**Requirements:** Req 78
**Referensi:** pola `referensi/openclaw/src/video-generation/` dan image generation patterns

**Yang harus dihasilkan:**
```
src/runtime-app/generation/types.ts
src/runtime-app/generation/registry.ts
src/runtime-app/generation/providers/openai-image.ts
src/runtime-app/generation/index.ts
```

**Behavior wajib:**
- Export `GenerationType = 'image' | 'audio' | 'document'`.
- Export `GenerationRequest`, `GenerationResult`, dan `GenerationProvider`.
- `createGenerationRegistry()` support `register(provider)` dan `generate(req)`.
- Registry routes request ke provider yang supports type; missing provider return descriptive error.
- `createOpenAIImageProvider(config)` pakai `openai` SDK untuk image generation.
- Tests mock provider/OpenAI client; tidak call network.

**Verifikasi:**
1. `npm run check` clean
2. `bun test src/runtime-app/generation/`
3. `npm run runtime:smoke` clean

---

### Task 6.4 — Implementasi Runtime App Diagnostics Layer

**Requirements:** Req 79
**Referensi:** logging dan health patterns dari `referensi/openclaw/src/utils/`

**Yang harus dihasilkan:**
```
src/runtime-app/diagnostics/logger.ts
src/runtime-app/diagnostics/health.ts
src/runtime-app/diagnostics/index.ts
```

**Behavior wajib:**
- `createLogger(name)` return logger dengan `debug`, `info`, `warn`, `error`, dan `child(bindings)`.
- Underlying logger pakai `tslog`.
- Export `rootLogger`.
- `createHealthState()` expose `setReady(ready, reason?)`, `isReady()`, `getStatus()`.
- `APP_ENV=production` default JSON log format; `APP_ENV=development` default pretty format.
- Jangan log raw secrets.

**Verifikasi:**
1. `npm run check` clean
2. `bun test src/runtime-app/diagnostics/`
3. `npm run runtime:smoke` clean

---

## Phase 7 — Skills dan Final Verification

> Dependency: Phase 1–6 selesai.

---

### Task 7.1 — Tambah Skills Web Search dan Summarize

**Requirements:** Req 81
**Referensi:** `referensi/openclaw/skills/` dan existing `skills/*/SKILL.md`

**Yang harus dihasilkan:**
```
skills/web-search/SKILL.md
skills/summarize/SKILL.md
```

**Behavior wajib:**
- Kedua `SKILL.md` punya frontmatter `name`, `description`, `version`.
- Struktur minimal: `# Nama Skill`, `## Tujuan`, `## Cara Pakai`, `## Parameter`.
- `skills/web-search/SKILL.md` menjelaskan cara memanggil `src/web-search/` dari agent context.
- `skills/summarize/SKILL.md` menjelaskan cara meringkas konten panjang memakai AI provider.
- Isi actionable, bukan placeholder.

**Verifikasi:**
1. `npm run check` clean
2. `bun test` clean
3. `npm run runtime:smoke` clean

---

### Task 7.2 — Final Zero OpenClaw Import dan No-Stub Gate

**Requirements:** Req 1, 2, 3, 22, 45, 82

**Yang harus diverifikasi:**
```bash
grep -r "from.*openclaw" src/ --include="*.ts"
grep -r "from.*@openclaw" src/ --include="*.ts"
grep -r "from.*@earendil" src/ --include="*.ts"
grep -r "not implemented\\|TODO: implement\\|placeholderEmbedding" src/ --include="*.ts"
```

**Exit gate wajib:**
- Semua grep OpenClaw menghasilkan output kosong.
- Tidak ada production path berisi `TODO: implement`, `throw new Error('not implemented')`, atau placeholder embedding.
- Tidak ada file adaptasi yang hanya type-only tanpa runtime export.
- Semua adapted modules punya colocated behavior tests.
- `npm run check` clean.
- `bun test` clean.
- `npm run runtime:smoke` clean dengan provider nyata.

**Verifikasi:**
1. `npm run check` clean
2. `bun test` clean
3. `npm run runtime:smoke` clean
4. Grep checks di atas output kosong

---

## Coverage Checklist

Checklist ini harus tetap sinkron dengan `requirements.md` dan `design.md`.

| Req | Covered By |
|-----|------------|
| 1 | Global rules, Task 7.2 |
| 2 | Global rules, every task verification, Task 7.2 |
| 3 | Global rules, every task verification, Task 7.2 |
| 4 | Task 1.2 |
| 5 | Task 1.1 |
| 6 | Task 1.4 |
| 7 | Task 1.5 |
| 8 | Task 1.6 |
| 9 | Task 1.7 |
| 10 | Task 2.1 |
| 11 | Task 3.1 |
| 12 | Task 2.2 |
| 13 | Task 2.3 |
| 14 | Task 2.4 |
| 15 | Task 2.5 |
| 16 | Task 2.6 |
| 17 | Task 2.6 |
| 18 | Task 2.6 |
| 19 | Task 2.6 |
| 20 | Task 2.6 |
| 21 | Task 2.6 |
| 22 | Global rules, Task 7.2 |
| 23 | Task 3.1 |
| 24 | Task 3.2 |
| 25 | Task 3.3 |
| 26 | Task 3.3 |
| 27 | Task 3.3 |
| 28 | Task 3.4 |
| 29 | Task 3.4 |
| 30 | Task 3.4 |
| 31 | Task 3.4 |
| 32 | Task 3.5 |
| 33 | Task 3.5 |
| 34 | Task 3.5 |
| 35 | Task 3.5 |
| 36 | Task 3.5 |
| 37 | Task 3.5 |
| 38 | Task 3.5 |
| 39 | Task 3.5 |
| 40 | Task 3.5 |
| 41 | Task 3.5 |
| 42 | Task 3.5 |
| 43 | Task 3.5 |
| 44 | Task 3.1 |
| 45 | Global rules, Tasks 3.1–7.2 |
| 46 | Task 4.1 |
| 47 | Task 4.1 |
| 48 | Task 4.1 |
| 49 | Task 4.1 |
| 50 | Task 4.1 |
| 51 | Task 4.1 |
| 52 | Task 4.2 |
| 53 | Task 4.2 |
| 54 | Task 4.2 |
| 55 | Task 4.2 |
| 56 | Task 4.2 |
| 57 | Task 4.3 |
| 58 | Task 4.3 |
| 59 | Task 4.3 |
| 60 | Task 4.3 |
| 61 | Task 4.3 |
| 62 | Task 4.3 |
| 63 | Task 4.3 |
| 64 | Task 4.4 |
| 65 | Task 4.4 |
| 66 | Task 4.4 |
| 67 | Task 4.4 |
| 68 | Task 4.4 |
| 69 | Task 4.4 |
| 70 | Tasks 4.1, 4.2 |
| 71 | Tasks 4.3, 4.4 |
| 72 | Task 6.1 |
| 73 | Tasks 1.1–3.1 |
| 74 | Task 1.3 |
| 75 | Task 5.1 |
| 76 | Task 5.2 |
| 77 | Task 6.2 |
| 78 | Task 6.3 |
| 79 | Task 6.4 |
| 80 | Task 3.6 |
| 81 | Task 7.1 |
| 82 | Task 7.2 |
