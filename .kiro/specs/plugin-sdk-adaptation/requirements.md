# Requirements Document

## Introduction

Feature ini mengadaptasi pola-pola dari `referensi/openclaw/src/plugin-sdk/` ke dalam project `agentai01` (AI Company Runtime Platform). Project sudah memiliki struktur folder yang mengikuti OpenClaw (`src/plugin-sdk/`, `src/infra/`, `src/shared/`, `src/channels/`, `src/sessions/`, dll), tetapi sebagian besar module masih berupa stub minimal atau belum memiliki implementasi lengkap.

Tujuan adaptasi adalah mengisi module-module tersebut dengan implementasi yang diadaptasi dari referensi OpenClaw — mengikuti pola, bukan copy-paste — dengan membuang bagian platform-specific (iOS, browser native, macOS app glue) dan mempertahankan kontrak yang reusable. Semua module yang diadaptasi harus memiliki colocated `*.test.ts` dan lulus typecheck TypeScript ESM strict tanpa `any`.

Prioritas utama adalah module yang dibutuhkan oleh Telegram bot dan runtime platform: `infra`, `shared`, `channels`, `sessions`, `plugin-sdk` core, `provider-runtime`, `tools`, `hooks`, `flows`, `tasks`, `routing`, `plugin-state`, `logging`, `security`, `secrets`, `config`, `memory`, dan `context-engine`.

## Glossary

- **Adaptation_System**: Sistem yang mengorkestrasi proses adaptasi module dari referensi OpenClaw ke project agentai01.
- **Module**: Satu folder di bawah `src/` yang berisi satu atau lebih file TypeScript dengan public contract yang di-export via `index.ts`.
- **Stub**: Module yang sudah ada file `index.ts`-nya tetapi isinya minimal — hanya type definitions atau implementasi placeholder tanpa behavior lengkap.
- **Reference**: Kode di `referensi/openclaw/src/` yang dipakai sebagai sumber pola adaptasi. Tidak boleh diedit.
- **Colocated_Test**: File `*.test.ts` yang berada di folder yang sama dengan module yang ditest, menggunakan `bun test`.
- **Adaptation_Rule**: Aturan dari `docs/openclaw-src-adaptation-baseline.md` yang mengikat proses adaptasi: adaptasi pola bukan copy-paste, drop platform-specific, keep reusable contracts.
- **Platform_Specific**: Kode yang hanya relevan untuk iOS, macOS native app, browser extension, atau OpenClaw product flow — harus di-drop saat adaptasi.
- **Public_Contract**: Type, function, dan class yang di-export dari `index.ts` sebuah module dan dipakai oleh module lain.
- **TypeScript_ESM_Strict**: Konfigurasi TypeScript dengan `strict: true`, module ESM, tanpa `any`, tanpa `@ts-nocheck`.
- **Telegram_Bot**: Runtime app di `src/runtime-app/telegramBot.ts` yang menjadi salah satu consumer utama module yang diadaptasi.
- **Provider_Runtime**: Module `src/provider-runtime/` yang mengelola eksekusi operasi ke AI provider dengan retry, timeout, dan circuit breaker.
- **Plugin_SDK**: Module `src/plugin-sdk/` yang menyediakan kontrak plugin untuk provider, channel, dan tool.
- **Session_Registry**: Class `SessionRegistry` di `src/sessions/` yang mengelola lifecycle session percakapan.
- **Memory_Store**: Module `src/memory/` yang menyediakan persistent storage berbasis filesystem untuk data agent.
- **Context_Engine**: Module `src/context-engine/` yang mengelola budget token dan prioritisasi context untuk LLM.
- **Hook_Registry**: Module `src/hooks/` yang menyediakan event-driven hook system untuk lifecycle events.
- **Flow_Engine**: Module `src/flows/` yang menyediakan step-based workflow execution dengan recovery.
- **Task_Registry**: Module `src/tasks/` yang mengelola dependency graph dan lifecycle task.
- **Routing_Table**: Module `src/routing/` yang menyediakan message routing ke agent berdasarkan type.
- **Plugin_State_Store**: Module `src/plugin-state/` yang menyediakan versioned state storage untuk plugin.

## Requirements

### Requirement 1: Adaptation Rule Compliance

**User Story:** As a developer, I want all adapted modules to follow the adaptation rules from `docs/openclaw-src-adaptation-baseline.md`, so that the codebase stays clean and platform-neutral.

#### Acceptance Criteria

1. THE Adaptation_System SHALL rename OpenClaw-specific public names to project-neutral names before exposing them in `index.ts`.
2. WHEN a module contains platform-specific code (iOS, macOS native, browser extension, OpenClaw product flow), THE Adaptation_System SHALL drop that code and not include it in the adapted module.
3. THE Adaptation_System SHALL preserve reusable contracts including state machines, lifecycle patterns, validation, redaction, and observability primitives.
4. THE Adaptation_System SHALL route filesystem behavior through `src/infra/`, network behavior through `src/infra/`, secrets through `src/secrets/`, and audit behavior through `src/security/` and `src/logging/`.
5. WHEN adapting a module, THE Adaptation_System SHALL keep core domain agent-agnostic — agent IDs, runtime policy, and provider defaults belong in registry or runtime-app configuration, not in core modules.

---

### Requirement 2: TypeScript ESM Strict Compliance

**User Story:** As a developer, I want all adapted modules to pass TypeScript strict typecheck, so that type safety is maintained across the codebase.

#### Acceptance Criteria

1. THE Adaptation_System SHALL produce TypeScript files that pass `npm run check` (tsc) without errors.
2. THE Adaptation_System SHALL not use `any` type in adapted module code; prefer real types, `unknown`, or narrow adapters.
3. THE Adaptation_System SHALL not use `@ts-nocheck` or `@ts-ignore` without an explicit comment explaining the intentional suppression.
4. THE Adaptation_System SHALL use TypeScript ESM import syntax with `.js` extension suffixes on relative imports.
5. WHEN an external boundary is crossed (e.g., parsing unknown JSON), THE Adaptation_System SHALL use schema validation helpers or Zod rather than type assertions.

---

### Requirement 3: Colocated Test Coverage

**User Story:** As a developer, I want every adapted module to have a colocated `*.test.ts` file, so that public contracts are verified and regressions are caught.

#### Acceptance Criteria

1. THE Adaptation_System SHALL create at least one colocated `*.test.ts` file for every adapted module.
2. WHEN a module exports a class or function with non-trivial behavior, THE Adaptation_System SHALL include behavior tests that verify the public contract, not the internal implementation shape.
3. THE Adaptation_System SHALL clean up timers, environment variables, globals, mocks, and temp directories after each test.
4. THE Adaptation_System SHALL prefer dependency injection and narrow mocks over broad barrel mocks.
5. WHEN a module has error handling paths, THE Adaptation_System SHALL include tests that verify error conditions are properly signaled.
6. FOR ALL modules that parse or serialize data, THE Adaptation_System SHALL include a round-trip property test (parse → serialize → parse produces equivalent result).

---

### Requirement 4: Infra Module Adaptation

**User Story:** As a developer, I want `src/infra/` to provide safe filesystem primitives, so that all modules can perform file I/O through a path-traversal-safe interface.

#### Acceptance Criteria

1. THE Infra_Module SHALL provide `resolveInside(root, unsafePath)` that returns an error when the resolved path escapes the root directory.
2. WHEN a file read is requested, THE Infra_Module SHALL return a `Result<string, string>` — never throw for missing files.
3. WHEN a file write is requested, THE Infra_Module SHALL perform an atomic write using a temp file and rename to prevent partial writes.
4. THE Infra_Module SHALL provide a `createTempDirectory()` function that returns a disposable temp directory with a `dispose()` method.
5. IF a path traversal is attempted, THEN THE Infra_Module SHALL return `err('Path traversal outside root is not allowed')` without accessing the filesystem.

---

### Requirement 5: Shared Utilities Completeness

**User Story:** As a developer, I want `src/shared/` to provide all generic utility types and helpers needed by other modules, so that there is no duplication of utility code across the codebase.

#### Acceptance Criteria

1. THE Shared_Module SHALL export `Result<T, E>`, `Option<T>`, `Deferred<T>`, `LazyAsync<T>`, `Page<T>`, and `PageRequest` types.
2. THE Shared_Module SHALL export `ok`, `err`, `some`, `none` constructors for `Result` and `Option`.
3. THE Shared_Module SHALL export `generateId`, `generateCorrelationId`, `formatIso8601`, `parseIso8601`, `normalizeWhitespace`, `coerceString`, `coerceNumber`, `coerceBoolean`, `isString`, `isNumber`, `isBoolean`, `isRecord`, `createDeferred`, `createLazyAsync`, `paginate`, `assertNever`, and `mapDeep`.
4. WHEN `generateId` is called in test context with `__AGENTAI_TEST_RANDOM_UUID__` set, THE Shared_Module SHALL use the deterministic factory instead of `crypto.randomUUID()`.
5. THE Shared_Module SHALL not import from any other `src/` module to avoid circular dependencies.

---

### Requirement 6: Logging Module Adaptation

**User Story:** As a developer, I want `src/logging/` to provide structured logging with secret redaction, so that logs are safe to emit without leaking sensitive data.

#### Acceptance Criteria

1. THE Logging_Module SHALL provide a `createLogger(options)` function that returns a `Logger` with `debug`, `info`, `warn`, `error`, and `child` methods.
2. WHEN a log message contains patterns matching API keys, tokens, secrets, or Bearer headers, THE Logging_Module SHALL redact those values before writing the log entry.
3. WHEN a log context object contains keys matching `/(api[_-]?key|token|secret|password|authorization|cookie|session)/i`, THE Logging_Module SHALL replace the value with `[REDACTED]`.
4. THE Logging_Module SHALL support `json` and `text` output formats.
5. WHEN the environment is `production`, THE Logging_Module SHALL default to `info` minimum log level; WHEN the environment is `test`, THE Logging_Module SHALL default to `warn`.
6. THE Logging_Module SHALL provide `createFileLogWriter(filePath)` that appends JSON log entries to a file.
7. THE Logging_Module SHALL provide `createSubsystemLogger(subsystem, options)` as a convenience factory.

---

### Requirement 7: Security Module Adaptation

**User Story:** As a developer, I want `src/security/` to provide audit trail, operator token validation, and dangerous config detection, so that security boundaries are enforced consistently.

#### Acceptance Criteria

1. THE Security_Module SHALL provide `createAuditTrail()` that returns an object with `auditLog(event)` and `list()` methods.
2. WHEN `auditLog` is called, THE Security_Module SHALL sanitize all string fields by removing control characters before storing the event.
3. THE Security_Module SHALL provide `validateOperatorToken(token)` that returns `Result<string, 'missing'>`.
4. THE Security_Module SHALL provide `validateOperatorTokenMatch(expected, actual)` using constant-time comparison to prevent timing attacks.
5. THE Security_Module SHALL provide `detectDangerousConfig(config)` that returns findings for public bind, weak operator token, and missing AI API key.
6. WHEN serializing data for audit, THE Security_Module SHALL redact values at keys matching `/(secret|token|password|key|authorization)/i`.
7. THE Security_Module SHALL provide `sanitizeInput(value)` that removes Unicode control characters from strings.

---

### Requirement 8: Secrets Module Adaptation

**User Story:** As a developer, I want `src/secrets/` to provide secret redaction and safe secret handling, so that secrets are never accidentally logged or serialized.

#### Acceptance Criteria

1. THE Secrets_Module SHALL provide `redactSecret(value)` that returns a redacted representation of a secret string.
2. WHEN a secret value is shorter than 8 characters, THE Secrets_Module SHALL return a fully masked string without revealing any characters.
3. WHEN a secret value is 8 or more characters, THE Secrets_Module SHALL reveal at most the first 4 characters and mask the rest.
4. THE Secrets_Module SHALL provide `isSecretKey(key)` that returns true for keys matching common secret patterns.
5. THE Secrets_Module SHALL not store or cache secret values in memory beyond the scope of a single function call.

---

### Requirement 9: Config Module Adaptation

**User Story:** As a developer, I want `src/config/` to provide a typed config parsing system, so that runtime configuration is validated at startup with clear error messages.

#### Acceptance Criteria

1. THE Config_Module SHALL provide `parseConfig(source, schema)` that returns `ConfigParseResult<T>` with either a typed config or a list of field errors.
2. THE Config_Module SHALL provide `readString`, `readInteger`, `readBoolean`, and `readObject` reader factories.
3. WHEN a required field is missing, THE Config_Module SHALL include a descriptive error in the `errors` array with the field name.
4. WHEN a numeric field is outside the specified `min` or `max` bounds, THE Config_Module SHALL return an error for that field.
5. THE Config_Module SHALL provide `envSource(env)` that converts `process.env`-style records to a config source, filtering out `undefined` values.

---

### Requirement 10: Provider Runtime Adaptation

**User Story:** As a developer, I want `src/provider-runtime/` to provide retry, timeout, and circuit breaker primitives, so that AI provider calls are resilient to transient failures.

#### Acceptance Criteria

1. THE Provider_Runtime SHALL provide `executeProviderOperation(options)` that executes an operation with configurable retry, timeout, and circuit breaker.
2. WHEN a circuit breaker is open, THE Provider_Runtime SHALL throw `CircuitOpenError` without attempting the operation.
3. WHEN an operation times out, THE Provider_Runtime SHALL abort the operation via `AbortSignal` and throw `ProviderTimeoutError`.
4. WHEN a retryable error occurs and attempts remain, THE Provider_Runtime SHALL wait using exponential backoff before retrying.
5. THE Provider_Runtime SHALL provide `createCircuitBreaker(policy)` that tracks failures and opens the circuit after `failureThreshold` consecutive failures.
6. WHEN the circuit is half-open and an operation succeeds, THE Provider_Runtime SHALL reset the failure count and close the circuit.
7. THE Provider_Runtime SHALL provide `checkProviderHealth(providerId, check, timeoutMs)` that returns a `ProviderRuntimeHealth` record.
8. THE Provider_Runtime SHALL provide `calculateRetryDelayMs(strategy, attempt)` that computes exponential backoff with optional jitter.

---

### Requirement 11: Plugin SDK Core Adaptation

**User Story:** As a developer, I want `src/plugin-sdk/` to provide the plugin contract types for provider, channel, and tool plugins, so that plugins can be registered and executed through a uniform interface.

#### Acceptance Criteria

1. THE Plugin_SDK SHALL export `PluginKind`, `PluginContext`, `ProviderPlugin`, `ChannelPlugin`, `ToolPlugin`, `RuntimePlugin`, and `PluginFactory` types.
2. WHEN a `ProviderPlugin` is called with a prompt and context, THE Plugin_SDK SHALL return a `Promise<string>` completion result.
3. WHEN a `ChannelPlugin` is called with a message and context, THE Plugin_SDK SHALL return a `Promise<void>` send result.
4. WHEN a `ToolPlugin` is called with a tool name and input, THE Plugin_SDK SHALL return a `Promise<ToolExecutionResult>`.
5. THE Plugin_SDK SHALL not import platform-specific code (iOS, macOS native, browser extension).
6. THE Plugin_SDK SHALL provide a `PluginContext` type that includes `plugin_id`, optional `project_id`, and an optional structured logger interface.

---

### Requirement 12: Channels Module Adaptation

**User Story:** As a developer, I want `src/channels/` to provide channel message normalization, authentication, and routing, so that inbound messages from Telegram and other channels are processed uniformly.

#### Acceptance Criteria

1. THE Channels_Module SHALL provide `normalizeChannelMessage(input, defaults)` that returns `Result<ChannelMessage, string[]>` with validation errors for missing required fields.
2. WHEN a channel message is missing `id`, `senderId`, `conversationId`, or `text`, THE Channels_Module SHALL include a descriptive error for each missing field.
3. THE Channels_Module SHALL provide `authenticateChannelMessage(context, message)` that validates channel ID match and principal allowlist.
4. WHEN a channel auth context has a token, THE Channels_Module SHALL validate the token using `validateOperatorToken` from `src/security/`.
5. THE Channels_Module SHALL provide `routeInboundMessage(adapter, input, hook)` that normalizes then dispatches to the hook.
6. THE Channels_Module SHALL provide `createChannelHealth(channelId, status, detail, now)` as a factory for health records.
7. WHEN attachments are present in a raw message, THE Channels_Module SHALL normalize them to `ChannelAttachment[]`, skipping entries missing `id` or `mimeType`.

---

### Requirement 13: Sessions Module Adaptation

**User Story:** As a developer, I want `src/sessions/` to provide a complete session lifecycle manager, so that conversation sessions can be created, transitioned, and expired reliably.

#### Acceptance Criteria

1. THE Session_Registry SHALL create sessions with a unique `sessionId`, initial state `created`, and a lifecycle event recording the creation.
2. WHEN `appendTranscript` is called on a `created` or `idle` session, THE Session_Registry SHALL automatically transition the session to `active`.
3. WHEN `cleanupExpired` is called, THE Session_Registry SHALL transition all sessions past their `expiresAt` to `expired` state.
4. IF a session is in `closed` or `expired` state, THEN THE Session_Registry SHALL throw an error when any mutation is attempted.
5. THE Session_Registry SHALL record every state transition in the `lifecycle` array with `from`, `to`, `at`, and `reason` fields.
6. THE Session_Registry SHALL provide `setModelOverride(sessionId, modelOverride)` to update the model override without changing session state.
7. WHEN `close` is called, THE Session_Registry SHALL transition the session to `closed` with the provided reason.

---

### Requirement 14: Memory Module Adaptation

**User Story:** As a developer, I want `src/memory/` to provide a filesystem-backed memory store with migration support, so that agent memory persists across restarts and can be upgraded safely.

#### Acceptance Criteria

1. THE Memory_Store SHALL provide `write(namespace, key, value)` that atomically writes a JSON record to the namespace path.
2. WHEN `read(namespace, key)` is called for a non-existent key, THE Memory_Store SHALL return `null` without throwing.
3. THE Memory_Store SHALL provide `list(namespace)` that returns all valid JSON records in the namespace directory.
4. WHEN `migrate(namespace, migrations)` is called, THE Memory_Store SHALL apply migrations in version order until the target version is reached.
5. IF a migration is missing for a version gap, THEN THE Memory_Store SHALL skip that record and continue with others.
6. THE Memory_Store SHALL provide `repair(namespace)` that moves corrupt JSON files to a `.repair` directory without deleting them.
7. WHEN a path segment contains `..` or unsafe characters, THE Memory_Store SHALL throw an error before accessing the filesystem.
8. THE Memory_Store SHALL provide `sanitizeSegment(value)` that replaces unsafe characters with `-` and throws for empty or traversal-unsafe results.

---

### Requirement 15: Context Engine Adaptation

**User Story:** As a developer, I want `src/context-engine/` to provide token budget management and context prioritization, so that LLM context windows are used efficiently.

#### Acceptance Criteria

1. THE Context_Engine SHALL provide `buildContextBatch(owner, items, budget, compressionHook)` that returns a `ContextBatch` with `included`, `compressed`, `omitted`, `usedTokens`, and `remainingTokens`.
2. WHEN items exceed the available token budget, THE Context_Engine SHALL include higher-priority items first and omit lower-priority items.
3. WHEN a `compressionHook` is provided and overflow items exist, THE Context_Engine SHALL call the hook with overflow items and remaining budget, then include the compressed result if it fits.
4. THE Context_Engine SHALL provide `estimateTokens(content)` that returns `ceil(content.length / 4)` as a token estimate, minimum 1.
5. THE Context_Engine SHALL provide `scoreContextItem(item, now)` that combines priority weight, recency score, and attribution score.
6. WHEN `owner` filters are specified, THE Context_Engine SHALL only include items whose owner matches all specified fields.

---

### Requirement 16: Tools Module Adaptation

**User Story:** As a developer, I want `src/tools/` to provide tool descriptor validation, availability evaluation, and tool plan building, so that tools can be conditionally exposed to agents based on runtime context.

#### Acceptance Criteria

1. THE Tools_Module SHALL provide `validateToolDescriptor(descriptor)` that returns an error when `name`, `description`, or `input_schema` are missing or invalid.
2. THE Tools_Module SHALL provide `evaluateToolAvailability(expression, context)` that returns an empty array when all conditions are met, or diagnostics when conditions fail.
3. WHEN an `allOf` expression is evaluated, THE Tools_Module SHALL return diagnostics from all failing sub-expressions.
4. WHEN an `anyOf` expression is evaluated, THE Tools_Module SHALL return an empty array if any sub-expression passes.
5. THE Tools_Module SHALL provide `buildToolPlan(descriptors, availability)` that separates tools into `visible` and `hidden` based on availability and executor presence.
6. WHEN a tool descriptor has no `executor`, THE Tools_Module SHALL place it in `hidden` with an `executor-missing` diagnostic.
7. THE Tools_Module SHALL provide `normalizeToolResult(output, metadata)` and `normalizeToolError(error, code, retryable)` as result constructors.

---

### Requirement 17: Hooks Module Adaptation

**User Story:** As a developer, I want `src/hooks/` to provide an event-driven hook registry, so that lifecycle events can be handled by registered handlers with audit logging.

#### Acceptance Criteria

1. THE Hook_Registry SHALL provide `register(registration)` that stores a hook handler for one or more event types.
2. WHEN `handleInbound(event)` is called, THE Hook_Registry SHALL invoke all handlers registered for that event type concurrently.
3. WHEN a hook handler throws, THE Hook_Registry SHALL record the error in the execution record with status `failed` without propagating the exception.
4. THE Hook_Registry SHALL record every registration, deregistration, and execution in the audit trail.
5. THE Hook_Registry SHALL provide `deregister(hookId)` that removes the hook and returns `true` if found, `false` if not.
6. WHEN a hook handler returns `{ handled: false }`, THE Hook_Registry SHALL record the execution with status `ignored`.

---

### Requirement 18: Flows Module Adaptation

**User Story:** As a developer, I want `src/flows/` to provide a step-based workflow engine with recovery support, so that multi-step operations can resume from the last successful step after failure.

#### Acceptance Criteria

1. THE Flow_Engine SHALL provide `executeFlow(definition, options)` that executes steps in order and returns `Result<FlowRunState, FlowError>`.
2. WHEN a step succeeds, THE Flow_Engine SHALL persist the updated state via the store before proceeding to the next step.
3. WHEN a step fails and a `recover` function is provided, THE Flow_Engine SHALL call the recover function and continue execution.
4. WHEN a step fails and no `recover` function is provided, THE Flow_Engine SHALL return `err(flowError)` with the step ID.
5. WHEN `executeFlow` is called with an existing flow state in the store, THE Flow_Engine SHALL skip already-succeeded steps.
6. THE Flow_Engine SHALL provide `validateFlowDefinition(definition)` that returns an error for empty IDs or duplicate step IDs.
7. THE Flow_Engine SHALL provide `InMemoryFlowStateStore` as a default store implementation.

---

### Requirement 19: Tasks Module Adaptation

**User Story:** As a developer, I want `src/tasks/` to provide a dependency-aware task registry, so that tasks can be scheduled and executed in the correct order based on their dependencies.

#### Acceptance Criteria

1. THE Task_Registry SHALL provide `register(definition)` that returns an error for duplicate task IDs, missing dependencies, or dependency cycles.
2. WHEN all dependencies of a task have succeeded, THE Task_Registry SHALL automatically transition the task from `pending` to `ready`.
3. THE Task_Registry SHALL provide `listReady()` that returns all tasks currently in `ready` state.
4. THE Task_Registry SHALL provide `transition(taskId, nextState)` that enforces valid state transitions and returns an error for invalid ones.
5. WHEN `storeResult(result)` is called, THE Task_Registry SHALL update the task state and refresh pending tasks that may now be ready.
6. THE Task_Registry SHALL provide `snapshot()` that returns all tasks and results as a point-in-time snapshot.
7. IF a task registration would create a dependency cycle, THEN THE Task_Registry SHALL return `err({ code: 'cycle', ... })` without registering the task.

---

### Requirement 20: Routing Module Adaptation

**User Story:** As a developer, I want `src/routing/` to provide message routing with dead letter handling, so that inbound messages are dispatched to the correct agent or queued for inspection when no route exists.

#### Acceptance Criteria

1. THE Routing_Table SHALL provide `resolveRoute(message, table)` that returns `Result<RouteResolution, DeadLetterMessage>`.
2. WHEN a message has no matching route in the routing table, THE Routing_Table SHALL return a dead letter with reason `no-route`.
3. WHEN a message is missing required fields (`id`, `channel`, `body`), THE Routing_Table SHALL return a dead letter with reason `invalid-message`.
4. THE Routing_Table SHALL provide `routeOrDeadLetter(message, table, queue)` that pushes unroutable messages to the dead letter queue.
5. THE Routing_Table SHALL provide `DeadLetterQueue` with `push(message)` and `list()` methods.

---

### Requirement 21: Plugin State Module Adaptation

**User Story:** As a developer, I want `src/plugin-state/` to provide versioned plugin state storage with migration support, so that plugins can persist and upgrade their state safely.

#### Acceptance Criteria

1. THE Plugin_State_Store SHALL provide `save(key, state, version)` that stores a `PluginStateRecord` keyed by `plugin_id` and optional `namespace`.
2. WHEN `load(key)` is called for a non-existent key, THE Plugin_State_Store SHALL return `err({ code: 'not-found', ... })`.
3. THE Plugin_State_Store SHALL provide `migrate(key, targetVersion, migrations)` that applies migrations in version order.
4. WHEN a migration is missing for a version step, THE Plugin_State_Store SHALL return `err({ code: 'migration-missing', ... })`.
5. FOR ALL plugin state records, saving then loading SHALL return an equivalent record (round-trip property).

---

### Requirement 22: Test Infrastructure

**User Story:** As a developer, I want all adapted modules to be testable with `bun test`, so that the test suite runs reliably in CI without external dependencies.

#### Acceptance Criteria

1. THE Adaptation_System SHALL ensure all tests pass with `bun test` without requiring network access, running servers, or external services.
2. WHEN a test requires filesystem access, THE Adaptation_System SHALL use `createTempDirectory()` from `src/infra/` and dispose it in `afterEach` or `afterAll`.
3. THE Adaptation_System SHALL not use `setTimeout` or `setInterval` in tests without cleaning them up in `afterEach`.
4. WHEN testing time-dependent behavior, THE Adaptation_System SHALL inject a `now` parameter rather than relying on `Date.now()` directly.
5. THE Adaptation_System SHALL not edit baseline, snapshot, or expected-failure files without explicit approval.

---

### Requirement 23: Plugin Entry Contract

**User Story:** As a developer, I want `src/plugin-sdk/` to provide a `definePluginEntry` helper, so that provider, tool, command, and service plugins can be registered through a uniform entry contract.

**Referensi:** `referensi/openclaw/src/plugin-sdk/plugin-entry.ts`

#### Acceptance Criteria

1. THE Plugin_SDK SHALL export `definePluginEntry(options)` that returns a normalized `PluginEntry` object with `id`, `name`, `description`, `configSchema`, and `register` fields.
2. WHEN `configSchema` is provided as a function, THE Plugin_SDK SHALL call it lazily and cache the result so it is only evaluated once.
3. THE Plugin_SDK SHALL export `defineChannelPluginEntry(options)` that wraps `definePluginEntry` and additionally registers the channel capability via `api.registerChannel`.
4. WHEN `api.registrationMode` is `cli-metadata`, THE Plugin_SDK SHALL only call `registerCliMetadata` and skip full registration.
5. WHEN `api.registrationMode` is `discovery`, THE Plugin_SDK SHALL call `registerCliMetadata` but not `registerFull`.
6. WHEN `api.registrationMode` is `full`, THE Plugin_SDK SHALL call both `registerCliMetadata` and `registerFull`.
7. THE Plugin_SDK SHALL export `defineSetupPluginEntry(plugin)` as a minimal helper for channels that ship a separate setup entry.
8. THE Plugin_SDK SHALL export `emptyPluginConfigSchema` as the default config schema when none is provided.

---

### Requirement 24: Channel Plugin Builder Helpers

**User Story:** As a developer, I want `src/plugin-sdk/` to provide `createChatChannelPlugin` and `createChannelPluginBase` helpers, so that channel plugins can be composed from security, pairing, threading, and outbound adapters without boilerplate.

**Referensi:** `referensi/openclaw/src/plugin-sdk/core.ts`, `referensi/openclaw/src/plugin-sdk/channel-core.ts`

#### Acceptance Criteria

1. THE Plugin_SDK SHALL export `createChatChannelPlugin(params)` that merges `security`, `pairing`, `threading`, and `outbound` adapters onto a base channel plugin.
2. WHEN `security` is provided as a shorthand DM security options object (with `dm` key), THE Plugin_SDK SHALL build a `ChannelSecurityAdapter` using the DM policy builder.
3. WHEN `pairing` is provided as a shorthand text pairing options object (with `text` key), THE Plugin_SDK SHALL build a `ChannelPairingAdapter` using the inline text pairing builder.
4. WHEN `threading` is provided with `topLevelReplyToMode`, THE Plugin_SDK SHALL build a `ChannelThreadingAdapter` using the top-level reply-to-mode resolver.
5. WHEN `threading` is provided with `scopedAccountReplyToMode`, THE Plugin_SDK SHALL build a `ChannelThreadingAdapter` using the scoped account reply-to-mode resolver.
6. WHEN `outbound` is provided with `attachedResults`, THE Plugin_SDK SHALL build a `ChannelOutboundAdapter` that attaches the channel name to each delivery result.
7. THE Plugin_SDK SHALL export `createChannelPluginBase(params)` that constructs a base channel plugin object with optional fields omitted when not provided.
8. THE Plugin_SDK SHALL set `conversationBindings.supportsCurrentConversationBinding: true` by default in `createChatChannelPlugin`.

---

### Requirement 25: Keyed Async Queue

**User Story:** As a developer, I want `src/plugin-sdk/` to provide a `KeyedAsyncQueue`, so that async work can be serialized per key while unrelated keys run concurrently.

**Referensi:** `referensi/openclaw/src/plugin-sdk/keyed-async-queue.ts`

#### Acceptance Criteria

1. THE Plugin_SDK SHALL export `KeyedAsyncQueue` class with an `enqueue(key, task, hooks?)` method.
2. WHEN two tasks are enqueued with the same key, THE Plugin_SDK SHALL execute them sequentially — the second task SHALL NOT start until the first settles.
3. WHEN two tasks are enqueued with different keys, THE Plugin_SDK SHALL execute them concurrently.
4. WHEN a task rejects, THE Plugin_SDK SHALL still execute the next task for the same key without propagating the rejection.
5. THE Plugin_SDK SHALL export `enqueueKeyedTask(params)` as a standalone function that accepts an external `tails` map.
6. WHEN a task settles and no further tasks are queued for that key, THE Plugin_SDK SHALL remove the key from the tails map to prevent memory leaks.
7. THE Plugin_SDK SHALL call `hooks.onEnqueue()` when a task is enqueued and `hooks.onSettle()` when it settles.

---

### Requirement 26: Approval Renderers

**User Story:** As a developer, I want `src/plugin-sdk/` to provide approval reply payload builders, so that approval requests and resolutions can be rendered consistently across channels.

**Referensi:** `referensi/openclaw/src/plugin-sdk/approval-renderers.ts`

#### Acceptance Criteria

1. THE Plugin_SDK SHALL export `buildApprovalPendingReplyPayload(params)` that returns a `ReplyPayload` with `text`, `interactive`, and `channelData.execApproval` fields.
2. WHEN `allowedDecisions` is not provided, THE Plugin_SDK SHALL default to `['allow-once', 'allow-always', 'deny']`.
3. WHEN `approvalKind` is not provided, THE Plugin_SDK SHALL default to `'exec'`.
4. THE Plugin_SDK SHALL export `buildApprovalResolvedReplyPayload(params)` that returns a `ReplyPayload` with the resolved approval state in `channelData.execApproval`.
5. THE Plugin_SDK SHALL normalize `agentId` and `sessionKey` using `normalizeOptionalString` before including them in the payload.

---

### Requirement 27: Channel Outbound Session Route Builders

**User Story:** As a developer, I want `src/plugin-sdk/` to provide `buildChannelOutboundSessionRoute` and `buildThreadAwareOutboundSessionRoute`, so that channel plugins can construct correct session route payloads for outbound messages.

**Referensi:** `referensi/openclaw/src/plugin-sdk/core.ts`

#### Acceptance Criteria

1. THE Plugin_SDK SHALL export `buildChannelOutboundSessionRoute(params)` that returns a `ChannelOutboundSessionRoute` with `sessionKey`, `baseSessionKey`, `peer`, `chatType`, `from`, `to`, and optional `threadId`.
2. THE Plugin_SDK SHALL export `buildThreadAwareOutboundSessionRoute(params)` that resolves thread ID from `replyToId`, `threadId`, or `currentSession` based on a configurable `precedence` array.
3. WHEN `precedence` is not provided, THE Plugin_SDK SHALL default to `['replyToId', 'threadId', 'currentSession']`.
4. THE Plugin_SDK SHALL export `recoverCurrentThreadSessionId(params)` that extracts the thread ID from the current session key if the base session key matches.
5. WHEN the base session key of the current session does not match the route's base session key, THE Plugin_SDK SHALL return `undefined` from `recoverCurrentThreadSessionId`.
6. THE Plugin_SDK SHALL export `stripChannelTargetPrefix(raw, ...providers)` that removes a known provider prefix from a target string.
7. THE Plugin_SDK SHALL export `stripTargetKindPrefix(raw)` that removes generic target-kind prefixes such as `user:`, `group:`, `channel:`, `dm:`.

---

### Requirement 28: Provider Entry Helpers

**User Story:** As a developer, I want `src/plugin-sdk/` to provide `SingleProviderPlugin` builder helpers, so that provider plugins with a single API key auth method can be defined with minimal boilerplate.

**Referensi:** `referensi/openclaw/src/plugin-sdk/provider-entry.ts`

#### Acceptance Criteria

1. THE Plugin_SDK SHALL export a `defineSingleProviderPlugin(options)` helper that builds a `PluginEntry` registering a single `ProviderPlugin`.
2. WHEN `provider.auth` is provided, THE Plugin_SDK SHALL create API key auth methods using `createProviderApiKeyAuthMethod`.
3. WHEN `provider.catalog.buildProvider` is provided, THE Plugin_SDK SHALL build the catalog using `buildSingleProviderApiKeyCatalog`.
4. WHEN `provider.catalog.run` is provided, THE Plugin_SDK SHALL use it directly as the catalog run function.
5. THE Plugin_SDK SHALL export `SingleProviderPluginOptions`, `SingleProviderPluginApiKeyAuthOptions`, and `SingleProviderPluginCatalogOptions` types.

---

### Requirement 29: Memory Host Core

**User Story:** As a developer, I want `src/plugin-sdk/` to re-export memory host helpers from `memory-host-core`, so that memory plugins can access host engine, storage, search, and status primitives through a single import.

**Referensi:** `referensi/openclaw/src/plugin-sdk/memory-core.ts`, `referensi/openclaw/src/plugin-sdk/memory-host-core.ts`

#### Acceptance Criteria

1. THE Plugin_SDK SHALL export memory host helpers including `MemoryHostCore`, `MemoryHostEvents`, `MemoryHostFiles`, `MemoryHostSearch`, and `MemoryHostStatus` types or interfaces.
2. THE Plugin_SDK SHALL export `MemoryPluginCapability`, `MemoryPluginPublicArtifact`, and `MemoryPluginPublicArtifactsProvider` types.
3. THE Plugin_SDK SHALL export `buildMemorySystemPromptAddition` and `delegateCompactionToRuntime` from the context-engine delegate module.
4. WHEN a memory plugin registers, THE Plugin_SDK SHALL provide access to host engine embeddings, storage, multimodal, query, secret, and status surfaces via the host core interface.

---

### Requirement 30: Config Schema Builders

**User Story:** As a developer, I want `src/plugin-sdk/` to provide config schema builder helpers, so that plugins can define their configuration schemas with type safety.

**Referensi:** `referensi/openclaw/src/plugin-sdk/core.ts`, `referensi/openclaw/src/plugin-sdk/config-schema.ts`

#### Acceptance Criteria

1. THE Plugin_SDK SHALL export `buildPluginConfigSchema(fields)` that returns a typed plugin config schema.
2. THE Plugin_SDK SHALL export `buildJsonPluginConfigSchema(fields)` for JSON-based config schemas.
3. THE Plugin_SDK SHALL export `emptyPluginConfigSchema` as a zero-field config schema constant.
4. THE Plugin_SDK SHALL export `buildChannelConfigSchema(fields)` and `buildJsonChannelConfigSchema(fields)` for channel-specific config schemas.
5. THE Plugin_SDK SHALL export `emptyChannelConfigSchema()` as a factory for zero-field channel config schemas.

---

### Requirement 31: Channel Config Helpers

**User Story:** As a developer, I want `src/plugin-sdk/` to provide channel config mutation helpers, so that channel account entries can be managed safely in the config.

**Referensi:** `referensi/openclaw/src/plugin-sdk/channel-config-helpers.ts`, `referensi/openclaw/src/plugin-sdk/config-mutation.ts`

#### Acceptance Criteria

1. THE Plugin_SDK SHALL export `clearAccountEntryFields(section, accountId)` that clears all fields for a given account in a channel config section.
2. THE Plugin_SDK SHALL export `deleteAccountFromConfigSection(section, accountId)` that removes an account entry from a channel config section.
3. THE Plugin_SDK SHALL export `setAccountEnabledInConfigSection(section, accountId, enabled)` that sets the enabled flag for an account.
4. THE Plugin_SDK SHALL export `applyAccountNameToChannelSection(section, accountId, name)` that sets the display name for an account.
5. THE Plugin_SDK SHALL export `migrateBaseNameToDefaultAccount(section)` that migrates legacy base-name config to the default account format.

---

### Requirement 32: Secure Random and Dedupe

**User Story:** As a developer, I want `src/plugin-sdk/` to export secure random and dedupe utilities, so that plugins can generate secure tokens and deduplicate messages without reimplementing these primitives.

**Referensi:** `referensi/openclaw/src/plugin-sdk/core.ts`, `referensi/openclaw/src/plugin-sdk/reply-dedupe.ts`, `referensi/openclaw/src/plugin-sdk/persistent-dedupe.ts`

#### Acceptance Criteria

1. THE Plugin_SDK SHALL export `generateSecureToken()` that returns a cryptographically secure random token string.
2. THE Plugin_SDK SHALL export `generateSecureUuid()` that returns a cryptographically secure UUID.
3. THE Plugin_SDK SHALL export `createDedupeCache(options)` that returns a cache for deduplicating messages by ID within a TTL window.
4. THE Plugin_SDK SHALL export `resolveGlobalDedupeCache()` that returns a process-level singleton dedupe cache.
5. WHEN a message ID has been seen within the TTL window, THE Plugin_SDK SHALL return `true` from the dedupe cache check.
6. THE Plugin_SDK SHALL export `PersistentDedupe` or equivalent for filesystem-backed deduplication across restarts.

---

### Requirement 33: Lazy Value and Caching Primitives

**User Story:** As a developer, I want `src/plugin-sdk/` to provide lazy value and caching primitives, so that expensive computations can be deferred and cached without manual memoization.

**Referensi:** `referensi/openclaw/src/plugin-sdk/lazy-value.ts`

#### Acceptance Criteria

1. THE Plugin_SDK SHALL export `createCachedLazyValueGetter(factory)` that returns a getter function which calls `factory` at most once and caches the result.
2. WHEN the factory is a plain value (not a function), THE Plugin_SDK SHALL return it directly without calling it.
3. WHEN the factory is a function, THE Plugin_SDK SHALL call it on first access and cache the result for subsequent calls.
4. THE Plugin_SDK SHALL export `LazyValue<T>` type representing either a `T` or `() => T`.

---

### Requirement 34: Gateway and Routing Utilities

**User Story:** As a developer, I want `src/plugin-sdk/` to export gateway bind URL resolution and routing utilities, so that plugins can resolve gateway addresses and session keys without duplicating logic.

**Referensi:** `referensi/openclaw/src/plugin-sdk/core.ts`, `referensi/openclaw/src/plugin-sdk/gateway-runtime.ts`

#### Acceptance Criteria

1. THE Plugin_SDK SHALL export `resolveGatewayBindUrl(cfg)` that returns a `GatewayBindUrlResult` with the resolved bind URL.
2. THE Plugin_SDK SHALL export `resolveGatewayPort(cfg)` that returns the configured gateway port.
3. THE Plugin_SDK SHALL export `buildAgentSessionKey(params)` that constructs a canonical agent session key string.
4. THE Plugin_SDK SHALL export `resolveThreadSessionKeys(params)` that returns `{ sessionKey, parentSessionKey }` for thread-aware routing.
5. THE Plugin_SDK SHALL export `DEFAULT_ACCOUNT_ID` constant and `normalizeAccountId(id)` helper.

---

### Requirement 35: Secret File Utilities

**User Story:** As a developer, I want `src/plugin-sdk/` to export secret file loading utilities, so that plugins can read secrets from files with size limits and error handling.

**Referensi:** `referensi/openclaw/src/plugin-sdk/core.ts`, `referensi/openclaw/src/plugin-sdk/secret-file-runtime.ts`

#### Acceptance Criteria

1. THE Plugin_SDK SHALL export `loadSecretFileSync(path, options?)` that reads a secret from a file synchronously, returning the trimmed content.
2. THE Plugin_SDK SHALL export `readSecretFileSync(path, options?)` that throws if the file exceeds `maxBytes` (default `DEFAULT_SECRET_FILE_MAX_BYTES`).
3. THE Plugin_SDK SHALL export `tryReadSecretFileSync(path, options?)` that returns `null` instead of throwing when the file is missing.
4. THE Plugin_SDK SHALL export `DEFAULT_SECRET_FILE_MAX_BYTES` constant.
5. WHEN a secret file exceeds the size limit, THE Plugin_SDK SHALL throw an error with a descriptive message including the file path and limit.

---

### Requirement 36: Subsystem Logger

**User Story:** As a developer, I want `src/plugin-sdk/` to export `createSubsystemLogger`, so that plugins can create structured loggers scoped to a named subsystem.

**Referensi:** `referensi/openclaw/src/plugin-sdk/core.ts`

#### Acceptance Criteria

1. THE Plugin_SDK SHALL export `createSubsystemLogger(subsystem, options?)` that returns a `Logger` with the subsystem name bound to every log entry.
2. WHEN a child logger is created from a subsystem logger, THE Plugin_SDK SHALL inherit the subsystem name in the child.
3. THE Plugin_SDK SHALL export `PluginLogger` type that matches the logger interface used by plugin contexts.

---

### Requirement 37: ACP Runtime Binding

**User Story:** As a developer, I want `src/plugin-sdk/` to provide ACP (Agent Communication Protocol) runtime binding resolution, so that plugins can resolve configured ACP bindings at runtime.

**Referensi:** `referensi/openclaw/src/plugin-sdk/acp-runtime-backend.ts`, `referensi/openclaw/src/plugin-sdk/acp-binding-resolve-runtime.ts`

#### Acceptance Criteria

1. THE Plugin_SDK SHALL export `resolveConfiguredAcpBindingRecord(cfg)` that returns the resolved ACP binding configuration.
2. THE Plugin_SDK SHALL export `ensureConfiguredAcpBindingReady(params)` that returns `{ ok: true }` or `{ ok: false; error: string }`.
3. WHEN the ACP binding is not configured, THE Plugin_SDK SHALL return `{ ok: false, error: 'ACP binding not configured' }`.
4. THE Plugin_SDK SHALL export `ResolvedConfiguredAcpBinding` type.

---

### Requirement 38: Channel Pairing Helpers

**User Story:** As a developer, I want `src/plugin-sdk/` to export channel pairing format helpers, so that plugins can format and parse pairing approval hints consistently.

**Referensi:** `referensi/openclaw/src/plugin-sdk/core.ts`, `referensi/openclaw/src/plugin-sdk/channel-setup.ts`

#### Acceptance Criteria

1. THE Plugin_SDK SHALL export `formatPairingApproveHint(params)` that returns a formatted string for pairing approval hints.
2. THE Plugin_SDK SHALL export `parseOptionalDelimitedEntries(value, delimiter?)` that parses a delimited string into an array of trimmed non-empty entries.
3. WHEN `value` is null or undefined, THE Plugin_SDK SHALL return an empty array from `parseOptionalDelimitedEntries`.
4. THE Plugin_SDK SHALL export `normalizeAtHashSlug(value)` and `normalizeHyphenSlug(value)` string normalization helpers.

---

### Requirement 39: Action Gate and Tool Helpers

**User Story:** As a developer, I want `src/plugin-sdk/` to export action gate and tool parameter helpers, so that agent tools can validate inputs and gate actions consistently.

**Referensi:** `referensi/openclaw/src/plugin-sdk/core.ts`, `referensi/openclaw/src/plugin-sdk/provider-tools.ts`

#### Acceptance Criteria

1. THE Plugin_SDK SHALL export `createActionGate(options)` that returns a gate object for controlling whether an action is allowed.
2. THE Plugin_SDK SHALL export `jsonResult(value)` that serializes a value to a JSON tool result string.
3. THE Plugin_SDK SHALL export `readStringParam(params, key)`, `readNumberParam(params, key)`, `readStringArrayParam(params, key)`, and `readReactionParams(params)` tool parameter readers.
4. THE Plugin_SDK SHALL export `parseStrictPositiveInteger(value)` that returns a positive integer or throws for invalid input.
5. WHEN a required parameter is missing, THE Plugin_SDK SHALL throw a descriptive error from the parameter reader.

---

### Requirement 40: Security and Network Utilities

**User Story:** As a developer, I want `src/plugin-sdk/` to export security and network utilities, so that plugins can validate proxy addresses, resolve client IPs, and format timestamps.

**Referensi:** `referensi/openclaw/src/plugin-sdk/core.ts`, `referensi/openclaw/src/plugin-sdk/security-runtime.ts`

#### Acceptance Criteria

1. THE Plugin_SDK SHALL export `isTrustedProxyAddress(address, trustedProxies)` that returns true when the address is in the trusted proxy list.
2. THE Plugin_SDK SHALL export `resolveClientIp(request, trustedProxies)` that returns the real client IP from forwarded headers when the proxy is trusted.
3. THE Plugin_SDK SHALL export `formatZonedTimestamp(date, timezone)` that returns a human-readable timestamp string in the given timezone.
4. THE Plugin_SDK SHALL export `collectProviderDangerousNameMatchingScopes(cfg)` that returns a list of dangerous name-matching scope configurations.

---

### Requirement 41: Runtime Error and Unhandled Rejection Handlers

**User Story:** As a developer, I want `src/plugin-sdk/` to export runtime error registration helpers, so that the runtime app can register global uncaught exception and unhandled rejection handlers.

**Referensi:** `referensi/openclaw/src/plugin-sdk/runtime.ts`, `referensi/openclaw/src/plugin-sdk/error-runtime.ts`

#### Acceptance Criteria

1. THE Plugin_SDK SHALL export `registerUncaughtExceptionHandler(logger)` that registers a `process.on('uncaughtException', ...)` handler that logs and exits.
2. THE Plugin_SDK SHALL export `registerUnhandledRejectionHandler(logger)` that registers a `process.on('unhandledRejection', ...)` handler that logs without exiting.
3. THE Plugin_SDK SHALL export `createNonExitingRuntime(options)` that returns a runtime that does not call `process.exit` on fatal errors.
4. THE Plugin_SDK SHALL export `defaultRuntime` as the standard runtime instance.
5. THE Plugin_SDK SHALL export `resolveRuntimeEnv(env)` and `resolveRuntimeEnvWithUnavailableExit(env)` for resolving runtime environment configuration.

---

### Requirement 42: Backup and Plugin Install Path Utilities

**User Story:** As a developer, I want `src/plugin-sdk/` to export backup archive creation and plugin install path warning helpers, so that the runtime can create backups and warn about misconfigured plugin paths.

**Referensi:** `referensi/openclaw/src/plugin-sdk/runtime.ts`

#### Acceptance Criteria

1. THE Plugin_SDK SHALL export `createBackupArchive(options)` that creates a compressed archive of a directory.
2. THE Plugin_SDK SHALL export `detectPluginInstallPathIssue(pluginDir)` that returns an issue description when the plugin directory is misconfigured.
3. THE Plugin_SDK SHALL export `formatPluginInstallPathIssue(issue)` that returns a human-readable string for a plugin install path issue.

---

### Requirement 43: Tailscale Status Utility

**User Story:** As a developer, I want `src/plugin-sdk/` to export Tailscale status resolution, so that the runtime can detect Tailnet host availability for gateway binding.

**Referensi:** `referensi/openclaw/src/plugin-sdk/core.ts`

#### Acceptance Criteria

1. THE Plugin_SDK SHALL export `resolveTailnetHostWithRunner(runner)` that returns the Tailnet hostname if Tailscale is active.
2. THE Plugin_SDK SHALL export `TailscaleStatusCommandResult` and `TailscaleStatusCommandRunner` types.
3. WHEN Tailscale is not running or not installed, THE Plugin_SDK SHALL return `null` from `resolveTailnetHostWithRunner`.

---

### Requirement 45: No Stub Implementations

**User Story:** As a developer, I want every module in `src/plugin-sdk/` and all adapted modules to have real working implementations, so that the codebase is actually runnable and not just a collection of type definitions.

#### Acceptance Criteria

1. THE Adaptation_System SHALL NOT produce files that contain only `export type` declarations without any runtime-executable code — every module MUST export at least one function, class, or constant with real behavior.
2. WHEN a module currently contains only type definitions or placeholder comments (e.g., `// TODO`, `// stub`, `// placeholder`, empty function bodies), THE Adaptation_System SHALL replace it with a real implementation adapted from the corresponding referensi file.
3. THE Adaptation_System SHALL NOT use empty function bodies (`() => {}`) or functions that only `throw new Error('not implemented')` as the final implementation — these are only acceptable as temporary scaffolding during active development of that specific function.
4. WHEN a function is exported, it SHALL have a complete implementation that matches the behavior described in its requirement's acceptance criteria, not just a type-correct signature.
5. THE Adaptation_System SHALL NOT leave `index.ts` files that only re-export types from other modules without any concrete implementation in the module itself.
6. WHEN adapting from referensi, THE Adaptation_System SHALL carry over the actual logic — state machines, validation rules, queue mechanics, retry loops, etc. — not just the type shapes.
7. THE Adaptation_System SHALL verify that `bun test` passes on the implemented module before marking it complete — a module with only type exports will have no passing behavior tests and SHALL be considered incomplete.
8. WHEN a module has a colocated `*.test.ts`, the tests SHALL exercise real behavior (return values, side effects, error paths) — tests that only check `typeof fn === 'function'` or that a type compiles SHALL be considered insufficient.

---

### Requirement 44: Plugin SDK Index Barrel

**User Story:** As a developer, I want `src/plugin-sdk/index.ts` to re-export all public contracts from the plugin SDK sub-modules, so that consumers can import from a single entry point.

**Referensi:** `referensi/openclaw/src/plugin-sdk/index.ts`

#### Acceptance Criteria

1. THE Plugin_SDK index SHALL re-export all types and functions from `plugin-entry`, `channel-core`, `provider-entry`, `memory-core`, `approval-renderers`, `keyed-async-queue`, and all other public sub-modules.
2. THE Plugin_SDK index SHALL NOT re-export platform-specific modules (iOS, macOS native, browser extension, OpenClaw product-specific flows).
3. WHEN a type is re-exported from multiple sub-modules, THE Plugin_SDK index SHALL resolve the conflict by choosing the most general definition.
4. THE Plugin_SDK index SHALL export `PluginKind`, `PluginContext`, `ProviderPlugin`, `ChannelPlugin`, `ToolPlugin`, `RuntimePlugin`, and `PluginFactory` as the core plugin contract types.
5. THE Plugin_SDK index SHALL be the single import point for all plugin SDK consumers in `src/runtime-app/`, `src/agents/`, and `src/channels/`.

---

## Telegram Channel Extension

Requirements berikut mengadaptasi `referensi/openclaw/extensions/telegram/` ke `src/channels/telegram/`. Semua module harus reusable — tidak boleh satu file monolitik. Setiap sub-module punya tanggung jawab tunggal dan colocated `*.test.ts`.

---

### Requirement 46: Telegram Token Resolution

**User Story:** As a developer, I want `src/channels/telegram/token.ts` to resolve a Telegram bot token from env, config, or secret file, so that token sourcing is centralized and testable.

**Referensi:** `referensi/openclaw/extensions/telegram/src/token.ts`

#### Acceptance Criteria

1. THE Telegram_Token_Module SHALL export `resolveTelegramToken(params)` that returns `TelegramTokenResolution` with `status`, `value`, and `source` fields.
2. WHEN `TOKEN_TELE` env var is set, THE Telegram_Token_Module SHALL use it as the token with `source: 'env'`.
3. WHEN a token file path is configured, THE Telegram_Token_Module SHALL read the file using `tryReadSecretFileSync` with `source: 'tokenFile'`.
4. WHEN a token is found in config, THE Telegram_Token_Module SHALL use it with `source: 'config'`.
5. WHEN no token is found from any source, THE Telegram_Token_Module SHALL return `status: 'missing'` with `source: 'none'`.
6. THE Telegram_Token_Module SHALL export `TelegramTokenResolution` type.
7. WHEN a token value is present, THE Telegram_Token_Module SHALL normalize it by trimming whitespace before returning.

---

### Requirement 47: Telegram API Fetch Transport

**User Story:** As a developer, I want `src/channels/telegram/fetch.ts` to provide a configurable HTTP transport for Telegram API calls, so that proxy, DNS pinning, and connection pool settings are centralized.

**Referensi:** `referensi/openclaw/extensions/telegram/src/fetch.ts`

#### Acceptance Criteria

1. THE Telegram_Fetch_Module SHALL export `resolveTelegramTransport(config?)` that returns a fetch function configured for the Telegram API.
2. WHEN no config is provided, THE Telegram_Fetch_Module SHALL return the global `fetch` as the transport.
3. WHEN a proxy URL is configured, THE Telegram_Fetch_Module SHALL create a `ProxyAgent`-backed fetch.
4. THE Telegram_Fetch_Module SHALL apply connection pool limits: max 10 connections per origin, keep-alive timeout 30s, no HTTP/2.
5. THE Telegram_Fetch_Module SHALL export `normalizeTelegramApiRoot(apiRoot?)` that returns the base API URL, defaulting to `https://api.telegram.org`.
6. WHEN the transport is created, THE Telegram_Fetch_Module SHALL log the resolved transport mode via the subsystem logger `telegram/network`.

---

### Requirement 48: Telegram Message Normalization

**User Story:** As a developer, I want `src/channels/telegram/normalize.ts` to normalize Telegram target strings, so that chat IDs and thread IDs are consistently formatted across the codebase.

**Referensi:** `referensi/openclaw/extensions/telegram/src/normalize.ts`

#### Acceptance Criteria

1. THE Telegram_Normalize_Module SHALL export `normalizeTelegramMessagingTarget(raw)` that returns a normalized `telegram:<chatId>` string or `undefined` for invalid input.
2. WHEN the input has a `telegram:` or `tg:` prefix, THE Telegram_Normalize_Module SHALL strip it before normalizing.
3. WHEN a thread ID is present, THE Telegram_Normalize_Module SHALL append it as `:<threadId>` or `:topic:<threadId>` based on the original format.
4. THE Telegram_Normalize_Module SHALL export `looksLikeTelegramTargetId(raw)` that returns `true` when the string can be normalized to a valid Telegram target.
5. WHEN the chat ID portion is empty after stripping prefix, THE Telegram_Normalize_Module SHALL return `undefined`.
6. THE Telegram_Normalize_Module SHALL lowercase the final normalized string.

---

### Requirement 49: Telegram Update Offset Store

**User Story:** As a developer, I want `src/channels/telegram/update-offset-store.ts` to persist the last processed Telegram update ID to disk, so that the bot does not reprocess updates after restart.

**Referensi:** `referensi/openclaw/extensions/telegram/src/update-offset-store.ts`

#### Acceptance Criteria

1. THE Telegram_Offset_Store SHALL export `createTelegramUpdateOffsetStore(accountId?, env?)` that returns a store with `read()` and `write(updateId)` methods.
2. WHEN `read()` is called and no file exists, THE Telegram_Offset_Store SHALL return `null` without throwing.
3. WHEN `write(updateId)` is called, THE Telegram_Offset_Store SHALL atomically write the state to `<stateDir>/telegram/update-offset-<accountId>.json`.
4. THE Telegram_Offset_Store SHALL store `version`, `lastUpdateId`, `botId`, and `tokenFingerprint` in the state file.
5. WHEN the stored file has a mismatched `tokenFingerprint`, THE Telegram_Offset_Store SHALL return `null` from `read()` and treat the offset as reset.
6. WHEN the stored `version` does not match `STORE_VERSION`, THE Telegram_Offset_Store SHALL return `null` and not use the stale state.
7. THE Telegram_Offset_Store SHALL export `resolveTelegramUpdateOffsetPath(accountId?, env?)` as a pure path resolver.

---

### Requirement 50: Telegram Polling Status Publisher

**User Story:** As a developer, I want `src/channels/telegram/polling-status.ts` to publish polling lifecycle events to a status sink, so that the operator dashboard can reflect real-time polling health.

**Referensi:** `referensi/openclaw/extensions/telegram/src/polling-status.ts`

#### Acceptance Criteria

1. THE Telegram_Polling_Status_Module SHALL export `createTelegramPollingStatusPublisher(setStatus?)` that returns an object with `notePollingStart()`, `notePollSuccess(at?)`, and `notePollingStop()` methods.
2. WHEN `notePollingStart()` is called, THE Telegram_Polling_Status_Module SHALL publish `{ mode: 'polling', connected: false, lastConnectedAt: null, lastEventAt: null, lastTransportActivityAt: null }`.
3. WHEN `notePollSuccess(at)` is called, THE Telegram_Polling_Status_Module SHALL publish a connected status patch with `mode: 'polling'` and `lastError: null`.
4. WHEN `notePollingStop()` is called, THE Telegram_Polling_Status_Module SHALL publish `{ mode: 'polling', connected: false }`.
5. WHEN `setStatus` is not provided, THE Telegram_Polling_Status_Module SHALL create the publisher without throwing — all methods SHALL be no-ops.

---

### Requirement 51: Telegram Error Policy

**User Story:** As a developer, I want `src/channels/telegram/error-policy.ts` to resolve the error reporting policy for a Telegram account/group/topic, so that noisy errors can be silenced or rate-limited per conversation scope.

**Referensi:** `referensi/openclaw/extensions/telegram/src/error-policy.ts`

#### Acceptance Criteria

1. THE Telegram_Error_Policy_Module SHALL export `resolveTelegramErrorPolicy(params)` that returns `{ policy, cooldownMs }`.
2. WHEN `policy` is `'always'`, errors SHALL always be reported to the chat.
3. WHEN `policy` is `'once'`, errors SHALL only be reported once per `cooldownMs` window per scope key.
4. WHEN `policy` is `'silent'`, errors SHALL never be reported to the chat.
5. THE Telegram_Error_Policy_Module SHALL export `buildTelegramErrorScopeKey(params)` that returns a string key combining `accountId`, `chatId`, and `threadId`.
6. WHEN `cooldownMs` is not configured, THE Telegram_Error_Policy_Module SHALL default to 4 hours (14400000 ms).
7. THE Telegram_Error_Policy_Module SHALL export `shouldReportTelegramError(scopeKey, policy, cooldownMs, now?)` that returns `true` when the error should be reported given the policy and cooldown state.

---

### Requirement 52: Telegram Draft Chunking

**User Story:** As a developer, I want `src/channels/telegram/draft-chunking.ts` to resolve streaming draft chunk size settings, so that streamed responses are split at appropriate boundaries for Telegram's message limits.

**Referensi:** `referensi/openclaw/extensions/telegram/src/draft-chunking.ts`

#### Acceptance Criteria

1. THE Telegram_Draft_Chunking_Module SHALL export `resolveTelegramDraftStreamingChunking(cfg?, accountId?)` that returns `{ minChars, maxChars, breakPreference }`.
2. WHEN no config is provided, THE Telegram_Draft_Chunking_Module SHALL default to `minChars: 200`, `maxChars: 800`, `breakPreference: 'paragraph'`.
3. WHEN `maxChars` exceeds the Telegram text chunk limit, THE Telegram_Draft_Chunking_Module SHALL cap it at the limit.
4. WHEN `minChars` exceeds `maxChars`, THE Telegram_Draft_Chunking_Module SHALL clamp `minChars` to `maxChars`.
5. THE Telegram_Draft_Chunking_Module SHALL support `breakPreference` values `'paragraph'`, `'newline'`, and `'sentence'`.

---

### Requirement 53: Telegram Draft Stream

**User Story:** As a developer, I want `src/channels/telegram/draft-stream.ts` to provide a streaming draft message controller, so that long AI responses can be progressively edited in Telegram as they stream in.

**Referensi:** `referensi/openclaw/extensions/telegram/src/draft-stream.ts`

#### Acceptance Criteria

1. THE Telegram_Draft_Stream_Module SHALL export `createTelegramDraftStream(params)` that returns a `TelegramDraftStream` object.
2. THE `TelegramDraftStream` SHALL have `update(text)`, `flush()`, `stop()`, `clear()`, `messageId()`, and `forceNewMessage()` methods.
3. WHEN `update(text)` is called, THE Telegram_Draft_Stream_Module SHALL throttle edits to avoid hitting Telegram rate limits.
4. WHEN `stop()` is called, THE Telegram_Draft_Stream_Module SHALL flush any pending text and finalize the message.
5. WHEN `clear()` is called, THE Telegram_Draft_Stream_Module SHALL delete the preview message if one exists.
6. WHEN `forceNewMessage()` is called, THE Telegram_Draft_Stream_Module SHALL reset internal state so the next `update` creates a new message.
7. WHEN a message thread is not found (400 error), THE Telegram_Draft_Stream_Module SHALL fall back to sending without a thread ID.
8. THE Telegram_Draft_Stream_Module SHALL export `TelegramDraftStream` type.

---

### Requirement 54: Telegram Update Deduplication

**User Story:** As a developer, I want `src/channels/telegram/bot-updates.ts` to provide update key generation and deduplication, so that duplicate Telegram updates (e.g., from retries) are not processed twice.

**Referensi:** `referensi/openclaw/extensions/telegram/src/bot-updates.ts`

#### Acceptance Criteria

1. THE Telegram_Updates_Module SHALL export `buildTelegramUpdateKey(ctx)` that returns a unique string key for a Telegram update context.
2. WHEN the context has an `update_id`, THE Telegram_Updates_Module SHALL return `update:<updateId>`.
3. WHEN the context has a `callbackQuery.id`, THE Telegram_Updates_Module SHALL return `callback:<callbackId>`.
4. WHEN the context has an edited message, THE Telegram_Updates_Module SHALL return `edited-message:<chatId>:<messageId>`.
5. THE Telegram_Updates_Module SHALL export `resolveTelegramUpdateId(ctx)` that extracts the numeric update ID from a context.
6. THE Telegram_Updates_Module SHALL export `createTelegramUpdateDedupeCache()` that returns a dedupe cache with TTL of 5 minutes and max 2000 entries.

---

### Requirement 55: Telegram Send Module

**User Story:** As a developer, I want `src/channels/telegram/send.ts` to provide the core outbound message sending functions, so that text, media, polls, and reactions can be sent to Telegram chats through a single reusable interface.

**Referensi:** `referensi/openclaw/extensions/telegram/src/send.ts`

#### Acceptance Criteria

1. THE Telegram_Send_Module SHALL export `sendTelegramText(params)` that sends a text message to a Telegram chat and returns `{ messageId, chatId }`.
2. THE Telegram_Send_Module SHALL export `sendTelegramMedia(params)` that sends a photo, video, audio, document, or sticker based on MIME type.
3. THE Telegram_Send_Module SHALL export `sendTelegramPoll(params)` that sends a Telegram poll and returns `{ messageId, chatId }`.
4. WHEN a message exceeds 4096 characters, THE Telegram_Send_Module SHALL split it into chunks and send each chunk sequentially.
5. WHEN a send fails with a retryable error (rate limit, server error), THE Telegram_Send_Module SHALL retry with exponential backoff.
6. THE Telegram_Send_Module SHALL accept an optional `threadId` parameter and include `message_thread_id` in the API call when provided.
7. THE Telegram_Send_Module SHALL export `buildInlineKeyboard(buttons)` for constructing inline keyboard markup.
8. WHEN HTML parse mode is used, THE Telegram_Send_Module SHALL sanitize the text through `renderTelegramHtmlText` before sending.

---

### Requirement 56: Telegram Channel Module Index

**User Story:** As a developer, I want `src/channels/telegram/index.ts` to re-export all public contracts from the Telegram channel sub-modules, so that consumers import from one place.

**Referensi:** `referensi/openclaw/extensions/telegram/index.ts`

#### Acceptance Criteria

1. THE Telegram_Channel_Index SHALL re-export `resolveTelegramToken`, `TelegramTokenResolution` from `token.ts`.
2. THE Telegram_Channel_Index SHALL re-export `resolveTelegramTransport`, `normalizeTelegramApiRoot` from `fetch.ts`.
3. THE Telegram_Channel_Index SHALL re-export `normalizeTelegramMessagingTarget`, `looksLikeTelegramTargetId` from `normalize.ts`.
4. THE Telegram_Channel_Index SHALL re-export `createTelegramUpdateOffsetStore` from `update-offset-store.ts`.
5. THE Telegram_Channel_Index SHALL re-export `createTelegramPollingStatusPublisher` from `polling-status.ts`.
6. THE Telegram_Channel_Index SHALL re-export `resolveTelegramErrorPolicy`, `buildTelegramErrorScopeKey`, `shouldReportTelegramError` from `error-policy.ts`.
7. THE Telegram_Channel_Index SHALL re-export `resolveTelegramDraftStreamingChunking` from `draft-chunking.ts`.
8. THE Telegram_Channel_Index SHALL re-export `createTelegramDraftStream`, `TelegramDraftStream` from `draft-stream.ts`.
9. THE Telegram_Channel_Index SHALL re-export `buildTelegramUpdateKey`, `resolveTelegramUpdateId`, `createTelegramUpdateDedupeCache` from `bot-updates.ts`.
10. THE Telegram_Channel_Index SHALL re-export `sendTelegramText`, `sendTelegramMedia`, `sendTelegramPoll`, `buildInlineKeyboard` from `send.ts`.
11. THE Telegram_Channel_Index SHALL NOT re-export OpenClaw-specific types (`OpenClawConfig`, `OpenClawPluginApi`) — these SHALL be replaced with project-neutral equivalents.
12. EACH sub-module SHALL have a colocated `*.test.ts` with behavior tests before the index is considered complete.

---

## WhatsApp Channel Extension

Requirements berikut mengadaptasi `referensi/openclaw/extensions/whatsapp/` ke `src/channels/whatsapp/`. Semua module harus reusable dengan tanggung jawab tunggal. **Dilarang keras menghasilkan file yang hanya berisi type definitions atau stub kosong** — setiap module wajib punya implementasi nyata yang diadaptasi dari referensi dan colocated `*.test.ts` dengan behavior tests.

---

### Requirement 57: WhatsApp Target Normalization

**User Story:** As a developer, I want `src/channels/whatsapp/normalize-target.ts` to normalize WhatsApp JID and phone number targets, so that all target strings are consistently formatted before use.

**Referensi:** `referensi/openclaw/extensions/whatsapp/src/normalize-target.ts`, `referensi/openclaw/extensions/whatsapp/src/normalize.ts`

#### Acceptance Criteria

1. THE WhatsApp_Normalize_Module SHALL export `normalizeWhatsAppMessagingTarget(raw)` that returns a normalized `whatsapp:<jid>` string or `undefined` for invalid input.
2. THE WhatsApp_Normalize_Module SHALL export `isWhatsAppGroupJid(value)` that returns `true` when the value ends with `@g.us` and has a valid numeric local part.
3. THE WhatsApp_Normalize_Module SHALL export `isWhatsAppNewsletterJid(value)` that returns `true` for `<number>@newsletter` JIDs.
4. THE WhatsApp_Normalize_Module SHALL export `isWhatsAppUserTarget(value)` that returns `true` for `@s.whatsapp.net`, `@c.us`, and `@lid` JIDs.
5. THE WhatsApp_Normalize_Module SHALL export `looksLikeWhatsAppTargetId(raw)` that returns `true` when the string can be normalized to a valid WhatsApp target.
6. THE WhatsApp_Normalize_Module SHALL export `normalizeWhatsAppAllowFromEntry(raw)` that normalizes an allowlist entry to a canonical JID or E.164 phone number.
7. WHEN the input has a `whatsapp:` prefix, THE WhatsApp_Normalize_Module SHALL strip it before normalizing.
8. THE WhatsApp_Normalize_Module SHALL NOT produce stubs — all functions SHALL have complete normalization logic adapted from the referensi.

---

### Requirement 58: WhatsApp Socket Timing

**User Story:** As a developer, I want `src/channels/whatsapp/socket-timing.ts` to resolve WebSocket connection timing parameters, so that keep-alive, connect timeout, and query timeout are configurable per account.

**Referensi:** `referensi/openclaw/extensions/whatsapp/src/socket-timing.ts`

#### Acceptance Criteria

1. THE WhatsApp_Socket_Timing_Module SHALL export `resolveWhatsAppSocketTiming(cfg, overrides?)` that returns `{ keepAliveIntervalMs, connectTimeoutMs, defaultQueryTimeoutMs }`.
2. THE WhatsApp_Socket_Timing_Module SHALL export `DEFAULT_WHATSAPP_SOCKET_TIMING` with values `keepAliveIntervalMs: 25000`, `connectTimeoutMs: 60000`, `defaultQueryTimeoutMs: 60000`.
3. WHEN a config value is not a positive integer, THE WhatsApp_Socket_Timing_Module SHALL fall back to the default.
4. WHEN `overrides` are provided, THE WhatsApp_Socket_Timing_Module SHALL prefer them over config values.
5. THE WhatsApp_Socket_Timing_Module SHALL export `WhatsAppSocketTimingOptions` type.
6. THE WhatsApp_Socket_Timing_Module SHALL NOT be a stub — `resolveWhatsAppSocketTiming` SHALL implement the full merge and validation logic.

---

### Requirement 59: WhatsApp Reconnect Policy

**User Story:** As a developer, I want `src/channels/whatsapp/reconnect.ts` to provide reconnect backoff policy resolution, so that dropped connections retry with exponential backoff and a configurable max attempt count.

**Referensi:** `referensi/openclaw/extensions/whatsapp/src/reconnect.ts`

#### Acceptance Criteria

1. THE WhatsApp_Reconnect_Module SHALL export `resolveReconnectPolicy(cfg, overrides?)` that returns a `ReconnectPolicy` with `initialMs`, `maxMs`, `factor`, `jitter`, and `maxAttempts`.
2. THE WhatsApp_Reconnect_Module SHALL export `DEFAULT_RECONNECT_POLICY` with `initialMs: 2000`, `maxMs: 30000`, `factor: 1.8`, `jitter: 0.25`, `maxAttempts: 12`.
3. WHEN merged values are out of bounds, THE WhatsApp_Reconnect_Module SHALL clamp them: `factor` in `[1.1, 10]`, `jitter` in `[0, 1]`, `initialMs` minimum 250ms.
4. THE WhatsApp_Reconnect_Module SHALL export `resolveHeartbeatSeconds(cfg, overrideSeconds?)` that returns the heartbeat interval, defaulting to `DEFAULT_HEARTBEAT_SECONDS = 60`.
5. THE WhatsApp_Reconnect_Module SHALL export `ReconnectPolicy` type.
6. THE WhatsApp_Reconnect_Module SHALL NOT be a stub — all merge and clamp logic SHALL be implemented.

---

### Requirement 60: WhatsApp Group Session Key

**User Story:** As a developer, I want `src/channels/whatsapp/group-session-key.ts` to resolve group session keys scoped by account, so that multi-account group conversations are routed to the correct session.

**Referensi:** `referensi/openclaw/extensions/whatsapp/src/group-session-key.ts`

#### Acceptance Criteria

1. THE WhatsApp_Group_Session_Module SHALL export `resolveWhatsAppGroupSessionRoute(route)` that appends an account-scoped thread suffix to the session key for non-default accounts.
2. WHEN `route.accountId` is the default account ID, THE WhatsApp_Group_Session_Module SHALL return the route unchanged.
3. WHEN the session key does not contain `:group:`, THE WhatsApp_Group_Session_Module SHALL return the route unchanged.
4. THE WhatsApp_Group_Session_Module SHALL export `resolveWhatsAppLegacyGroupSessionKey(params)` that strips the account thread suffix from a legacy session key, returning `null` if not applicable.
5. THE WhatsApp_Group_Session_Module SHALL NOT be a stub — both functions SHALL implement the full session key transformation logic.

---

### Requirement 61: WhatsApp Inbound Message Extraction

**User Story:** As a developer, I want `src/channels/whatsapp/inbound/extract.ts` to extract normalized message content from raw Baileys proto messages, so that text, media, location, and contact payloads are handled uniformly.

**Referensi:** `referensi/openclaw/extensions/whatsapp/src/inbound/extract.ts`

#### Acceptance Criteria

1. THE WhatsApp_Extract_Module SHALL export `extractWhatsAppMessageContent(message)` that returns the unwrapped inner message after stripping ephemeral, viewOnce, and other wrapper types.
2. THE WhatsApp_Extract_Module SHALL export `resolveWhatsAppMessageText(message)` that returns the text body from conversation, extendedText, caption, or button response fields.
3. THE WhatsApp_Extract_Module SHALL export `resolveWhatsAppMessageKind(message)` that returns a discriminated kind: `'text'`, `'image'`, `'video'`, `'audio'`, `'document'`, `'sticker'`, `'location'`, `'contact'`, or `'unknown'`.
4. WHEN a message is wrapped in `ephemeralMessage` or `viewOnceMessage`, THE WhatsApp_Extract_Module SHALL unwrap it before extracting content.
5. THE WhatsApp_Extract_Module SHALL NOT be a stub — all extraction logic SHALL be implemented.

---

### Requirement 62: WhatsApp Inbound Access Control

**User Story:** As a developer, I want `src/channels/whatsapp/inbound/access-control.ts` to check whether an inbound message is allowed based on the allowlist policy, so that unauthorized senders are rejected before processing.

**Referensi:** `referensi/openclaw/extensions/whatsapp/src/inbound/access-control.ts`

#### Acceptance Criteria

1. THE WhatsApp_Access_Control_Module SHALL export `checkInboundAccessControl(params)` that returns `Promise<InboundAccessControlResult>` with `allowed`, `shouldMarkRead`, `isSelfChat`, and `resolvedAccountId`.
2. WHEN the sender is the bot itself (`isFromMe: true`), THE WhatsApp_Access_Control_Module SHALL return `{ allowed: false, isSelfChat: true }`.
3. WHEN the sender is not in the allowlist and pairing grace period has expired, THE WhatsApp_Access_Control_Module SHALL return `{ allowed: false }`.
4. WHEN the sender is in the allowlist, THE WhatsApp_Access_Control_Module SHALL return `{ allowed: true }`.
5. THE WhatsApp_Access_Control_Module SHALL export `InboundAccessControlResult` type.
6. THE WhatsApp_Access_Control_Module SHALL NOT be a stub — the full access control logic including pairing grace period SHALL be implemented.

---

### Requirement 63: WhatsApp Inbound Deduplication

**User Story:** As a developer, I want `src/channels/whatsapp/inbound/dedupe.ts` to deduplicate inbound and outbound WhatsApp messages, so that duplicate deliveries from the Baileys socket are not processed twice.

**Referensi:** `referensi/openclaw/extensions/whatsapp/src/inbound/dedupe.ts`

#### Acceptance Criteria

1. THE WhatsApp_Dedupe_Module SHALL export `claimInboundWhatsAppMessage(key)` that returns `true` on first claim and `false` on subsequent claims within the TTL window (20 minutes, max 5000 entries).
2. THE WhatsApp_Dedupe_Module SHALL export `recordOutboundWhatsAppMessage(key, now?)` that records a sent message key to prevent echo processing.
3. THE WhatsApp_Dedupe_Module SHALL export `isRecentOutboundWhatsAppMessage(key, now?)` that returns `true` when the key was recorded within the TTL window.
4. WHEN the cache exceeds `maxSize`, THE WhatsApp_Dedupe_Module SHALL evict the oldest entry.
5. THE WhatsApp_Dedupe_Module SHALL NOT be a stub — both caches SHALL be implemented with real TTL and size-bounded eviction logic.

---

### Requirement 64: WhatsApp Send Module

**User Story:** As a developer, I want `src/channels/whatsapp/send.ts` to provide outbound message sending functions, so that text, media, and poll messages can be sent to WhatsApp chats through a single reusable interface.

**Referensi:** `referensi/openclaw/extensions/whatsapp/src/send.ts`

#### Acceptance Criteria

1. THE WhatsApp_Send_Module SHALL export `sendWhatsAppText(params)` that sends a text message via the active Baileys socket and returns `{ messageId, jid }`.
2. THE WhatsApp_Send_Module SHALL export `sendWhatsAppMedia(params)` that sends image, video, audio, or document media with an optional caption.
3. WHEN the target is a newsletter JID, THE WhatsApp_Send_Module SHALL use the newsletter send path instead of the standard message path.
4. WHEN markdown table mode is enabled, THE WhatsApp_Send_Module SHALL convert markdown tables before sending.
5. THE WhatsApp_Send_Module SHALL export `sendWhatsAppReaction(params)` that sends an emoji reaction to a specific message.
6. WHEN no active connection exists for the account, THE WhatsApp_Send_Module SHALL throw a descriptive error with the account ID.
7. THE WhatsApp_Send_Module SHALL NOT be a stub — all send functions SHALL have complete implementations.

---

### Requirement 65: WhatsApp Auth Store

**User Story:** As a developer, I want `src/channels/whatsapp/auth-store.ts` to manage Baileys multi-file auth state persistence, so that WhatsApp sessions survive process restarts.

**Referensi:** `referensi/openclaw/extensions/whatsapp/src/auth-store.runtime.ts`, `referensi/openclaw/extensions/whatsapp/src/creds-persistence.ts`, `referensi/openclaw/extensions/whatsapp/src/creds-files.ts`

#### Acceptance Criteria

1. THE WhatsApp_Auth_Store_Module SHALL export `resolveWebCredsPath(accountId, env?)` that returns the path to the credentials JSON file.
2. THE WhatsApp_Auth_Store_Module SHALL export `resolveWebCredsBackupPath(accountId, env?)` that returns the path to the backup credentials file.
3. THE WhatsApp_Auth_Store_Module SHALL export `readCredsJsonRaw(accountId, env?)` that reads the raw credentials JSON, returning `null` if missing.
4. THE WhatsApp_Auth_Store_Module SHALL export `writeCredsJsonAtomically(accountId, data, env?)` that writes credentials atomically using a temp file and rename.
5. THE WhatsApp_Auth_Store_Module SHALL export `restoreCredsFromBackupIfNeeded(accountId, env?)` that copies the backup over the main file when the main file is missing or corrupt.
6. THE WhatsApp_Auth_Store_Module SHALL export `enqueueCredsSave(accountId, data, env?)` that serializes credential writes per account using a keyed async queue.
7. THE WhatsApp_Auth_Store_Module SHALL NOT be a stub — all file I/O functions SHALL be implemented.

---

### Requirement 66: WhatsApp Connection Controller

**User Story:** As a developer, I want `src/channels/whatsapp/connection-controller.ts` to manage the Baileys WebSocket connection lifecycle, so that connect, disconnect, and reconnect are handled with proper backoff and state tracking.

**Referensi:** `referensi/openclaw/extensions/whatsapp/src/connection-controller.ts`, `referensi/openclaw/extensions/whatsapp/src/connection-controller-registry.ts`

#### Acceptance Criteria

1. THE WhatsApp_Connection_Controller_Module SHALL export `createWhatsAppConnectionController(params)` that returns a controller with `connect()`, `disconnect()`, and `getActiveListener()` methods.
2. WHEN `connect()` is called and the connection drops, THE WhatsApp_Connection_Controller_Module SHALL reconnect using the policy from `resolveReconnectPolicy`.
3. WHEN `maxAttempts` is reached, THE WhatsApp_Connection_Controller_Module SHALL stop reconnecting and emit a `max-attempts-reached` event.
4. THE WhatsApp_Connection_Controller_Module SHALL export `registerWhatsAppConnectionController(accountId, controller)` and `getRegisteredWhatsAppConnectionController(accountId)` for the global registry.
5. THE WhatsApp_Connection_Controller_Module SHALL export `unregisterWhatsAppConnectionController(accountId)` that removes the controller from the registry.
6. THE WhatsApp_Connection_Controller_Module SHALL NOT be a stub — connect/disconnect/reconnect logic SHALL be implemented.

---

### Requirement 67: WhatsApp Auto-Reply Monitor State

**User Story:** As a developer, I want `src/channels/whatsapp/auto-reply/monitor-state.ts` to track the state of the auto-reply monitor loop, so that the monitor can be started, stopped, and inspected without race conditions.

**Referensi:** `referensi/openclaw/extensions/whatsapp/src/auto-reply/monitor-state.ts`

#### Acceptance Criteria

1. THE WhatsApp_Monitor_State_Module SHALL export `createWhatsAppMonitorState()` that returns a state object with `start()`, `stop()`, `isRunning()`, and `waitForStop()` methods.
2. WHEN `start()` is called while already running, THE WhatsApp_Monitor_State_Module SHALL throw an error.
3. WHEN `stop()` is called, THE WhatsApp_Monitor_State_Module SHALL signal the monitor loop to exit and resolve `waitForStop()` when it does.
4. THE WhatsApp_Monitor_State_Module SHALL NOT be a stub — the state machine SHALL be implemented with real running/stopped transitions.

---

### Requirement 68: WhatsApp Inbound Message Processing

**User Story:** As a developer, I want `src/channels/whatsapp/auto-reply/monitor/process-message.ts` to process a single inbound WhatsApp message through access control, deduplication, and dispatch, so that the full inbound pipeline is encapsulated in one reusable function.

**Referensi:** `referensi/openclaw/extensions/whatsapp/src/auto-reply/monitor/process-message.ts`

#### Acceptance Criteria

1. THE WhatsApp_Process_Message_Module SHALL export `processWhatsAppInboundMessage(params)` that runs access control, deduplication, content extraction, and dispatch in sequence.
2. WHEN the message fails access control, THE WhatsApp_Process_Message_Module SHALL return `{ handled: false, reason: 'access-denied' }`.
3. WHEN the message is a duplicate, THE WhatsApp_Process_Message_Module SHALL return `{ handled: false, reason: 'duplicate' }`.
4. WHEN the message is processed successfully, THE WhatsApp_Process_Message_Module SHALL return `{ handled: true }`.
5. THE WhatsApp_Process_Message_Module SHALL NOT be a stub — the full pipeline SHALL be implemented.

---

### Requirement 69: WhatsApp Channel Module Index

**User Story:** As a developer, I want `src/channels/whatsapp/index.ts` to re-export all public contracts from the WhatsApp channel sub-modules, so that consumers import from one place.

**Referensi:** `referensi/openclaw/extensions/whatsapp/index.ts`

#### Acceptance Criteria

1. THE WhatsApp_Channel_Index SHALL re-export `normalizeWhatsAppMessagingTarget`, `isWhatsAppGroupJid`, `isWhatsAppNewsletterJid`, `isWhatsAppUserTarget`, `looksLikeWhatsAppTargetId`, `normalizeWhatsAppAllowFromEntry` from `normalize-target.ts`.
2. THE WhatsApp_Channel_Index SHALL re-export `resolveWhatsAppSocketTiming`, `DEFAULT_WHATSAPP_SOCKET_TIMING`, `WhatsAppSocketTimingOptions` from `socket-timing.ts`.
3. THE WhatsApp_Channel_Index SHALL re-export `resolveReconnectPolicy`, `resolveHeartbeatSeconds`, `DEFAULT_RECONNECT_POLICY`, `ReconnectPolicy` from `reconnect.ts`.
4. THE WhatsApp_Channel_Index SHALL re-export `resolveWhatsAppGroupSessionRoute`, `resolveWhatsAppLegacyGroupSessionKey` from `group-session-key.ts`.
5. THE WhatsApp_Channel_Index SHALL re-export `extractWhatsAppMessageContent`, `resolveWhatsAppMessageText`, `resolveWhatsAppMessageKind` from `inbound/extract.ts`.
6. THE WhatsApp_Channel_Index SHALL re-export `checkInboundAccessControl`, `InboundAccessControlResult` from `inbound/access-control.ts`.
7. THE WhatsApp_Channel_Index SHALL re-export `claimInboundWhatsAppMessage`, `recordOutboundWhatsAppMessage`, `isRecentOutboundWhatsAppMessage` from `inbound/dedupe.ts`.
8. THE WhatsApp_Channel_Index SHALL re-export `sendWhatsAppText`, `sendWhatsAppMedia`, `sendWhatsAppReaction` from `send.ts`.
9. THE WhatsApp_Channel_Index SHALL re-export `resolveWebCredsPath`, `writeCredsJsonAtomically`, `enqueueCredsSave` from `auth-store.ts`.
10. THE WhatsApp_Channel_Index SHALL re-export `createWhatsAppConnectionController`, `registerWhatsAppConnectionController`, `getRegisteredWhatsAppConnectionController` from `connection-controller.ts`.
11. THE WhatsApp_Channel_Index SHALL re-export `createWhatsAppMonitorState` from `auto-reply/monitor-state.ts`.
12. THE WhatsApp_Channel_Index SHALL re-export `processWhatsAppInboundMessage` from `auto-reply/monitor/process-message.ts`.
13. THE WhatsApp_Channel_Index SHALL NOT re-export OpenClaw-specific types — use project-neutral equivalents.
14. EVERY sub-module SHALL have a colocated `*.test.ts` with real behavior tests before the index is considered complete. **Stubs dan type-only exports dilarang keras.**

---

## Stub Audit Findings

Requirements berikut dihasilkan dari audit langsung terhadap `src/` pada 2026-05-16. Semua item di bawah adalah kondisi yang **saat ini masih stub atau belum diimplementasi** dan wajib diselesaikan sebelum project dianggap production-ready.

---

### Requirement 70: Telegram Channel — Belum Ada File

**User Story:** As a developer, I want `src/channels/telegram/` to contain real implementation files, so that the Telegram channel is actually usable and not just referenced in requirements.

**Temuan:** `src/channels/telegram/` saat ini **0 non-test files**. Direktori kosong.

#### Acceptance Criteria

1. THE Telegram_Channel_Module SHALL have all sub-modules from Requirements 46–56 implemented as separate files under `src/channels/telegram/`.
2. WHEN `bun test` is run, ALL colocated `*.test.ts` files in `src/channels/telegram/` SHALL pass.
3. THE Telegram_Channel_Module SHALL NOT consist of a single monolithic file — each sub-module (token, fetch, normalize, update-offset-store, polling-status, error-policy, draft-chunking, draft-stream, bot-updates, send) SHALL be a separate file.
4. `src/channels/telegram/index.ts` SHALL exist and re-export all public contracts.
5. **Dilarang keras**: mengisi file dengan `export type {}` atau `// TODO: implement` sebagai pengganti implementasi nyata.

---

### Requirement 71: WhatsApp Channel — Belum Ada File

**User Story:** As a developer, I want `src/channels/whatsapp/` to contain real implementation files, so that the WhatsApp channel is actually usable.

**Temuan:** `src/channels/whatsapp/` saat ini **0 non-test files**. Direktori kosong.

#### Acceptance Criteria

1. THE WhatsApp_Channel_Module SHALL have all sub-modules from Requirements 57–69 implemented as separate files under `src/channels/whatsapp/`.
2. WHEN `bun test` is run, ALL colocated `*.test.ts` files in `src/channels/whatsapp/` SHALL pass.
3. THE WhatsApp_Channel_Module SHALL NOT consist of a single monolithic file — each sub-module (normalize-target, socket-timing, reconnect, group-session-key, inbound/extract, inbound/access-control, inbound/dedupe, send, auth-store, connection-controller, auto-reply/monitor-state, auto-reply/monitor/process-message) SHALL be a separate file.
4. `src/channels/whatsapp/index.ts` SHALL exist and re-export all public contracts.
5. **Dilarang keras**: mengisi file dengan `export type {}` atau `// TODO: implement`.

---

### Requirement 72: LanceDB Memory Backend — Placeholder Embedding

**User Story:** As a developer, I want `src/runtime-app/memory/lancedb/lancedbMemoryBackend.ts` to use real text embeddings, so that semantic search actually works based on meaning rather than hash collisions.

**Temuan:** `lancedbMemoryBackend.ts` menggunakan `placeholderEmbedding(text)` yang menghasilkan vector berbasis hash karakter — bukan semantic embedding. Komentar di baris 17 secara eksplisit menyebut ini sebagai "placeholder".

#### Acceptance Criteria

1. THE LanceDB_Memory_Backend SHALL replace `placeholderEmbedding` with a real embedding function that calls an embedding provider (e.g., OpenAI-compatible `/v1/embeddings` endpoint via `AI_BASE_URL`).
2. WHEN `AI_BASE_URL` and `AI_API_KEY` are set, THE LanceDB_Memory_Backend SHALL use the configured provider to generate embeddings.
3. WHEN the embedding provider is unavailable, THE LanceDB_Memory_Backend SHALL return a descriptive error rather than silently falling back to hash-based vectors.
4. THE LanceDB_Memory_Backend SHALL export `createEmbeddingFunction(options)` as a separate injectable dependency so it can be mocked in tests.
5. THE LanceDB_Memory_Backend SHALL have a colocated test that verifies the embedding function is called (not the placeholder) when a real provider is configured.
6. **Dilarang keras**: menggunakan hash-based atau random vectors sebagai embedding dalam production path.

---

### Requirement 73: Core Modules — Single-File, Belum Dipecah

**User Story:** As a developer, I want all core modules to be split into focused sub-files rather than single monolithic `index.ts`, so that each file has a single responsibility and is easier to test and maintain.

**Temuan:** Semua module berikut hanya punya **1 file `index.ts`** masing-masing, padahal requirements sudah mendefinisikan sub-module yang lebih granular:

- `src/infra/index.ts` — filesystem, temp dir, atomic write semua dalam 1 file
- `src/shared/index.ts` — Result, Option, Deferred, LazyAsync, generators, formatters semua dalam 1 file
- `src/logging/index.ts` — logger, redaction, file writer semua dalam 1 file
- `src/security/index.ts` — audit trail, token validation, dangerous config semua dalam 1 file
- `src/secrets/index.ts` — redaction, key detection semua dalam 1 file
- `src/config/index.ts` — parser, readers, env source semua dalam 1 file
- `src/provider-runtime/index.ts` — retry, circuit breaker, health check semua dalam 1 file
- `src/sessions/index.ts` — SessionRegistry, lifecycle, transcript semua dalam 1 file
- `src/memory/index.ts` — write, read, list, migrate, repair semua dalam 1 file
- `src/context-engine/index.ts` — batch builder, scorer, estimator semua dalam 1 file
- `src/tools/index.ts` — validator, availability, plan builder semua dalam 1 file
- `src/hooks/index.ts` — registry, handler, audit semua dalam 1 file
- `src/flows/index.ts` — engine, state store, validator semua dalam 1 file
- `src/tasks/index.ts` — registry, dependency graph, cycle detection semua dalam 1 file
- `src/routing/index.ts` — resolver, dead letter, queue semua dalam 1 file
- `src/plugin-state/index.ts` — store, migration semua dalam 1 file
- `src/plugin-sdk/index.ts` — semua plugin contracts dalam 1 file

#### Acceptance Criteria

1. WHEN a module's `index.ts` exceeds ~200 lines of implementation code, THE Adaptation_System SHALL split it into focused sub-files (e.g., `src/infra/fs.ts`, `src/infra/temp.ts`, `src/infra/atomic.ts`) with `index.ts` re-exporting from them.
2. EACH sub-file SHALL have a single clear responsibility matching the sub-module names defined in Requirements 4–21 and 23–44.
3. THE `index.ts` of each module SHALL only contain re-exports — no implementation logic directly in `index.ts`.
4. WHEN a sub-file is created, it SHALL have its own colocated `*.test.ts` testing its specific behavior.
5. THE split SHALL NOT break any existing imports — `index.ts` re-exports SHALL maintain backward compatibility.
6. **Dilarang keras**: menambah lebih banyak implementation code ke `index.ts` yang sudah besar — split dulu, baru tambah.

---

## Adaptasi Source OpenClaw — Lapisan Utilitas dan Runtime

Requirements berikut mengadaptasi source dari `referensi/openclaw/src/` ke project AgentAI01. Semua adaptasi wajib mengikuti aturan:

- **Jangan edit `referensi/`** — hanya baca
- **Hapus semua import internal OpenClaw** (`openclaw/plugin-sdk/*`, `@openclaw/*`, `@earendil-works/*`) — ganti ke path relatif AgentAI01 atau package yang tersedia
- **Tambahkan komentar** `// Adapted from referensi/openclaw/src/...` di baris pertama setiap file adaptasi
- **Setiap file harus lolos** `npm run check` (tsc) tanpa error
- **Dilarang keras**: meninggalkan `// TODO: implement` sebagai implementasi final — stub hanya boleh sementara dan harus dicatat di `TODO.md`
- **Setelah selesai**, `grep -r "from.*openclaw" src/ --include="*.ts"` harus menghasilkan output kosong

---

### Requirement 74: Utils — Pecah Single-File ke Sub-Modules

**User Story:** As a developer, I want `src/utils/` to be split into focused sub-files adapted from `referensi/openclaw/src/utils/`, so that each utility has a single responsibility and can be imported independently.

**Referensi:** `referensi/openclaw/src/utils/fetch-timeout.ts`, `safe-json.ts`, `mask-api-key.ts`, `timer-delay.ts`, `with-timeout.ts`, `queue-helpers.ts`, `run-with-concurrency.ts`, `parse-json-compat.ts`, `usage-format.ts`, `chunk-items.ts`

**Status saat ini:** `src/utils/index.ts` sudah ada tapi single-file monolitik.

#### Acceptance Criteria

1. THE Utils_Module SHALL be split into the following sub-files, each adapted from the corresponding referensi file:
   - `src/utils/fetch-timeout.ts` — fetch dengan timeout via `AbortController` + native `fetch`
   - `src/utils/safe-json.ts` — safe JSON parse/stringify yang mengembalikan `Result<T, string>`
   - `src/utils/mask-api-key.ts` — mask API key untuk logging (tampilkan hanya 4 karakter pertama)
   - `src/utils/timer-delay.ts` — `sleep(ms)` dan `delay(ms)` utilities
   - `src/utils/with-timeout.ts` — `withTimeout(promise, ms, message?)` wrapper
   - `src/utils/queue-helpers.ts` — queue utility functions (enqueue, dequeue, drain)
   - `src/utils/run-with-concurrency.ts` — `runWithConcurrency(tasks, limit)` untuk async tasks
   - `src/utils/parse-json-compat.ts` — JSON parse dengan compatibility handling untuk edge cases
   - `src/utils/usage-format.ts` — format token usage stats ke string yang human-readable
   - `src/utils/chunk-items.ts` — `chunkArray(arr, size)` untuk memecah array ke chunks
2. `src/utils/index.ts` SHALL re-export semua public exports dari sub-files di atas tanpa implementasi langsung.
3. SETIAP sub-file SHALL memiliki colocated `*.test.ts` dengan behavior tests.
4. SEMUA import internal OpenClaw di referensi SHALL diganti ke path relatif AgentAI01 atau Bun/Node built-ins.
5. THE Utils_Module SHALL NOT import dari package yang tidak ada di `package.json` — gunakan `AbortController`, `crypto`, dan `node:*` built-ins.
6. **Dilarang keras**: meninggalkan implementasi di `index.ts` — semua logic harus di sub-files.

---

### Requirement 75: Web Fetch — Adaptasi Runtime dan Content Extractor

**User Story:** As a developer, I want `src/web-fetch/` to provide a safe URL fetcher with content extraction, so that agents can retrieve and parse web content without reimplementing HTTP safety checks.

**Referensi:** `referensi/openclaw/src/web-fetch/runtime.ts`, `referensi/openclaw/src/web-fetch/content-extractors.runtime.ts`

**Status saat ini:** `src/web-fetch/index.ts` sudah ada tapi hanya berisi types dan URL safety check — belum ada actual fetch dan content extraction.

#### Acceptance Criteria

1. THE Web_Fetch_Module SHALL export `WebFetchResult` type dengan fields: `url`, `title?`, `content`, `excerpt?`, `fetchedAt`, `error?`.
2. THE Web_Fetch_Module SHALL export `WebFetchOptions` type dengan fields: `timeoutMs?`, `maxContentLength?`, `userAgent?`.
3. THE Web_Fetch_Module SHALL export `fetchWebContent(url, options?)` yang melakukan HTTP GET dengan timeout via `AbortController` dan mengembalikan `Promise<WebFetchResult>`.
4. WHEN the response is HTML, THE Web_Fetch_Module SHALL extract readable content menggunakan `@mozilla/readability` dengan `linkedom` sebagai DOM parser.
5. WHEN the response is not HTML (JSON, plain text, etc.), THE Web_Fetch_Module SHALL return the raw text content.
6. THE Web_Fetch_Module SHALL be split into:
   - `src/web-fetch/types.ts` — type definitions
   - `src/web-fetch/runtime.ts` — fetch implementation
   - `src/web-fetch/content-extractors.ts` — HTML content extraction
   - `src/web-fetch/index.ts` — re-exports
7. WHEN a URL fails safety check (invalid protocol, blocked host), THE Web_Fetch_Module SHALL return `WebFetchResult` dengan `error` field terisi, bukan throw.
8. SETIAP sub-file SHALL memiliki colocated `*.test.ts`.
9. **Dilarang keras**: import dari `@openclaw/*` atau `openclaw/*` — gunakan `@mozilla/readability`, `linkedom`, dan native `fetch`.

---

### Requirement 76: Web Search — Adaptasi Runtime dengan Provider Pattern

**User Story:** As a developer, I want `src/web-search/` to provide a multi-provider web search client, so that agents can search the web through a consistent interface regardless of which search provider is configured.

**Referensi:** `referensi/openclaw/src/web-search/runtime.ts`, `referensi/openclaw/src/web-search/runtime-types.ts`

**Status saat ini:** `src/web-search/index.ts` sudah ada dengan `WebSearchClient` dan `normalizeSearchResults` — tapi provider implementations belum ada.

#### Acceptance Criteria

1. THE Web_Search_Module SHALL be split into:
   - `src/web-search/types.ts` — type definitions (adapted from `runtime-types.ts`)
   - `src/web-search/runtime.ts` — search client implementation
   - `src/web-search/providers/tavily.ts` — Tavily provider (requires `tavily` package)
   - `src/web-search/providers/duckduckgo.ts` — DuckDuckGo fallback provider (no API key required)
   - `src/web-search/index.ts` — re-exports
2. THE Web_Search_Module SHALL export `createWebSearchClient(options)` yang menerima provider config dan mengembalikan client dengan `search(query, options?)` method.
3. WHEN `TAVILY_API_KEY` env var tersedia, THE Web_Search_Module SHALL default ke Tavily provider.
4. WHEN no API key is configured, THE Web_Search_Module SHALL fall back ke DuckDuckGo provider.
5. THE Web_Search_Module SHALL export `normalizeSearchResults(raw, provider)` yang menormalisasi hasil dari berbagai provider ke `WebSearchResult[]`.
6. SETIAP provider SHALL memiliki colocated `*.test.ts` dengan mock HTTP responses.
7. **Dilarang keras**: import dari `openclaw/*` — gunakan native `fetch` dan `undici` untuk HTTP calls.

---

### Requirement 77: Speech — Adaptasi TTS/STT Layer

**User Story:** As a developer, I want `src/runtime-app/speech/` to provide a complete TTS/STT implementation adapted from OpenClaw's speech layer, so that agents can synthesize and transcribe speech through a provider-agnostic interface.

**Referensi:** `referensi/openclaw/src/tts/tts-types.ts`, `referensi/openclaw/src/tts/openai-compatible-speech-provider.ts`, `referensi/openclaw/src/tts/tts-core.ts`, `referensi/openclaw/src/tts/provider-registry.ts`

**Status saat ini:** `src/runtime-app/speech/` sudah ada `speechCore.ts`, `stt/`, `tts/` tapi belum ada provider registry dan OpenAI-compatible provider yang lengkap.

#### Acceptance Criteria

1. THE Speech_Module SHALL export `SpeechProvider` interface dengan `synthesize(text, options?)` dan `transcribe(audio, options?)` methods.
2. THE Speech_Module SHALL export `createOpenAICompatibleSpeechProvider(config)` yang menggunakan `openai` SDK untuk TTS dan STT.
3. THE Speech_Module SHALL export `createSpeechProviderRegistry()` yang memungkinkan registrasi multiple providers dan resolusi berdasarkan capability.
4. THE Speech_Module SHALL be organized sebagai:
   - `src/runtime-app/speech/types.ts` — type definitions adapted dari `tts-types.ts`
   - `src/runtime-app/speech/provider.ts` — OpenAI-compatible provider
   - `src/runtime-app/speech/registry.ts` — provider registry
   - `src/runtime-app/speech/core.ts` — core orchestration logic
5. WHEN `AI_BASE_URL` dan `AI_API_KEY` tersedia, THE Speech_Module SHALL use them untuk TTS/STT calls.
6. SETIAP file SHALL memiliki colocated `*.test.ts`.
7. **Dilarang keras**: import dari `openclaw/*` — gunakan `openai` package yang sudah tersedia.

---

### Requirement 78: Generation — Provider Registry untuk Image/Audio/Document

**User Story:** As a developer, I want `src/runtime-app/generation/` to provide a provider registry for media generation, so that image, audio, and document generation can be routed to the correct provider.

**Referensi:** Pola arsitektur dari `referensi/openclaw/src/video-generation/` dan image generation patterns.

**Status saat ini:** `src/runtime-app/generation/` sudah ada `generationCore.ts` dan `providers/` tapi belum ada registry dan OpenAI image provider yang lengkap.

#### Acceptance Criteria

1. THE Generation_Module SHALL export `GenerationType` union: `'image' | 'audio' | 'document'`.
2. THE Generation_Module SHALL export `GenerationRequest` type dengan `type`, `prompt`, dan `options?` fields.
3. THE Generation_Module SHALL export `GenerationResult` type dengan `type`, `url?`, `base64?`, `mimeType?`, dan `error?` fields.
4. THE Generation_Module SHALL export `GenerationProvider` interface dengan `id`, `supports: GenerationType[]`, dan `generate(req)` method.
5. THE Generation_Module SHALL export `createGenerationRegistry()` dengan `register(provider)` dan `generate(req)` methods.
6. THE Generation_Module SHALL export `createOpenAIImageProvider(config)` yang menggunakan `openai` SDK untuk DALL-E image generation.
7. THE Generation_Module SHALL be organized sebagai:
   - `src/runtime-app/generation/types.ts`
   - `src/runtime-app/generation/registry.ts`
   - `src/runtime-app/generation/providers/openai-image.ts`
   - `src/runtime-app/generation/index.ts`
8. SETIAP file SHALL memiliki colocated `*.test.ts`.
9. **Dilarang keras**: import dari `openclaw/*`.

---

### Requirement 79: Diagnostics — Logger dan Health Check

**User Story:** As a developer, I want `src/runtime-app/diagnostics/` to provide structured logging and health check state management, so that all runtime components can log consistently and expose health status.

**Referensi:** Logging patterns dari `referensi/openclaw/src/utils/` dan health check patterns.

**Status saat ini:** `src/runtime-app/diagnostics/diagnosticsCore.ts` dan `prometheus/` sudah ada tapi belum ada structured logger yang dipakai secara konsisten.

#### Acceptance Criteria

1. THE Diagnostics_Module SHALL export `createLogger(name)` yang mengembalikan logger dengan `debug`, `info`, `warn`, `error`, dan `child(bindings)` methods.
2. THE Diagnostics_Module SHALL use `tslog` sebagai underlying logger implementation.
3. THE Diagnostics_Module SHALL export `rootLogger` sebagai singleton logger untuk seluruh runtime app.
4. THE Diagnostics_Module SHALL export `createHealthState()` yang mengembalikan object dengan `setReady(ready, reason?)`, `isReady()`, dan `getStatus()` methods.
5. THE Diagnostics_Module SHALL be organized sebagai:
   - `src/runtime-app/diagnostics/logger.ts` — logger factory menggunakan `tslog`
   - `src/runtime-app/diagnostics/health.ts` — health check state management
   - `src/runtime-app/diagnostics/index.ts` — re-exports
6. WHEN `APP_ENV=production`, THE Diagnostics_Module SHALL default ke JSON log format.
7. WHEN `APP_ENV=development`, THE Diagnostics_Module SHALL default ke pretty log format.
8. SETIAP file SHALL memiliki colocated `*.test.ts`.
9. **Dilarang keras**: import dari `openclaw/*`.

---

### Requirement 80: Plugin SDK — Registry, Loader, dan Hot-Reload

**User Story:** As a developer, I want `src/plugin-sdk/` to provide a complete plugin system with registry, loader, and hot-reload support, so that extensions can be loaded from the `extensions/` folder without restarting the runtime.

**Referensi:** Plugin system patterns dari `referensi/openclaw/` exports dan plugin-sdk structure.

**Status saat ini:** `src/plugin-sdk/index.ts` hanya berisi type definitions — tidak ada registry, loader, atau hot-reload.

#### Acceptance Criteria

1. THE Plugin_SDK SHALL export `PluginManifest` type dengan `id`, `name`, `version`, `description`, `author?`, `tools?`, dan `skills?` fields.
2. THE Plugin_SDK SHALL export `ToolDefinition` type dengan `name`, `description`, `parameters` (JSON Schema), dan `execute` function.
3. THE Plugin_SDK SHALL export `Plugin` interface dengan `manifest` dan `register(api)` method.
4. THE Plugin_SDK SHALL export `PluginAPI` interface dengan `registerTool`, `registerSkill`, dan `log` methods.
5. THE Plugin_SDK SHALL export `createPluginRegistry()` dengan `load(pluginPath)`, `enable(id)`, `disable(id)`, `list()`, dan `get(id)` methods.
6. THE Plugin_SDK SHALL export `createPluginLoader(options)` yang memvalidasi manifest dengan `zod` sebelum loading.
7. WHEN `chokidar` is available, THE Plugin_SDK SHALL support hot-reload dari folder `extensions/` via `watchExtensions(dir, registry)`.
8. THE Plugin_SDK SHALL be organized sebagai:
   - `src/plugin-sdk/types.ts` — type definitions dan interfaces
   - `src/plugin-sdk/registry.ts` — plugin registry
   - `src/plugin-sdk/loader.ts` — plugin loader dengan zod validation
   - `src/plugin-sdk/hot-reload.ts` — chokidar-based hot-reload
   - `src/plugin-sdk/index.ts` — re-exports
9. SETIAP file SHALL memiliki colocated `*.test.ts`.
10. **Dilarang keras**: import dari `openclaw/*` atau menggunakan type-only exports sebagai implementasi final.

---

### Requirement 81: Skills — Web Search dan Summarize

**User Story:** As a developer, I want `skills/web-search/` and `skills/summarize/` to exist as properly structured skills, so that agents can use web search and summarization capabilities through the skill system.

**Referensi:** Pola skill dari `referensi/openclaw/skills/` dan existing skills di `skills/` folder.

**Status saat ini:** `skills/` sudah ada banyak skill tapi `web-search` dan `summarize` belum ada sebagai standalone skills dengan format yang konsisten.

#### Acceptance Criteria

1. THE Skills_Module SHALL create `skills/web-search/SKILL.md` dengan frontmatter `name`, `description`, `version`, dan instruksi penggunaan yang jelas.
2. THE Skills_Module SHALL create `skills/summarize/SKILL.md` dengan frontmatter yang sama.
3. SETIAP SKILL.md SHALL mengikuti format:
   ```
   ---
   name: nama-skill
   description: Deskripsi singkat satu kalimat
   version: 0.1.0
   ---
   # Nama Skill
   ## Tujuan
   ## Cara Pakai
   ## Parameter
   ```
4. `skills/web-search/SKILL.md` SHALL mendokumentasikan cara memanggil `src/web-search/` dari agent context.
5. `skills/summarize/SKILL.md` SHALL mendokumentasikan cara meringkas konten panjang menggunakan AI provider.
6. **Dilarang keras**: membuat SKILL.md yang hanya berisi placeholder text tanpa instruksi yang actionable.

---

### Requirement 82: Verifikasi Tidak Ada Import OpenClaw

**User Story:** As a developer, I want the codebase to have zero imports from OpenClaw internal paths, so that the project is fully independent from the reference implementation.

#### Acceptance Criteria

1. WHEN `grep -r "from.*openclaw" src/ --include="*.ts"` dijalankan, hasilnya SHALL kosong (exit code 1 atau output kosong).
2. WHEN `grep -r "from.*@openclaw" src/ --include="*.ts"` dijalankan, hasilnya SHALL kosong.
3. WHEN `grep -r "from.*@earendil" src/ --include="*.ts"` dijalankan, hasilnya SHALL kosong.
4. WHEN `npm run check` dijalankan setelah semua adaptasi selesai, hasilnya SHALL zero TypeScript errors.
5. WHEN `bun test` dijalankan, semua test SHALL pass.
6. THE Adaptation_System SHALL NOT leave any `// TODO: implement` comments in production code paths — semua TODO harus dicatat di `TODO.md` root project dengan penjelasan mengapa belum bisa diselesaikan.
