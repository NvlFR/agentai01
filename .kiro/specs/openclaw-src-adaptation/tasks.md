# Tasks

## OpenClaw Src Adaptation

---

## Task List

- [x] 1. Establish Adaptation Baseline
  - [x] 1.1 Audit seluruh modul referensi yang disebut di `TODO-2.md` dan petakan ke target path repo ini
  - [x] 1.2 Definisikan aturan adaptasi umum: rename OpenClaw-specific names, buang platform-specific code, dan pertahankan pattern yang relevan
  - [x] 1.3 Definisikan strategy coexistence untuk area yang sudah ada: `src/logging/`, `src/shared/`, `src/secrets/`, `src/security/`, `src/types/`, dan `src/runtime-app/`
  - [x] 1.4 Tambahkan convention bahwa setiap modul adaptasi wajib punya minimal satu `*.test.ts`

- [x] 2. Adapt Foundation Utilities Batch
  - [x] 2.1 Perkuat `src/logging/` dengan subsystem logger, child bindings, dev formatting, production output, dan secret redaction
  - [x] 2.2 Buat `src/utils/` untuk parse helpers, retry/backoff, timestamp helpers, dedupe, clamp, truncate, dan path helpers
  - [x] 2.3 Perluas `src/shared/` dengan normalization, coercion, deferred/lazy async, type guards, result pattern, dan pagination helpers
  - [x] 2.4 Buat `src/infra/` untuk safe filesystem operations, atomic writes, temp dir management, dan traversal prevention
  - [x] 2.5 Perluas `src/secrets/` dan `src/security/` dengan auth profile concepts, secret mapping, audit framework, dangerous-config detection, dan constant-time comparisons
  - [x] 2.6 Perluas `src/types/` dengan utility types, branded IDs, JSON-safe types, dan union helpers

- [x] 3. Adapt Runtime Core Batch
  - [x] 3.1 Ekstrak provider resilience patterns ke `src/provider-runtime/`
  - [x] 3.2 Buat `src/process/` untuk graceful shutdown, signal handling, dan process health
  - [x] 3.3 Buat `src/status/` untuk status aggregation, history, dan change events
  - [x] 3.4 Buat `src/config/` sebagai config core yang selaras dengan `src/runtime-app/config/`
  - [x] 3.5 Buat `src/bootstrap/` untuk service registration, dependency graph, dan boot health checks
  - [x] 3.6 Buat `src/bindings/` dan `src/compat/` untuk optional capability fallback, migration helpers, dan deprecation warnings

- [x] 4. Adapt Sessions, Memory, and Context Batch
  - [x] 4.1 Buat `src/sessions/` untuk session IDs, lifecycle, transcript logging, dan expiry
  - [x] 4.2 Buat `src/memory/` untuk memory files, namespace isolation, migration, dan repair/recovery
  - [x] 4.3 Buat `src/memory-host-sdk/` untuk provider contract, search interface, dan indexing hooks
  - [x] 4.4 Buat `src/context-engine/` untuk context window management, compression, budget tracking, dan priority scoring

- [x] 5. Adapt Execution Fabric Batch
  - [x] 5.1 Buat `src/tools/` untuk tool descriptors, availability evaluation, planning, result normalization, dan tool error contracts
  - [x] 5.2 Buat `src/tasks/` untuk task registry, lifecycle states, dependency graph, dan result storage
  - [x] 5.3 Buat `src/flows/` untuk flow definitions, step execution, persistence, dan recovery
  - [x] 5.4 Buat `src/hooks/` untuk hook framework, isolation, inbound hook handling, dan audit logs
  - [x] 5.5 Buat `src/routing/` untuk message route resolution, validation, dan dead-letter handling
  - [x] 5.6 Buat `src/plugins/`, `src/plugin-sdk/`, dan `src/plugin-state/` untuk manifest validation, lifecycle, registry, SDK contracts, dan per-plugin state

- [x] 6. Adapt Communication and Protocol Batch
  - [x] 6.1 Buat `src/channels/` untuk channel abstraction, normalization, auth contract, health checks, dan inbound routing hooks
  - [x] 6.2 Buat `src/auto-reply/` untuk reply policy engine, rate limiting, templates, dan audit logging
  - [x] 6.3 Buat `src/commitments/` untuk promise tracking, deadline monitoring, dan breach alerts
  - [x] 6.4 Buat `src/gateway/` untuk gateway protocol types, auth, health/readiness endpoints, dan WebSocket hooks
  - [x] 6.5 Buat `src/acp/` untuk ACP types, validation, approval flow, dan audit logging
  - [x] 6.6 Buat `src/mcp/` untuk MCP server, tool serving, bridges, dan MCP client use

- [x] 7. Adapt Agent and Orchestration Batch
  - [x] 7.1 Ekstrak reusable agent runtime contracts ke `src/agents/` tanpa merombak logic bisnis agent yang sudah ada
  - [x] 7.2 Buat `src/cron/` untuk cron definition, parser, execution isolation, dan audit logging
  - [x] 7.3 Buat `src/daemon/` untuk daemon lifecycle, monitoring, restart policy, dan log rotation hooks

- [x] 8. Adapt Web, Search, and Media Batch
  - [x] 8.1 Buat `src/web-fetch/` untuk safe fetch wrapper, timeout, retry, normalization, SSRF prevention, dan fetch audit logs
  - [x] 8.2 Buat `src/web-search/` untuk provider interfaces, normalized results, caching, dan fallback
  - [x] 8.3 Buat `src/link-understanding/` untuk metadata extraction, preview generation, dan link safety checks
  - [x] 8.4 Buat `src/media/` untuk media type detection, size validation, download helpers, dan temp file management
  - [x] 8.5 Buat `src/media-understanding/`, `src/media-generation/`, `src/image-generation/`, `src/video-generation/`, dan `src/music-generation/` untuk provider contracts, orchestration, caching/queueing, dan result storage

- [x] 9. Adapt Speech and Voice Batch
  - [x] 9.1 Buat `src/tts/` untuk provider interface, caching, dan format normalization
  - [x] 9.2 Buat `src/talk/` untuk voice conversation interface, turn-taking, dan voice session lifecycle
  - [x] 9.3 Buat `src/realtime-transcription/` untuk provider interface, streaming transcription, dan accuracy metrics

- [x] 10. Adapt UI, CLI, and Interaction Batch
  - [x] 10.1 Buat `src/web/` untuk shared web server utilities, static file serving, WebSocket, dan SSE
  - [x] 10.2 Buat `src/cli/` untuk argument parsing, command registry, output formatting, dan prompts
  - [x] 10.3 Buat `src/terminal/` untuk ANSI helpers, width detection, dan progress rendering
  - [x] 10.4 Buat `src/tui/` untuk layout, components, dan input handling
  - [x] 10.5 Buat `src/markdown/` dan `src/interactive/` untuk markdown parsing/conversion, frontmatter, prompts, confirmations, menus, dan validation

- [x] 11. Adapt Config, Bootstrap, and Compatibility Integration
  - [x] 11.1 Sinkronkan `src/config/` baru dengan boundary existing `src/runtime-app/config/`
  - [x] 11.2 Integrasikan `src/bootstrap/`, `src/process/`, dan `src/status/` ke entrypoints runtime yang sudah ada
  - [x] 11.3 Tambahkan compatibility adapters agar migrasi dapat bertahap tanpa big-bang rewrite
  - [x] 11.4 Pastikan semua services baru dapat di-wire tanpa circular dependency

- [x] 12. Adapt Observability and Diagnostics Batch
  - [x] 12.1 Tambahkan global logging configuration layer dan log export capabilities ke `src/logging/`
  - [x] 12.2 Buat `src/trajectory/` untuk action tracking, replay, dan analysis
  - [x] 12.3 Buat `src/proxy-capture/` untuk proxy request/response capture dan replay debugging
  - [x] 12.4 Pastikan semua exported logs/captures tetap patuh ke secret redaction policy

- [x] 13. Adapt Pairing and Infrastructure Services Batch
  - [x] 13.1 Buat `src/pairing/` untuk pairing tokens, protocol flow, dan state management
  - [x] 13.2 Buat `src/node-host/` untuk host abstraction, remote execution contract, dan health monitoring
  - [x] 13.3 Buat `src/crestodian/` untuk credential storage, encryption, dan rotation workflows

- [x] 14. Adapt Docs, Scripts, and Productization Batch
  - [x] 14.1 Buat `src/docs/` untuk doc generation, API extraction, dan validation
  - [x] 14.2 Buat `src/scripts/` untuk shared script helpers, build helpers, dan code generation utilities
  - [x] 14.3 Buat `src/i18n/` untuk locale detection, translation loading, dan string management
  - [x] 14.4 Buat `src/model-catalog/` untuk capability metadata, selection logic, dan pricing estimates
  - [x] 14.5 Buat `src/chat/`, `src/commands/`, dan `src/wizard/` untuk chat history/context building, command registry/help, dan setup/onboarding flows

- [x] 15. Add Cross-Cutting Integration Rules
  - [x] 15.1 Pastikan semua modul baru reuse `src/logging/`, `src/secrets/`, `src/security/`, dan `src/infra/` daripada membuat helper baru yang duplikatif
  - [x] 15.2 Pastikan semua network/path/media modules memakai guardrails security yang konsisten
  - [x] 15.3 Pastikan semua stateful modules punya namespace dan lifecycle yang eksplisit
  - [x] 15.4 Pastikan public-facing contracts memakai normalized result/error patterns

- [x] 16. Add Test Coverage per Batch
  - [x] 16.1 Tambahkan minimal satu behavior test colocated untuk setiap modul yang diadaptasi
  - [x] 16.2 Tambahkan contract tests untuk provider, channel, plugin, gateway, dan media interfaces
  - [x] 16.3 Tambahkan filesystem safety tests untuk `src/infra/`, security tests untuk `src/security/`, dan redaction tests untuk `src/logging/`
  - [x] 16.4 Tambahkan replay/round-trip tests untuk trajectory, proxy capture, sessions, routing, dan command/help flows

- [~] 17. Final Validation and Migration Pass
  - [x] 17.1 Audit import graph agar modul baru tidak melanggar boundary arsitektur repo
  - [x] 17.2 Migrasikan helper/helper runtime-app yang sudah cocok ke modul `src/` baru secara bertahap
  - [x] 17.3 Jalankan `npm run check` setelah batch yang disentuh stabil
  - [~] 17.4 Jalankan `bun test` untuk memastikan seluruh modul adaptasi dan regresi existing tetap hijau
  - [x] 17.5 Jalankan `npm run runtime:smoke` bila batch yang disentuh memengaruhi provider, bootstrap, process lifecycle, atau communication paths
