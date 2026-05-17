# Requirements Document

## Introduction

Feature **restored-src-modules-adaptation** adalah spec payung untuk mengadopsi capability penting dari `restored-src/src/` ke dalam repo `agentai01` tanpa copy-paste mentah. Semua area yang sudah dipetakan dari `restored-src/` dianggap relevan dan wajib masuk ke roadmap, tetapi landing implementation-nya harus mengikuti arsitektur project ini yang sudah punya `src/runtime/`, `src/runtime-app/`, `src/tasks/`, `src/tools/`, `src/memory/`, `src/logging/`, `src/mcp/`, dan `src/model-catalog/`.

Prinsip adaptasi:

1. semua modul yang disebut user dianggap in-scope
2. adaptasi dilakukan sebagai translasi capability, bukan duplikasi struktur folder secara buta
3. modul sumber yang UI-only, platform-specific, atau OpenClaw-specific tetap dipetakan, tetapi ditempatkan ke boundary repo yang tepat
4. hasil implementasi nanti harus tetap patuh pada `AGENTS.md`, `CODEX.md`, dan `SECURITY.md`
5. seluruh capability baru harus reuse guardrail yang sudah ada untuk logging, secrets, security, dan runtime validation

Tujuan akhir: tersedia blueprint implementasi yang lengkap agar semua capability dari `restored-src/` bisa diadopsi secara bertahap, konsisten, dan tidak menabrak arsitektur 4-tier agent runtime yang sudah ada.

---

## Glossary

- **Reference_Module**: Modul sumber dari `restored-src/src/` atau subfolder terkait yang menjadi referensi adaptasi.
- **Adapted_Capability**: Capability hasil adopsi yang hidup di `src/` repo ini sesuai landing path yang disepakati.
- **Landing_Path**: Lokasi implementasi target di repo ini, misalnya `src/runtime-app/`, `src/tools/`, `src/memory/`, atau `src/model-catalog/`.
- **Capability_Cluster**: Kelompok modul yang saling terkait, misalnya query-context, tools, services, atau platform integrations.
- **Tool_Catalog**: Katalog tool runtime yang dapat dipanggil model, agent, atau operator.
- **Execution_Fabric**: Lapisan yang menghubungkan tools, tasks, memory, skills, dan services menjadi alur kerja runtime.
- **Integration_Surface**: Surface existing di repo ini yang harus menerima capability baru, terutama `src/runtime/`, `src/runtime-app/`, `src/agents/`, dan `src/registry/`.
- **Security_Guardrail**: Aturan secret handling, path validation, permission checks, auditability, dan redaction yang wajib dipatuhi capability baru.

---

## Requirements

### Requirement 1: Adaptation Baseline

**User Story:** As a maintainer, I want a single adaptation baseline for all required `restored-src` modules, so that no capability from the agreed source inventory is omitted during planning or implementation.

#### Acceptance Criteria

1. THE adaptation baseline SHALL treat the following source capability groups as mandatory scope: `context`, `utils`, `suggestions`, `ultraplan`, `teleport`, `telemetry`, `skills`, `tasks`, `tools`, `model`, `message`, `memory`, `github`, `git`, `filePersistence`, `computerUse`, `query`, `upstreamproxy`, `voice`, and `services`.
2. THE adaptation SHALL map each Reference_Module to a Landing_Path in this repo even when the source module does not exist as a top-level folder and instead lives under `restored-src/src/utils/`, `restored-src/src/services/`, or other nested source locations.
3. THE adaptation SHALL preserve capability and interface intent from `restored-src/` while removing product-specific, UI-shell-specific, or unsupported implementation details.
4. THE resulting design SHALL not require a parallel runtime architecture that duplicates existing `src/runtime/` or `src/runtime-app/` responsibilities.
5. EVERY planned Adapted_Capability SHALL declare whether it is a new subsystem, an enhancement of an existing subsystem, or a compatibility layer around current code.

### Requirement 2: Context, Message, Query, and Suggestion Fabric

**User Story:** As a runtime developer, I want the context and query-related modules adapted together, so that user input, message normalization, token budgeting, and suggestions operate as one coherent pipeline.

#### Acceptance Criteria

1. THE adaptation SHALL include capability coverage for `restored-src/src/context/*`, `restored-src/src/query/*`, `restored-src/src/query.ts`, `restored-src/src/utils/messages/*`, `restored-src/src/utils/processUserInput/*`, `restored-src/src/utils/suggestions/*`, and `restored-src/src/services/PromptSuggestion/*`.
2. THE adapted context layer SHALL distinguish UI/operator context concerns from runtime context concerns and SHALL land them in the appropriate repo surfaces rather than forcing all context logic into a single folder.
3. THE adapted query layer SHALL support input preprocessing, stop hooks, dependency injection, token budgeting, and query normalization before model execution.
4. THE adapted message layer SHALL support message transformation, helper creation, tagging, normalization, and compatibility mapping for runtime tool flows.
5. THE adapted suggestion layer SHALL support autocomplete, prompt suggestion, skill usage suggestion, and operator-assistive recommendations without hardcoding product-specific UX assumptions.

### Requirement 3: Core Utility and Model Infrastructure

**User Story:** As a runtime developer, I want the utility and model-related modules adapted as reusable leaf infrastructure, so that higher-level services can rely on standardized helpers instead of ad-hoc logic.

#### Acceptance Criteria

1. THE adaptation SHALL include capability coverage for `restored-src/src/utils/plugins`, `utils/permissions`, `utils/bash`, `utils/shell`, `utils/settings`, `utils/model`, `utils/computerUse`, `utils/swarm`, `utils/hooks`, `utils/task`, `utils/telemetry`, `utils/mcp`, `utils/memory`, `utils/messages`, `utils/secureStorage`, `utils/git`, `utils/suggestions`, `utils/teleport`, `utils/nativeInstaller`, `utils/processUserInput`, `utils/filePersistence`, `utils/github`, and `utils/ultraplan`.
2. THE adapted utility layer SHALL provide path validation, permission classification, shell command safety, settings validation, model capability resolution, secure storage helpers, and telemetry primitives.
3. THE adapted model layer SHALL support model aliases, capability metadata, provider mapping, fallback selection, validation, and future compatibility with `src/model-catalog/`.
4. THE adapted swarm and hooks capabilities SHALL align with this repo's multi-agent and baton-passing design rather than introducing a competing orchestration model.
5. THE adapted utility infrastructure SHALL remain usable as leaf dependencies and SHALL not import business-specific logic from individual department agents.

### Requirement 4: Service Layer Adaptation

**User Story:** As a platform developer, I want the `restored-src/src/services/*` layer adapted into this repo, so that provider access, MCP, analytics, compaction, and advanced helpers have explicit service contracts.

#### Acceptance Criteria

1. THE adaptation SHALL include capability coverage for `services/api`, `services/mcp`, `services/analytics`, `services/compact`, `services/lsp`, `services/plugins`, `services/settingsSync`, `services/remoteManagedSettings`, `services/SessionMemory`, `services/teamMemorySync`, `services/PromptSuggestion`, `services/MagicDocs`, and `services/toolUseSummary`.
2. THE adapted API service layer SHALL support provider requests, retries, response parsing, error normalization, and logging hooks.
3. THE adapted MCP service layer SHALL support connection management, auth flow, headers, normalization, and client/server bridge utilities.
4. THE adapted analytics and telemetry services SHALL support event sinks, exporters, metadata enrichment, and no-secret observability behavior.
5. THE adapted compact, SessionMemory, and teamMemorySync services SHALL support context compression, session memory maintenance, and teammate-safe synchronization boundaries.
6. THE adapted LSP, plugins, settingsSync, remoteManagedSettings, MagicDocs, PromptSuggestion, and toolUseSummary services SHALL expose contracts that can be consumed incrementally by existing runtime-app surfaces.

### Requirement 5: Tool Catalog Adaptation

**User Story:** As a maintainer, I want the important tools from `restored-src/src/tools/*` adapted into a coherent tool catalog, so that model and agent tool use can be expanded without rewriting the runtime from scratch.

#### Acceptance Criteria

1. THE adaptation SHALL include capability coverage for `BashTool`, `PowerShellTool`, `FileReadTool`, `FileWriteTool`, `FileEditTool`, `GrepTool`, `GlobTool`, `MCPTool`, `ListMcpResourcesTool`, `ReadMcpResourceTool`, `McpAuthTool`, `AgentTool`, `SendMessageTool`, `TaskCreateTool`, `TaskGetTool`, `TaskListTool`, `TaskOutputTool`, `TaskStopTool`, `TaskUpdateTool`, `SkillTool`, `WebFetchTool`, `WebSearchTool`, `LSPTool`, `NotebookEditTool`, `TodoWriteTool`, `EnterPlanModeTool`, `ExitPlanModeTool`, `EnterWorktreeTool`, and `ExitWorktreeTool`.
2. THE adapted shell tools SHALL provide safety classification, read-only validation, destructive-command warnings, and path validation before execution.
3. THE adapted file tools SHALL support safe reading, writing, and editing boundaries, notebook-aware behavior, and normalized error messages.
4. THE adapted MCP, agent, task, skill, web, LSP, todo, and worktree tools SHALL integrate with the repo's runtime policies and permission boundaries rather than bypassing them.
5. THE Tool_Catalog SHALL support tool discovery, tool descriptors, and normalized input/output contracts that can be surfaced through existing runtime-app tooling.

### Requirement 6: Execution Fabric for Tasks, Skills, Memory, and Async Work

**User Story:** As a runtime developer, I want tasks, skills, and memory modules adapted together, so that long-running work and background execution use consistent contracts.

#### Acceptance Criteria

1. THE adaptation SHALL include capability coverage for `restored-src/src/tasks/*`, `restored-src/src/skills/*`, `restored-src/src/memory/*`, and related helper services such as `SessionMemory` and `teamMemorySync`.
2. THE adapted tasks layer SHALL support async/background execution, lifecycle tracking, shell-task style guards, remote/in-process teammate task patterns, and stop/cancel behavior.
3. THE adapted skills layer SHALL support skill discovery, bundled skills, skill loading, MCP-based skill builders, and runtime-safe skill execution.
4. THE adapted memory layer SHALL support memory management helpers, session-aware persistence concepts, and namespace boundaries that fit this repo's agent and project isolation rules.
5. THE execution fabric SHALL integrate with the current `src/tasks/`, `src/memory/`, `src/runtime/`, and `src/runtime-app/queue` surfaces instead of replacing them wholesale.

### Requirement 7: Platform and Integration Capabilities

**User Story:** As a platform developer, I want the platform integration capabilities adapted, so that repo operations, upstream communication, automation, and operator portability are covered by first-class modules.

#### Acceptance Criteria

1. THE adaptation SHALL include capability coverage for `restored-src/src/utils/git`, `utils/github`, `utils/filePersistence`, `utils/computerUse`, `utils/teleport`, `utils/ultraplan`, `restored-src/src/upstreamproxy/*`, and `restored-src/src/voice/*`.
2. THE adapted git and GitHub capabilities SHALL support repository helpers, auth/status helpers, PR or repo mapping helpers, and integration with existing GitHub-related runtime-app surfaces.
3. THE adapted file persistence capabilities SHALL support state or artifact persistence to disk with explicit ownership, path safety, and repairability.
4. THE adapted computer-use capabilities SHALL support host adapter abstractions, executor flow, gating, and automation safety checks.
5. THE adapted teleport and ultraplan capabilities SHALL support export or planning workflows as optional runtime features without coupling the repo to a foreign product model.
6. THE adapted upstream proxy and voice capabilities SHALL support proxy relays, upstream boundary management, and voice-mode feature flags that integrate with existing speech and provider runtime paths.

### Requirement 8: Coexistence with Existing Repo Architecture

**User Story:** As a maintainer, I want a coexistence strategy for all adapted capabilities, so that the repo can absorb them incrementally without destabilizing current behavior.

#### Acceptance Criteria

1. THE adaptation SHALL define Landing_Path mappings into existing repo surfaces including `src/runtime/`, `src/runtime-app/`, `src/tools/`, `src/tasks/`, `src/memory/`, `src/logging/`, `src/mcp/`, `src/plugins/`, and `src/model-catalog/`.
2. THE adaptation SHALL prefer strengthening or extending existing subsystems before creating new parallel folders with overlapping responsibilities.
3. IF a Reference_Module is primarily UI-shell-oriented, THEN the design SHALL classify it as operator surface support rather than core domain infrastructure.
4. THE adaptation SHALL identify where compatibility wrappers are needed so implementation can proceed in batches instead of requiring a big-bang migration.
5. THE integration approach SHALL preserve the current 4-tier hierarchy, baton-passing behavior, and sub-agent integrity rules.

### Requirement 9: Security, Validation, and Observability Guardrails

**User Story:** As a security-conscious maintainer, I want every adapted capability to follow consistent safety and verification rules, so that the expanded runtime remains operable and auditable.

#### Acceptance Criteria

1. EVERY adapted capability SHALL respect `SECURITY.md` constraints for secret handling, operator token handling, auditability, and masking.
2. NO adapted capability SHALL hardcode credentials, tokens, API keys, or raw secret-bearing URLs.
3. ALL path-based, shell-based, MCP-based, and remote integration capabilities SHALL declare validation and permission boundaries before mutating behavior.
4. THE adapted telemetry and analytics paths SHALL ensure secret redaction in logs, traces, summaries, and exported events.
5. IMPLEMENTATION work derived from this spec SHALL include colocated tests where code is added and SHALL be verifiable with `npm run check` and `bun test`, plus `npm run runtime:smoke` when runtime/provider surfaces are affected.

### Requirement 10: Phased Delivery Plan

**User Story:** As an implementer, I want the adaptation work grouped into explicit batches, so that the repo can absorb all required modules without losing track of scope.

#### Acceptance Criteria

1. THE implementation plan SHALL group work into at least these batches: baseline mapping, context-query-message, utility-model infrastructure, services layer, tool catalog, execution fabric, platform integrations, runtime-app integration, and validation.
2. THE phased plan SHALL explicitly cover every required module or submodule named by the user, either directly or through a clearly named containing batch.
3. THE phased plan SHALL keep unfinished work visible as open tasks rather than marking future implementation as completed.
4. THE phased plan SHALL be detailed enough for another developer to implement from `tasks.md` without redoing the source inventory from scratch.
