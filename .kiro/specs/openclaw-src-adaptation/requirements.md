# Requirements Document

## Introduction

Feature **openclaw-src-adaptation** adalah adaptasi menyeluruh terhadap modul-modul di `referensi/openclaw/src/` ke dalam AI Company Runtime Platform. Berbeda dengan spec lain yang fokus pada area tertentu, feature ini adalah roadmap payung untuk memperluas lapisan `src/` project ini agar memiliki fondasi, runtime services, tools, channels, protocol, observability, dan operator surfaces yang lebih lengkap.

Prinsip adaptasi:

1. semua modul dianggap relevan sebagai pola dan sumber interface
2. adaptasi bukan copy-paste, tetapi translasi ke arsitektur agent-based runtime yang sudah ada
3. implementasi yang spesifik ke platform OpenClaw yang tidak relevan untuk repo ini harus dibuang
4. setiap modul hasil adaptasi wajib punya test colocated minimal satu `*.test.ts`
5. extension baru harus reuse `src/logging/`, `src/secrets/`, `src/security/`, dan boundary runtime yang sudah ada

Tujuan akhir: codebase `src/` yang lebih lengkap, lebih modular, dan lebih siap menjadi runtime platform yang dapat berkembang tanpa terus menambah logic ad-hoc di `src/runtime-app/`.

---

## Glossary

- **OpenClaw_Source_Module**: Satu modul sumber di `referensi/openclaw/src/<name>/` yang menjadi referensi adaptasi.
- **Adapted_Module**: Modul hasil adaptasi di `src/<name>/` atau target path runtime yang disepakati.
- **Batch**: Kelompok pengerjaan berdasarkan prioritas dalam `TODO-2.md`.
- **Extension_Contract**: Interface konsisten yang memungkinkan provider, channel, tool, dan plugin di-load tanpa mengubah core runtime.
- **Runtime_Core**: Lapisan layanan dasar runtime yang mengatur provider, process lifecycle, bootstrap, config, dan status.
- **Operator_Surface**: Semua entrypoint yang dipakai operator atau developer, termasuk HTTP API, channel bot, web UI, CLI, TUI, dan voice interfaces.
- **Project_Namespace**: Namespace file/state yang diisolasi per `project_id` atau `client_id`.
- **Security_Guardrail**: Aturan sanitization, audit, path safety, secret redaction, dan boundary enforcement yang wajib dipatuhi modul baru.

---

## Requirements

### Requirement 1: Adaptation Baseline

**User Story:** As a developer, I want a single adaptation baseline for all OpenClaw source modules, so that the migration stays consistent with the architecture and coding rules of this repo.

#### Acceptance Criteria

1. THE OpenClaw_Source_Module adaptation SHALL preserve useful patterns and interfaces from the reference without copying platform-specific implementation details verbatim.
2. THE adaptation SHALL rename OpenClaw-specific identities and terminology to project-appropriate names before the code is exposed through public APIs.
3. THE adaptation SHALL remove logic that depends on unsupported platforms or apps that are not part of this repo.
4. THE Adapted_Module SHALL compile under strict TypeScript ESM rules and SHALL not introduce `@ts-nocheck`.
5. EVERY Adapted_Module SHALL include at least one colocated behavior-oriented test file.
6. THE adaptation SHALL keep domain contracts agent-agnostic and SHALL not hardcode agent IDs or runtime policies into leaf modules unnecessarily.

---

### Requirement 2: Foundation Core Modules

**User Story:** As a developer, I want the foundational OpenClaw `src/` modules adapted first, so that all later runtime and extension modules can build on stable leaf dependencies.

#### Acceptance Criteria

1. THE modules `src/logging/`, `src/utils/`, `src/shared/`, `src/infra/`, `src/secrets/`, and `src/security/` SHALL be adapted as the first execution batch.
2. THE adapted `src/logging/` SHALL support structured logging, child bindings, log levels, development formatting, production-capable output, and secret redaction.
3. THE adapted `src/utils/` SHALL provide non-throwing parse helpers, retry/backoff helpers, timestamp helpers, path helpers, and generic convenience utilities.
4. THE adapted `src/shared/` SHALL provide coercion helpers, type guards, deferred/lazy async helpers, result patterns, and pagination helpers.
5. THE adapted `src/infra/` SHALL provide safe filesystem operations, atomic writes, path resolution, temp directory management, and traversal prevention.
6. THE adapted `src/secrets/` SHALL support secret resolution, provider env mapping, auth profile concepts, and redaction helpers.
7. THE adapted `src/security/` SHALL provide security audit helpers, dangerous-config detection, constant-time secret comparison, and operator token validation.

---

### Requirement 3: Runtime Core and System Types

**User Story:** As a developer, I want the runtime core modules adapted, so that provider calls, process lifecycle, status reporting, config, and bootstrap become modular services instead of ad-hoc code paths.

#### Acceptance Criteria

1. THE modules `src/provider-runtime/`, `src/types/`, `src/process/`, `src/status/`, `src/config/`, `src/bootstrap/`, `src/bindings/`, and `src/compat/` SHALL be adapted into the repo architecture.
2. THE adapted provider runtime SHALL support retry strategy, circuit breaker behavior, timeout handling, rate-limit detection, and provider health checks.
3. THE adapted `src/types/` SHALL expose shared utility types, branded IDs, JSON-safe types, and discriminated-union helpers.
4. THE adapted `src/process/` SHALL support graceful shutdown, signal handling, lifecycle coordination, and health reporting.
5. THE adapted `src/status/` SHALL support status message types, aggregation, history tracking, and status change events.
6. THE adapted `src/config/` and `src/bootstrap/` SHALL support schema validation, service registration, boot sequencing, and boot health checks without duplicating the existing runtime-app config boundary.
7. THE adapted `src/bindings/` and `src/compat/` SHALL provide fallback and migration helpers that keep runtime behavior explicit when optional capabilities are absent.

---

### Requirement 4: Sessions, Memory, and Context

**User Story:** As a developer, I want sessions, memory, and context modules adapted, so that agent runtime state can be tracked, persisted, and compressed in a reusable way.

#### Acceptance Criteria

1. THE modules `src/sessions/`, `src/memory/`, `src/memory-host-sdk/`, and `src/context-engine/` SHALL be adapted as a coherent batch.
2. THE adapted sessions module SHALL support session ID generation, lifecycle events, transcript logging, model overrides, and expiry/cleanup behavior.
3. THE adapted memory module SHALL support memory files, namespace isolation per project or agent, migration helpers, and recovery/repair directories.
4. THE adapted memory host SDK SHALL expose memory provider contracts, search interfaces, and indexing hooks.
5. THE adapted context engine SHALL support context window management, compression/summarization hooks, budget tracking, and priority scoring.
6. FOR ALL session and memory operations, the resulting state SHALL remain attributable to a project or agent context when such context exists.

---

### Requirement 5: Tools, Tasks, and Flows

**User Story:** As a developer, I want reusable tools, tasks, and flows infrastructure, so that runtime work can be planned, executed, retried, and persisted consistently.

#### Acceptance Criteria

1. THE modules `src/tools/`, `src/tasks/`, and `src/flows/` SHALL be adapted together because they share execution and lifecycle concerns.
2. THE adapted tools module SHALL provide tool descriptors, availability evaluation, planning support, result normalization, and normalized tool errors.
3. THE adapted tasks module SHALL support a task registry, lifecycle states, dependency graphs, and task result storage.
4. THE adapted flows module SHALL support flow definitions, step execution, state persistence, and error recovery.
5. THE tools, tasks, and flows modules SHALL expose contracts that allow runtime orchestration to compose them without importing implementation internals directly.

---

### Requirement 6: Hooks, Routing, and Plugin Platform

**User Story:** As a developer, I want hook, routing, and plugin platform modules adapted, so that runtime behavior can be extended and message delivery can be controlled safely.

#### Acceptance Criteria

1. THE modules `src/hooks/`, `src/routing/`, `src/plugins/`, `src/plugin-sdk/`, and `src/plugin-state/` SHALL be adapted as the extension platform batch.
2. THE adapted hooks module SHALL support registration, deregistration, execution with error isolation, webhook-style inbound handling, and hook audit logging.
3. THE adapted routing module SHALL support message routing, route resolution from agent type, validation, and dead-letter handling for unroutable messages.
4. THE adapted plugins module SHALL support manifest validation, loader lifecycle, activation/deactivation, and a plugin registry.
5. THE adapted plugin SDK SHALL expose public contracts for provider plugins, channel plugins, and tool plugins.
6. THE adapted plugin state module SHALL support per-plugin state persistence, isolation, and migration.

---

### Requirement 7: Channels and Communication Policy

**User Story:** As a developer, I want generic communication modules adapted, so that inbound and outbound operator interactions can be normalized across channels.

#### Acceptance Criteria

1. THE modules `src/channels/`, `src/auto-reply/`, and `src/commitments/` SHALL be adapted as the communication policy batch.
2. THE adapted channels module SHALL provide a channel abstraction, message normalization, auth contract, health checks, and inbound routing hooks.
3. THE adapted auto-reply module SHALL provide policy evaluation, reply rate limiting, template support, and reply audit logging.
4. THE adapted commitments module SHALL support commitment tracking, deadline monitoring, and breach alerting for agent promises to operators.
5. FOR ALL inbound channel messages, normalization SHALL happen before routing into runtime orchestration.

---

### Requirement 8: Gateway and Protocol Modules

**User Story:** As a developer, I want the gateway and protocol modules adapted, so that runtime communication contracts are explicit, validated, and reusable across transports.

#### Acceptance Criteria

1. THE modules `src/gateway/`, `src/acp/`, and `src/mcp/` SHALL be adapted as a protocol batch.
2. THE adapted gateway module SHALL provide protocol types, auth contracts, health/readiness endpoints, and WebSocket support for real-time operator surfaces.
3. THE adapted ACP module SHALL provide message types, validation, approval-flow support, and ACP audit logging.
4. THE adapted MCP module SHALL support MCP server behavior, tool serving, channel bridging, and MCP client use by agents or runtime tools.
5. THE protocol modules SHALL validate message shape before business logic execution.

---

### Requirement 9: Agents and Orchestration Services

**User Story:** As a developer, I want agent and orchestration service modules adapted, so that coordination logic becomes a first-class subsystem rather than being scattered across runtime-app entrypoints.

#### Acceptance Criteria

1. THE modules `src/agents/`, `src/cron/`, and `src/daemon/` SHALL be adapted as an orchestration batch.
2. THE adapted agent layer SHALL support base interfaces or base classes, lifecycle management, context management, delegation, and compaction strategy.
3. THE adapted cron module SHALL support cron definition, schedule parsing, isolated execution, and cron audit logs.
4. THE adapted daemon module SHALL support daemon lifecycle, monitoring, restart policy, and log rotation hooks.
5. THE adapted agent contracts SHALL extend the current agent implementations without forcing a rewrite of existing domain-specific agent logic.

---

### Requirement 10: Web, Search, and Media Stack

**User Story:** As a developer, I want the web, search, and media stack adapted, so that runtime and future operator surfaces can safely fetch, inspect, generate, and analyze external content.

#### Acceptance Criteria

1. THE modules `src/web-fetch/`, `src/web-search/`, `src/link-understanding/`, `src/media/`, `src/media-understanding/`, `src/media-generation/`, `src/image-generation/`, `src/video-generation/`, and `src/music-generation/` SHALL be adapted as the content stack batch.
2. THE adapted web fetch module SHALL support safe fetch wrappers, retry, timeout, normalization, SSRF prevention, and fetch audit logging.
3. THE adapted web search module SHALL provide provider interfaces, result normalization, caching, and provider fallback.
4. THE adapted link-understanding module SHALL support metadata extraction, preview generation, and link safety checks.
5. THE adapted media modules SHALL support media type detection, validation, temp file handling, provider interfaces, result storage, and orchestration contracts.
6. THE adapted image, video, and music generation modules SHALL expose provider-agnostic contracts that can later be implemented by medium/low-priority providers.

---

### Requirement 11: Speech, TTS, and Voice

**User Story:** As a developer, I want speech and voice-specific modules adapted, so that voice-oriented applications and agent workflows can operate on explicit voice contracts.

#### Acceptance Criteria

1. THE modules `src/tts/`, `src/talk/`, and `src/realtime-transcription/` SHALL be adapted as the voice batch.
2. THE adapted TTS module SHALL provide provider interfaces, result caching, and audio format normalization.
3. THE adapted talk module SHALL support voice conversation interfaces, turn-taking, and voice session lifecycle.
4. THE adapted realtime transcription module SHALL support provider interfaces, streaming transcription, and transcription accuracy metrics.
5. THE voice modules SHALL not require permanent disk persistence of raw audio unless explicitly configured.

---

### Requirement 12: UI, CLI, and Terminal Foundations

**User Story:** As a developer or operator, I want shared UI/CLI/terminal modules adapted, so that multiple operator surfaces can reuse the same interaction primitives.

#### Acceptance Criteria

1. THE modules `src/web/`, `src/cli/`, `src/terminal/`, `src/tui/`, `src/markdown/`, and `src/interactive/` SHALL be adapted as the operator surface foundation batch.
2. THE adapted web module SHALL support web server utilities, static file serving, WebSocket, and SSE primitives.
3. THE adapted CLI and terminal modules SHALL support argument parsing, command registry, output formatting, ANSI helpers, width detection, and progress displays.
4. THE adapted TUI module SHALL support layout, components, and input handling.
5. THE adapted markdown and interactive modules SHALL support parsing, rendering/conversion, prompts, confirmations, menus, and input validation.

---

### Requirement 13: Observability and Diagnostic Capture

**User Story:** As a developer or operator, I want observability-focused modules adapted, so that runtime actions can be traced, exported, replayed, and debugged more effectively.

#### Acceptance Criteria

1. THE modules `src/logging/` (global configuration layer), `src/trajectory/`, and `src/proxy-capture/` SHALL be adapted as the diagnostics batch.
2. THE logging global layer SHALL support centralized configuration, aggregation, and export in JSON and text forms.
3. THE trajectory module SHALL support action-sequence tracking, replay, and post-hoc analysis for debugging.
4. THE proxy capture module SHALL support request/response capture, replay, and debugging-focused logging.
5. THE diagnostics batch SHALL not expose secret values in exported logs, captures, or trajectories.

---

### Requirement 14: Pairing and Infrastructure Services

**User Story:** As a developer, I want infrastructure service modules adapted, so that runtime instances, devices, hosts, and credentials can be managed through explicit contracts.

#### Acceptance Criteria

1. THE modules `src/pairing/`, `src/node-host/`, and `src/crestodian/` SHALL be adapted as the infrastructure services batch.
2. THE adapted pairing module SHALL support pairing tokens, pairing protocol flow, and pairing state management.
3. THE adapted node-host module SHALL support node host interfaces, remote execution contracts, and health monitoring.
4. THE adapted crestodian module SHALL support credential storage interfaces, encryption, and rotation workflows.
5. THE infrastructure services batch SHALL isolate secrets and credentials from general-purpose logs and public state.

---

### Requirement 15: Docs, Scripts, Localization, and Operator Knowledge

**User Story:** As a developer, I want documentation, scripting, localization, and operator-knowledge modules adapted, so that runtime capabilities are discoverable and maintainable over time.

#### Acceptance Criteria

1. THE modules `src/docs/`, `src/scripts/`, `src/i18n/`, `src/model-catalog/`, `src/chat/`, `src/commands/`, and `src/wizard/` SHALL be adapted as the productization batch.
2. THE adapted docs module SHALL support doc generation, API extraction, and doc validation.
3. THE adapted scripts module SHALL support shared script helpers, build helpers, and code generation utilities callable from repo scripts.
4. THE adapted i18n module SHALL support string catalogs, locale detection, and translation loading.
5. THE adapted model catalog module SHALL support capability metadata, selection logic, and pricing estimates.
6. THE adapted chat, commands, and wizard modules SHALL support chat history/context building, command parsing/execution/help, and step-by-step onboarding flows with persisted wizard state.

---

### Requirement 16: Execution Order and Incremental Delivery

**User Story:** As a developer, I want the adaptation to be executable in batches, so that the codebase can absorb the migration incrementally without destabilizing the runtime.

#### Acceptance Criteria

1. THE adaptation plan SHALL support incremental execution in batches matching the priority groups defined in `TODO-2.md`.
2. THE first batch SHALL include the leaf foundation modules before higher-level runtime, channel, or UI modules are implemented.
3. THE runtime core batch SHALL complete before agent orchestration, gateway/protocol, and operator surface batches depend on it.
4. EACH batch SHALL be individually testable before the next batch is started.
5. THE final task plan SHALL expose dependencies between batches so work can be sequenced without circular implementation assumptions.

---

## Out of Scope

The following items are explicitly **not** in scope for this feature:

- copy-pasting OpenClaw source wholesale without adaptation
- editing `referensi/openclaw/`
- reintroducing unsupported mobile/native app surfaces that are not part of this repo
- weakening strict TypeScript rules to make adaptation easier
- rewriting all existing agent business logic from scratch instead of layering reusable contracts under it
