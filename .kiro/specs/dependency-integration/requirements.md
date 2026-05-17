# Requirements Document

## Introduction

Feature ini mendefinisikan roadmap implementasi untuk dependencies yang sudah tersedia di `package.json` tetapi belum dipakai secara konsisten di runtime `agentai01`. Tujuannya bukan sekadar menambah import, tetapi mengubah package-package tersebut menjadi capability nyata yang punya kontrak, test, dan landing spot yang jelas di arsitektur project.

Spec ini memecah pekerjaan ke beberapa domain: CLI dan operator UX, transport HTTP/websocket, scheduling, persistence, observability, integrations, media/document processing, dan external service adapters. Setiap dependency yang diaktifkan harus menghasilkan behavior runtime yang bisa dibuktikan, bukan stub atau dead code.

## Glossary

- **Dependency_Integration**: Pekerjaan mengubah package yang sudah terinstall menjadi capability runtime yang dipakai oleh module production atau tooling repo.
- **Capability_Surface**: API, class, service, worker, command, atau skill yang secara nyata memakai dependency dan diekspos ke layer lain.
- **Operator_Surface**: Surface yang dipakai owner/operator seperti CLI, dashboard, HTTP API, atau maintenance tooling.
- **Integration_Adapter**: Adapter untuk service eksternal seperti Slack, GitHub, Notion, Google, Stripe, atau email.
- **Media_Pipeline**: Workflow untuk parsing PDF, zip, binary type detection, audio, image, atau document generation.
- **Persistence_Layer**: Layer database, queue, state store, atau vector store yang memanfaatkan storage dependencies.
- **Spec_Completion**: Kondisi ketika setiap task utama di `tasks.md` memiliki implementasi nyata, tests relevan, dan bukti verifikasi.

## Requirements

### Requirement 1: Real Runtime Usage

**User Story:** As a maintainer, I want every selected dependency to map to a real capability, so that `package.json` reflects actual system behavior rather than speculative installs.

#### Acceptance Criteria

1. THE Dependency_Integration system SHALL only mark a dependency as implemented when it is used by a production module, worker, tool, skill runtime, or repository-maintained CLI/tooling surface.
2. THE Dependency_Integration system SHALL NOT satisfy a dependency merely by adding an unused import or placeholder wrapper.
3. WHEN a dependency is activated, THE codebase SHALL define a clear ownership location under `src/`, `skills/`, `scripts/`, or `runtime-app/`.
4. THE system SHALL document which capability each dependency powers.
5. WHEN a dependency remains intentionally unused, THE tasks document SHALL keep it in an unchecked or deferred state rather than treating it as complete.

---

### Requirement 2: Architecture Alignment

**User Story:** As a developer, I want new dependency-backed features to fit the existing runtime architecture, so that the codebase stays maintainable and agent-agnostic.

#### Acceptance Criteria

1. THE system SHALL place CLI dependencies under CLI or operator tooling surfaces, not inside unrelated core modules.
2. THE system SHALL place HTTP and websocket dependencies under `src/runtime-app/`, `src/web/`, or channel/provider adapters.
3. THE system SHALL place persistence dependencies under storage, memory, queue, or provider-runtime layers.
4. THE system SHALL keep core domain modules free from provider-specific or service-specific leakage unless the contract explicitly belongs there.
5. THE system SHALL avoid circular dependencies while introducing the new capability surfaces.

---

### Requirement 3: TypeScript ESM Strict Compliance

**User Story:** As a developer, I want all dependency integrations to pass strict typecheck, so that enabling new packages does not degrade type safety.

#### Acceptance Criteria

1. THE system SHALL ensure all new files pass `npm run check`.
2. THE system SHALL use TypeScript ESM relative imports with `.js` suffixes.
3. THE system SHALL avoid `any` in new integration code and prefer library-native types, `unknown`, or narrow adapters.
4. WHEN external payloads are parsed, THE system SHALL validate them with Zod or existing schema helpers where appropriate.
5. THE system SHALL keep dependency wrappers small and typed rather than exposing raw unvalidated payloads across the app.

---

### Requirement 4: Behavior Tests

**User Story:** As a maintainer, I want dependency-backed capabilities to be covered by focused tests, so that future refactors can safely retain behavior.

#### Acceptance Criteria

1. THE system SHALL add colocated or module-local tests for each new dependency-backed capability.
2. WHEN a dependency talks to an external service, THE tests SHALL prefer injected clients or fetch stubs over live network access.
3. THE system SHALL clean up timers, temporary files, mocks, and environment variables after each test.
4. WHEN parsing/serialization is involved, THE tests SHALL cover representative success and failure cases.
5. THE system SHALL avoid tests that merely assert a package can be imported.

---

### Requirement 5: Operator CLI and UX Foundation

**User Story:** As an operator, I want the runtime to expose richer local control surfaces, so that dependencies like `commander`, `chalk`, `@clack/core`, and `@clack/prompts` provide real value.

#### Acceptance Criteria

1. THE system SHALL provide a maintained operator CLI entry that uses `commander` for command routing.
2. THE CLI SHALL use `chalk` for readable local terminal formatting.
3. WHEN an interactive flow is needed, THE CLI SHALL use `@clack/core` and/or `@clack/prompts` for confirmations or guided setup.
4. THE CLI integration SHALL remain safe for non-interactive or CI mode where prompts are not appropriate.
5. THE operator tooling SHALL integrate with existing runtime commands rather than duplicating business logic.

---

### Requirement 6: HTTP, Realtime, and Runtime Transport

**User Story:** As a maintainer, I want transport-layer dependencies to back real server and realtime surfaces, so that packages like `express`, `hono`, `ws`, `@grammyjs/runner`, and `@grammyjs/transformer-throttler` are used intentionally.

#### Acceptance Criteria

1. THE system SHALL define which runtime surfaces are served by `express` versus `hono`, and SHALL avoid redundant parallel servers without a reason.
2. THE system SHALL use `ws` only when a websocket channel or realtime operator stream is implemented.
3. THE Telegram runtime SHALL use `@grammyjs/runner` and `@grammyjs/transformer-throttler` when long-running bot orchestration benefits from them.
4. THE transport integrations SHALL expose health/error behavior that can be tested without live upstream services.
5. THE system SHALL preserve operator auth and secret redaction when adding new transport surfaces.

---

### Requirement 7: Scheduling, Queueing, and Concurrency

**User Story:** As an operator, I want scheduled and queued work to use the installed scheduling libraries intentionally, so that background execution is reliable and visible.

#### Acceptance Criteria

1. THE system SHALL define clear ownership between `cron` and `croner`, or consolidate on one runtime scheduler surface where practical.
2. THE system SHALL use `p-queue` or existing queue abstractions for concurrency-limited background tasks where ordering or throttling matters.
3. THE system SHALL expose testable scheduling and retry behavior through runtime-app workers or tooling.
4. THE system SHALL avoid hidden global timers in favor of explicit scheduler or queue instances.
5. THE system SHALL record meaningful operational state for scheduled jobs where the runtime already provides diagnostics.

---

### Requirement 8: Persistence and Database Capability

**User Story:** As a maintainer, I want storage dependencies to back explicit persistence choices, so that database-related packages are not left dormant.

#### Acceptance Criteria

1. THE system SHALL define the intended role of `better-sqlite3`, `kysely`, `postgres`, and optional `sqlite-vec`.
2. WHEN SQLite is used, THE system SHALL expose a repository or storage adapter rather than raw scattered SQL calls.
3. WHEN Postgres support is introduced, THE system SHALL isolate it behind runtime configuration and typed adapters.
4. THE system SHALL document whether vector search uses `sqlite-vec`, LanceDB, or another backend in each supported mode.
5. THE storage integrations SHALL include tests for initialization, read/write behavior, and graceful missing-feature handling.

---

### Requirement 9: Config, Auth, and Structured Data

**User Story:** As a developer, I want config and auth dependencies to back real parsing and verification workflows, so that structured config and token handling stay consistent.

#### Acceptance Criteria

1. THE system SHALL define concrete usage for `dotenv`, `yaml`, and `js-yaml` without duplicating parsers unnecessarily.
2. THE system SHALL define concrete usage for `jose` where JWT, JWK, or signed-token verification is required.
3. THE system SHALL place document/config parsing helpers in stable modules instead of ad hoc script code.
4. WHEN multiple serialization libraries overlap, THE design SHALL justify the split.
5. THE system SHALL preserve existing secret-handling rules while adding these integrations.

---

### Requirement 10: Media, Documents, and Binary Processing

**User Story:** As an operator, I want installed media/document dependencies to unlock actual workflows for parsing, packaging, and file inspection.

#### Acceptance Criteria

1. THE system SHALL provide concrete capability surfaces for `file-type`, `pdf-lib`, `pdfjs-dist`, `node-html-parser`, and `jszip`.
2. WHEN PDF extraction or generation is enabled, THE system SHALL separate parsing, normalization, and operator-facing output concerns.
3. WHEN zip/archive handling is enabled, THE system SHALL validate input and avoid unsafe path extraction behavior.
4. THE system SHALL expose representative tests for binary/media detection and parsing failures.
5. THE system SHALL avoid silently loading large binaries without configured limits or guardrails.

---

### Requirement 11: External Service Integrations

**User Story:** As a maintainer, I want third-party SDKs to back explicit adapters, so that integrations like GitHub, Slack, Notion, Google, Stripe, email, TTS, push, and MCP have clear contracts.

#### Acceptance Criteria

1. THE system SHALL define explicit adapters or tools for `@octokit/rest`, `@slack/web-api`, `@notionhq/client`, `googleapis`, `stripe`, `nodemailer`, `elevenlabs`, `web-push`, and `@modelcontextprotocol/sdk`.
2. THE system SHALL isolate credentials and network calls behind dependency-injected clients or configuration-aware constructors.
3. WHEN an integration is optional, THE system SHALL degrade gracefully when credentials are missing.
4. THE system SHALL not expose raw secrets in logs, errors, or UI snapshots.
5. THE system SHALL provide tests that verify request shaping, configuration validation, and failure normalization.

---

### Requirement 12: Search, HTTP Client, and Fetch Helpers

**User Story:** As a developer, I want search and HTTP-client dependencies to have clear roles, so that packages like `axios` and `tavily` complement rather than duplicate existing fetch infrastructure.

#### Acceptance Criteria

1. THE system SHALL document when `axios` is preferred over native `fetch` or `undici`, if at all.
2. THE system SHALL keep `tavily` integration behind a typed search provider or tool interface.
3. THE system SHALL normalize HTTP client errors into project-native error shapes.
4. THE system SHALL avoid maintaining duplicate provider implementations without a capability reason.
5. THE system SHALL cover retryable, auth, and invalid-request paths in tests for HTTP-backed adapters.

---

### Requirement 13: Observability and Logging Stack

**User Story:** As an operator, I want the observability stack to use the installed logging dependencies intentionally, so that local development and structured logging are both supported.

#### Acceptance Criteria

1. THE system SHALL define the role of `pino` and `pino-pretty` relative to existing `tslog` and internal logging abstractions.
2. WHEN a production-leaning logger is introduced, THE system SHALL provide an adapter that preserves redaction guarantees.
3. THE system SHALL avoid fragmented logging entry points with inconsistent field shapes.
4. THE system SHALL provide a documented path for pretty local logs versus machine-readable logs.
5. THE observability integration SHALL be testable without depending on terminal formatting side effects.

---

### Requirement 14: Spec Completion and Tracking

**User Story:** As a maintainer, I want the implementation rollout to be trackable in phases, so that a large dependency integration program can be completed incrementally without ambiguity.

#### Acceptance Criteria

1. THE design SHALL group the dependency rollout into phased workstreams.
2. THE tasks document SHALL map each dependency or dependency cluster to a concrete implementation task.
3. THE tasks document SHALL distinguish ready work from deferred or optional work.
4. THE tasks document SHALL include verification expectations per phase.
5. THE tasks document SHALL allow checkbox-based progress tracking with `[ ]`, `[~]`, and `[x]`.
