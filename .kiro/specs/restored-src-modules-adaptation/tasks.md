# Tasks

## Restored Src Modules Adaptation

---

## Task List

- [ ] 1. Establish Restored-Source Adaptation Baseline
  - [ ] 1.1 Audit seluruh capability sumber dari `restored-src/src/` yang sudah disepakati: `context`, `utils`, `suggestions`, `ultraplan`, `teleport`, `telemetry`, `skills`, `tasks`, `tools`, `model`, `message`, `memory`, `github`, `git`, `filePersistence`, `computerUse`, `query`, `upstreamproxy`, `voice`, dan `services`
  - [ ] 1.2 Buat mapping source-to-landing-path untuk tiap capability ke `src/runtime/`, `src/runtime-app/`, `src/tools/`, `src/tasks/`, `src/memory/`, `src/mcp/`, `src/logging/`, `src/plugins/`, atau `src/model-catalog/`
  - [ ] 1.3 Definisikan aturan adaptasi umum: capability-first, bukan copy-paste folder
  - [ ] 1.4 Tandai capability yang sumbernya tersebar di `utils/*`, `services/*`, atau file top-level agar tidak ada yang terlewat

- [ ] 2. Build Context, Query, Message, and Suggestion Fabric
  - [ ] 2.1 Adaptasikan capability dari `restored-src/src/query/*` untuk config query, dependency wiring, stop hooks, dan token budget
  - [ ] 2.2 Adaptasikan `utils/processUserInput/*` menjadi preprocessing input yang konsisten sebelum runtime execution
  - [ ] 2.3 Adaptasikan `utils/messages/*` dan helper message terkait menjadi normalization dan helper layer untuk runtime message
  - [ ] 2.4 Adaptasikan `utils/suggestions/*` dan `services/PromptSuggestion/*` untuk autocomplete, prompt suggestion, dan recommendation logic
  - [ ] 2.5 Petakan bagian runtime-relevant dari `restored-src/src/context/*` ke operator surface atau runtime context yang tepat tanpa memaksa semuanya jadi core domain

- [ ] 3. Build Utility Foundation Cluster
  - [ ] 3.1 Adaptasikan `utils/plugins/*` untuk plugin loading, discovery, dan validation
  - [ ] 3.2 Adaptasikan `utils/permissions/*` untuk allow/deny guard, classifier, dan rule parsing
  - [ ] 3.3 Adaptasikan `utils/bash/*` untuk parsing, quoting, shell prefixing, dan command safety
  - [ ] 3.4 Adaptasikan `utils/shell/*` dan shell wrappers lintas platform yang masih relevan dengan environment repo ini
  - [ ] 3.5 Adaptasikan `utils/settings/*` untuk read/write/schema validation settings
  - [ ] 3.6 Adaptasikan `utils/secureStorage/*` untuk credential and token storage helpers yang patuh `SECURITY.md`
  - [ ] 3.7 Adaptasikan `utils/nativeInstaller/*` hanya sebagai helper opsional, bukan dependency wajib runtime

- [ ] 4. Build Model, MCP, Memory, Hooks, and Task Helpers
  - [ ] 4.1 Adaptasikan `utils/model/*` untuk alias, capability metadata, fallback, dan validation ke `src/model-catalog` dan provider runtime
  - [ ] 4.2 Adaptasikan `utils/mcp/*` sebagai helper tambahan di atas `src/mcp/`
  - [ ] 4.3 Adaptasikan `utils/memory/*` untuk helper memory internals yang reusable
  - [ ] 4.4 Adaptasikan `utils/hooks/*` untuk runtime hook registry dan execution helpers
  - [ ] 4.5 Adaptasikan `utils/task/*` untuk output formatting, progress summary, dan lifecycle helper
  - [ ] 4.6 Adaptasikan `utils/swarm/*` dengan penyesuaian supaya selaras dengan 4-tier hierarchy dan baton-passing architecture

- [ ] 5. Build Telemetry, Git, GitHub, File Persistence, Teleport, and Ultraplan Helpers
  - [ ] 5.1 Adaptasikan `utils/telemetry/*` untuk logger, tracing, exporter, dan telemetry-safe helpers
  - [ ] 5.2 Adaptasikan `utils/git/*` untuk git operations helper dan worktree-aware behavior
  - [ ] 5.3 Adaptasikan `utils/github/*` untuk auth status, repo mapping, dan GitHub integration helpers
  - [ ] 5.4 Adaptasikan `utils/filePersistence/*` untuk disk persistence helper dengan path safety dan repairability
  - [ ] 5.5 Adaptasikan `utils/teleport/*` sebagai helper export/teleport session atau environment
  - [ ] 5.6 Adaptasikan `utils/ultraplan/*` sebagai planning helper di atas tools/tasks runtime

- [ ] 6. Build Platform Automation and Computer Use Helpers
  - [ ] 6.1 Adaptasikan `utils/computerUse/*` untuk executor, gates, locks, host adapter, dan automation setup
  - [ ] 6.2 Pastikan seluruh capability computer use memakai permission gate dan safety checks eksplisit
  - [ ] 6.3 Petakan rendering/UI helper yang tidak relevan ke core runtime sebagai operator-surface concern

- [ ] 7. Build Service API and MCP Layer
  - [ ] 7.1 Adaptasikan `services/api/*` untuk provider requests, retry, parsing, error normalization, dan request logging
  - [ ] 7.2 Adaptasikan `services/mcp/*` untuk connection manager, auth flow, headers helper, normalization, dan transports
  - [ ] 7.3 Pastikan service API dan MCP memakai dependency injection dan tidak mengikat ke satu provider atau satu server implementation

- [ ] 8. Build Analytics, Compact, and LSP Services
  - [ ] 8.1 Adaptasikan `services/analytics/*` untuk event sinks, exporters, metadata enrichment, dan killswitch-safe analytics
  - [ ] 8.2 Adaptasikan `services/compact/*` untuk context compression, grouping, warning state, dan post-compact cleanup
  - [ ] 8.3 Adaptasikan `services/lsp/*` untuk LSP client/server manager, diagnostics registry, dan passive feedback hooks
  - [ ] 8.4 Pastikan observability dan compaction service tidak mengekspos secret atau private context mentah

- [ ] 9. Build Plugin, Settings Sync, and Managed Settings Services
  - [ ] 9.1 Adaptasikan `services/plugins/*` untuk installation manager, operations, dan plugin CLI behavior yang relevan
  - [ ] 9.2 Adaptasikan `services/settingsSync/*` untuk settings synchronization contracts
  - [ ] 9.3 Adaptasikan `services/remoteManagedSettings/*` untuk managed settings source, cache, dan security checks
  - [ ] 9.4 Pastikan semua managed-settings behavior dapat dimatikan atau didegradasi dengan aman jika source remote unavailable

- [ ] 10. Build Session Memory, Team Memory Sync, Prompt Suggestion, Magic Docs, and Tool Summary Services
  - [ ] 10.1 Adaptasikan `services/SessionMemory/*` untuk session memory lifecycle dan prompts pendukung
  - [ ] 10.2 Adaptasikan `services/teamMemorySync/*` untuk memory synchronization antar teammate dengan secret scanning dan isolation guard
  - [ ] 10.3 Adaptasikan `services/PromptSuggestion/*` untuk suggestion helper yang terhubung ke pipeline input/query
  - [ ] 10.4 Adaptasikan `services/MagicDocs/*` sebagai feature service untuk documentation assistance
  - [ ] 10.5 Adaptasikan `services/toolUseSummary/*` untuk summarization tool-use yang redaction-safe

- [ ] 11. Build Core Tool Catalog: Shell, File, Search, and Discovery
  - [ ] 11.1 Adaptasikan `BashTool` dengan command semantics, permission checks, mode validation, destructive-command warning, dan read-only guard
  - [ ] 11.2 Adaptasikan `PowerShellTool` hanya bila memang tetap dibutuhkan sebagai cross-platform capability, dengan guardrails yang setara
  - [ ] 11.3 Adaptasikan `FileReadTool`, `FileWriteTool`, dan `FileEditTool` dengan safe file boundary, notebook detection, dan normalized errors
  - [ ] 11.4 Adaptasikan `GrepTool` dan `GlobTool` sebagai discovery/search tool yang konsisten dengan codebase workflow
  - [ ] 11.5 Adaptasikan `WebFetchTool` dan `WebSearchTool` sebagai runtime web access layer dengan provider-safe behavior

- [ ] 12. Build Integration Tool Catalog: MCP, LSP, Notebook, Todo, and Workflow Modes
  - [ ] 12.1 Adaptasikan `MCPTool`, `ListMcpResourcesTool`, `ReadMcpResourceTool`, dan `McpAuthTool`
  - [ ] 12.2 Adaptasikan `LSPTool` dengan schemas, formatters, dan symbol context support
  - [ ] 12.3 Adaptasikan `NotebookEditTool` untuk notebook-aware editing path
  - [ ] 12.4 Adaptasikan `TodoWriteTool` untuk work-state persistence atau operator todo flow yang konsisten
  - [ ] 12.5 Adaptasikan `EnterPlanModeTool`, `ExitPlanModeTool`, `EnterWorktreeTool`, dan `ExitWorktreeTool` sebagai explicit runtime control tools

- [ ] 13. Build Coordination Tool Catalog: Agent, Message, Task, and Skill Tools
  - [ ] 13.1 Adaptasikan `AgentTool` untuk interaksi agent atau teammate tanpa melanggar hierarki existing
  - [ ] 13.2 Adaptasikan `SendMessageTool` sebagai runtime-safe coordination tool
  - [ ] 13.3 Adaptasikan `TaskCreateTool`, `TaskGetTool`, `TaskListTool`, `TaskOutputTool`, `TaskStopTool`, dan `TaskUpdateTool`
  - [ ] 13.4 Adaptasikan `SkillTool` dengan skill discovery, execution, telemetry, dan permission boundaries
  - [ ] 13.5 Pastikan semua coordination tools menghormati `allowedMcpTools`, project isolation, dan parent-child agent constraints

- [ ] 14. Build Task Runtime and Async Execution Fabric
  - [ ] 14.1 Adaptasikan `tasks/LocalMainSessionTask.ts`, `LocalShellTask/*`, `LocalAgentTask/*`, `InProcessTeammateTask/*`, `RemoteAgentTask/*`, dan helper terkait
  - [ ] 14.2 Adaptasikan task stop/cancel behavior, guards, kill flow, dan pill/status label helpers
  - [ ] 14.3 Integrasikan task lifecycle baru ke `src/tasks/`, `src/runtime/`, dan `src/runtime-app/queue`
  - [ ] 14.4 Pastikan background execution tidak membypass logging, security, atau state ownership rules

- [ ] 15. Build Skills Runtime and Bundled Skill Loading
  - [ ] 15.1 Adaptasikan `skills/loadSkillsDir.ts`, `skills/mcpSkillBuilders.ts`, `skills/bundledSkills.ts`, dan `skills/bundled/*`
  - [ ] 15.2 Tentukan mana bundled skill yang jadi capability runtime, mana yang cukup jadi reference pattern
  - [ ] 15.3 Integrasikan skill runtime ke `src/runtime-app/skills`, `src/plugins`, atau `src/agents` sesuai landing path
  - [ ] 15.4 Pastikan skill execution tidak memperkenalkan contract yang bertabrakan dengan skill system repo saat ini

- [ ] 16. Build Memory and Persistence Integration
  - [ ] 16.1 Audit capability `restored-src/src/memory/*` dan petakan ke `src/memory/` serta `src/runtime-app/memory/*`
  - [ ] 16.2 Hubungkan helper memory, session memory, dan team memory sync ke namespace isolation project/agent yang sudah ada
  - [ ] 16.3 Pastikan file persistence dan memory repair path tetap deterministic dan aman terhadap path traversal

- [ ] 17. Build Platform Integration Modules
  - [ ] 17.1 Adaptasikan `upstreamproxy/relay.ts` dan `upstreamproxy/upstreamproxy.ts` ke network/provider boundary repo ini
  - [ ] 17.2 Adaptasikan `voice/voiceModeEnabled.ts` ke speech capability flags di `src/runtime-app/speech`, `src/tts`, atau `src/realtime-transcription`
  - [ ] 17.3 Integrasikan git, GitHub, computer use, file persistence, teleport, dan ultraplan capability ke runtime-app surfaces yang relevan
  - [ ] 17.4 Pastikan semua integrasi opsional punya degraded behavior yang jelas jika dependency eksternal tidak aktif

- [ ] 18. Wire Adapted Capabilities into Existing Runtime
  - [ ] 18.1 Buat compatibility adapters agar capability baru bisa dipakai bertahap oleh `src/runtime/` dan `src/runtime-app/`
  - [ ] 18.2 Hindari circular dependency saat menghubungkan service layer, tool catalog, tasks, memory, dan model resolution
  - [ ] 18.3 Pastikan tidak ada subsystem paralel yang menyalin tanggung jawab `src/tools`, `src/tasks`, `src/memory`, `src/logging`, atau `src/mcp`
  - [ ] 18.4 Validasi bahwa 4-tier hierarchy, `SubAgentRegistry`, dan `BatonPassingOrchestrator` tetap menjadi sumber kebenaran orkestrasi agent

- [ ] 19. Add Security, Observability, and Validation Coverage
  - [ ] 19.1 Tambahkan behavior tests untuk utility helpers kritis: permissions, bash safety, settings, model resolver, secure storage, memory helpers, dan file persistence
  - [ ] 19.2 Tambahkan contract tests untuk services/api, services/mcp, services/lsp, plugin services, dan task runtime
  - [ ] 19.3 Tambahkan tests untuk tool descriptors dan normalized input/output/error shape pada tool-tool utama
  - [ ] 19.4 Tambahkan observability tests untuk analytics, telemetry, dan tool-use summary agar tidak membocorkan secret
  - [ ] 19.5 Tambahkan validation bahwa project isolation, department isolation, dan `allowedMcpTools` rules tetap terjaga

- [ ] 20. Final Verification and Handoff Preparation
  - [ ] 20.1 Verifikasi bahwa seluruh capability yang disebut dalam scope awal sudah punya landing path dan task implementasi
  - [ ] 20.2 Jalankan `npm run check` setelah batch implementasi stabil
  - [ ] 20.3 Jalankan `bun test` untuk memverifikasi unit, behavior, dan contract tests
  - [ ] 20.4 Jalankan `npm run runtime:smoke` untuk batch yang menyentuh provider, runtime, task execution, speech, atau MCP integration
  - [ ] 20.5 Catat bukti validasi dan area deferred yang masih perlu batch lanjutan tanpa menghapus scope capability yang sudah disepakati
