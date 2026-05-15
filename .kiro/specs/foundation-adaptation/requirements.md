# Requirements Document

## Introduction

Feature **foundation-adaptation** adalah penguatan fondasi AI Company Runtime Platform dengan mengadaptasi pola-pola engineering dari referensi OpenClaw ke dalam project ini. Adaptasi ini bukan copy-paste — melainkan adopsi konsep, pola, dan struktur yang relevan, disesuaikan dengan stack Bun 1.3.x + TypeScript ESM strict dan arsitektur agent-based runtime yang sudah ada.

Scope adaptasi mencakup empat area utama:
1. **`src/`** — penguatan arsitektur inti dengan subsistem logging, config, secrets, security, shared utils, dan types
2. **`scripts/`** — build & workflow automation yang sesuai dengan stack Bun/npm
3. **`security/`** — static analysis tooling dan security policy enforcement
4. **`test/`** — test infrastructure yang lebih solid untuk mendukung refactor aman

Tujuan akhir: runtime platform yang lebih maintainable, lebih aman, dan lebih mudah di-extend — tanpa mengubah arsitektur agent atau domain contract yang sudah ada.

---

## Glossary

- **Runtime_Platform**: Sistem keseluruhan AI Company Runtime Platform, termasuk semua subsistem di `src/`.
- **Logging_Subsystem**: Modul structured logging di `src/logging/` yang menangani semua output log runtime.
- **Config_Subsystem**: Modul config loading dan validasi di `src/runtime-app/config/` (sudah ada, perlu diperkuat).
- **Secrets_Subsystem**: Modul secrets resolution di `src/secrets/` yang menangani akses ke environment variables sensitif.
- **Security_Subsystem**: Modul security utilities di `src/security/` untuk audit boundary dan policy enforcement.
- **Shared_Utils**: Kumpulan utility functions di `src/shared/` yang dipakai lintas subsistem.
- **Type_Declarations**: File type declarations di `src/types/` untuk external libraries yang tidak punya types.
- **Check_Script**: Script `scripts/check.mjs` yang menjadi entry point untuk semua validasi pre-push.
- **Architecture_Check**: Script yang memvalidasi import boundaries antar subsistem.
- **Import_Cycle_Check**: Script yang mendeteksi circular imports di codebase.
- **Deadcode_Check**: Script yang mendeteksi unused files dan exports.
- **Dependency_Pin_Check**: Script yang memvalidasi semua dependencies di-pin ke versi eksak.
- **Security_Scanner**: Tooling static analysis (opengrep/semgrep) untuk mendeteksi security antipatterns.
- **Security_Ruleset**: Kumpulan rules di `security/opengrep/precise.yml` yang spesifik untuk project ini.
- **Test_Infrastructure**: Folder `test/` dengan fixtures, helpers, mocks, dan global setup.
- **Bun_Test**: Test runner bawaan Bun yang dipakai project ini (`bun test`).
- **Correlation_ID**: Identifier unik per request/operation untuk tracing log lintas subsistem.
- **Redaction**: Proses menyembunyikan nilai sensitif (API keys, tokens) dari log output.
- **Architecture_Boundary**: Aturan yang mendefinisikan modul mana boleh import dari modul mana.
- **Import_Cycle**: Situasi di mana modul A import B dan B import A (langsung atau tidak langsung).
- **Dead_Code**: File atau export yang tidak dipakai oleh modul manapun di codebase.
- **Operator**: Pengguna yang mengoperasikan runtime platform via HTTP API, UI, atau Telegram bot.

---

## Requirements

### Requirement 1: Structured Logging Subsystem

**User Story:** As a developer, I want a structured logging subsystem, so that I can trace runtime behavior, debug issues, and correlate events across agents and subsystems without exposing secrets in log output.

#### Acceptance Criteria

1. THE Logging_Subsystem SHALL produce log entries in structured JSON format with fields: `timestamp` (ISO 8601), `level`, `message`, `correlation_id`, and optional `context` object.
2. THE Logging_Subsystem SHALL support log levels: `debug`, `info`, `warn`, `error` — in ascending severity order.
3. WHEN a log entry contains a value matching a known secret pattern (API key, token, password), THE Logging_Subsystem SHALL replace the value with a redacted placeholder before writing to output.
4. THE Logging_Subsystem SHALL accept a `correlation_id` parameter that propagates through all log entries within the same request or operation context.
5. WHEN `NODE_ENV` or `APP_ENV` is `production`, THE Logging_Subsystem SHALL default to `info` level and suppress `debug` output.
6. WHEN `NODE_ENV` or `APP_ENV` is `development`, THE Logging_Subsystem SHALL default to `debug` level.
7. THE Logging_Subsystem SHALL be importable from a single entry point (`src/logging/index.ts`) without requiring consumers to know internal file structure.
8. IF a log entry's `level` is below the configured minimum level, THEN THE Logging_Subsystem SHALL discard the entry without writing to output.
9. FOR ALL log entries containing a secret value, THE Logging_Subsystem SHALL produce output where the secret value does not appear verbatim (redaction round-trip property).
10. THE Logging_Subsystem SHALL replace the existing `console.log`/`console.error` calls in `src/runtime-app/` with structured log calls — no raw `console.*` in production paths.

---

### Requirement 2: Config Loading and Validation

**User Story:** As a developer, I want a robust config loading subsystem with schema validation, so that misconfigured environments fail fast with clear error messages instead of silently producing wrong behavior.

#### Acceptance Criteria

1. THE Config_Subsystem SHALL load configuration from environment variables and `.env.local` file (if present), with `.env.local` taking precedence over process environment.
2. THE Config_Subsystem SHALL validate all required fields at startup and produce a structured list of validation errors when fields are missing or invalid.
3. WHEN a required config field is missing, THE Config_Subsystem SHALL include the field name and a human-readable description in the validation error list.
4. THE Config_Subsystem SHALL expose a `RuntimeAppConfig` type that is the single source of truth for all runtime configuration — no ad-hoc `process.env` reads outside this module.
5. THE Config_Subsystem SHALL redact secret values (API keys, tokens) when config is serialized for logging or display.
6. WHEN `AI_API_KEY` is absent, THE Config_Subsystem SHALL mark readiness as `false` and include a descriptive reason.
7. THE Config_Subsystem SHALL support a `test` environment mode where secrets can be injected via function parameters without reading from `process.env`.
8. FOR ALL valid config objects, parsing then serializing then parsing SHALL produce an equivalent config object (round-trip property).
9. IF an environment variable value cannot be parsed to its expected type (e.g., non-numeric `APP_PORT`), THEN THE Config_Subsystem SHALL fall back to the documented default value and log a warning.
10. THE Config_Subsystem SHALL be the only module that reads `.env.local` — other modules receive config via dependency injection.

---

### Requirement 3: Secrets Resolution

**User Story:** As a developer, I want a dedicated secrets subsystem, so that all access to sensitive environment variables is centralized, auditable, and never accidentally logged or exposed.

#### Acceptance Criteria

1. THE Secrets_Subsystem SHALL provide typed accessors for all known secret variables: `OPERATOR_TOKEN`, `AI_API_KEY`, `TOKEN_TELE`.
2. WHEN a secret accessor is called and the variable is not set, THE Secrets_Subsystem SHALL return a typed `SecretMissing` result — not throw an exception and not return `undefined`.
3. THE Secrets_Subsystem SHALL never log, print, or include raw secret values in any error message or structured output.
4. THE Secrets_Subsystem SHALL provide a `redactSecret(value: string): string` function that masks all but the first 3 and last 3 characters of a secret value.
5. WHEN a secret value has 6 or fewer characters, THE Secrets_Subsystem SHALL mask all but the first and last character.
6. THE Secrets_Subsystem SHALL be importable from `src/secrets/index.ts` and not expose internal implementation details.
7. FOR ALL secret values of length > 6, `redactSecret(value)` SHALL return a string that does not contain the original value verbatim (redaction property).
8. FOR ALL secret values of length ≤ 6, `redactSecret(value)` SHALL return a string shorter than or equal to the original length that does not contain the original value verbatim.
9. THE Secrets_Subsystem SHALL not import from agent internals (`src/agents/`) or runtime-app business logic.

---

### Requirement 4: Security Utilities

**User Story:** As a developer, I want security utility functions, so that common security patterns (input sanitization, boundary enforcement, audit logging) are consistently applied across the runtime.

#### Acceptance Criteria

1. THE Security_Subsystem SHALL provide an `auditLog(event: AuditEvent): void` function that records security-relevant events (approval decisions, handoff completions, operator actions) to a structured audit trail.
2. WHEN an audit event is recorded, THE Security_Subsystem SHALL include: `event_type`, `actor`, `timestamp` (ISO 8601), `project_id` (if applicable), and `outcome`.
3. THE Security_Subsystem SHALL provide a `sanitizeInput(value: string): string` function that strips null bytes and control characters from user-provided strings.
4. THE Security_Subsystem SHALL provide an `assertNoBoundaryViolation(importPath: string, allowedPrefixes: string[]): void` function that throws if `importPath` does not start with any allowed prefix.
5. WHEN `sanitizeInput` is called with a string containing null bytes (`\0`), THE Security_Subsystem SHALL return a string with all null bytes removed.
6. FOR ALL strings `s`, `sanitizeInput(sanitizeInput(s))` SHALL equal `sanitizeInput(s)` (idempotence property).
7. THE Security_Subsystem SHALL not import from `src/agents/` or `src/runtime-app/` business logic — it is a leaf dependency.
8. THE Security_Subsystem SHALL be importable from `src/security/index.ts`.

---

### Requirement 5: Shared Utilities

**User Story:** As a developer, I want a shared utilities module, so that common helper functions (date formatting, ID generation, result types) are available across all subsystems without duplication.

#### Acceptance Criteria

1. THE Shared_Utils SHALL provide a `generateId(prefix?: string): string` function that returns a unique identifier, optionally prefixed.
2. THE Shared_Utils SHALL provide a `formatIso8601(date: Date): string` function that returns a valid ISO 8601 timestamp string.
3. THE Shared_Utils SHALL provide `Result<T, E>` and `Option<T>` types for explicit error handling without exceptions.
4. THE Shared_Utils SHALL provide a `parseIso8601(value: string): Date | null` function that returns `null` for invalid input instead of throwing.
5. FOR ALL `Date` objects `d`, `parseIso8601(formatIso8601(d))` SHALL return a `Date` with the same UTC millisecond value (round-trip property).
6. FOR ALL strings `s` that are valid ISO 8601, `formatIso8601(parseIso8601(s)!)` SHALL return a string representing the same point in time.
7. THE Shared_Utils SHALL not import from any other `src/` subsystem — it is a leaf dependency with no internal imports.
8. THE Shared_Utils SHALL be importable from `src/shared/index.ts`.
9. WHEN `generateId` is called twice with the same prefix, THE Shared_Utils SHALL return two different strings (uniqueness property).

---

### Requirement 6: Type Declarations for External Libraries

**User Story:** As a developer, I want type declarations for external libraries that lack TypeScript types, so that the codebase compiles cleanly under strict TypeScript without `@ts-ignore` suppressions.

#### Acceptance Criteria

1. THE Type_Declarations SHALL provide ambient module declarations for any third-party library used in the project that does not ship its own `.d.ts` files.
2. THE Type_Declarations SHALL be placed in `src/types/` and referenced via `tsconfig.json` `typeRoots` or `include`.
3. WHEN a new dependency is added that lacks TypeScript types, THE Type_Declarations SHALL be updated before the dependency is used in production code.
4. THE Type_Declarations SHALL not contain `any` types unless the upstream library's API is genuinely untyped and no community types package exists.
5. THE Runtime_Platform SHALL compile with `tsc --noEmit` with zero errors after all type declarations are in place.

---

### Requirement 7: Master Check Script

**User Story:** As a developer, I want a single `scripts/check.mjs` entry point that runs all validation checks, so that I can run one command before push and know the codebase is healthy.

#### Acceptance Criteria

1. THE Check_Script SHALL run the following checks in sequence: TypeScript typecheck, import cycle detection, architecture boundary check, dead code check, and dependency pin check.
2. WHEN any individual check fails, THE Check_Script SHALL report which check failed with a human-readable error message and exit with a non-zero exit code.
3. WHEN all checks pass, THE Check_Script SHALL exit with code `0` and print a summary of checks run.
4. THE Check_Script SHALL be runnable via `node scripts/check.mjs` without requiring a build step.
5. THE Check_Script SHALL support a `--only <check-name>` flag to run a single check in isolation.
6. WHEN run in CI (detected via `CI=true` environment variable), THE Check_Script SHALL suppress interactive output and produce machine-readable results.
7. THE Check_Script SHALL complete all checks within 60 seconds on a standard development machine.

---

### Requirement 8: Architecture Boundary Check

**User Story:** As a developer, I want an automated architecture boundary check, so that import violations between subsystems are caught before they reach the main branch.

#### Acceptance Criteria

1. THE Architecture_Check SHALL enforce that `src/agents/` modules do not import directly from other agents' internals (only via `src/domain/` types and `src/registry/` contracts).
2. THE Architecture_Check SHALL enforce that `src/runtime-app/providers/` does not import from `src/agents/` internals.
3. THE Architecture_Check SHALL enforce that `src/security/`, `src/shared/`, and `src/secrets/` do not import from `src/agents/` or `src/runtime-app/` business logic.
4. WHEN a boundary violation is detected, THE Architecture_Check SHALL report the violating import path, the file containing it, and the rule that was violated.
5. THE Architecture_Check SHALL be runnable as a standalone script: `node scripts/check-architecture-smells.mjs`.
6. THE Architecture_Check SHALL exit with code `0` when no violations are found and non-zero when violations exist.
7. FOR ALL import statements in the codebase, THE Architecture_Check SHALL correctly classify each as allowed or forbidden according to the defined boundary rules (no false negatives for known violation patterns).

---

### Requirement 9: Import Cycle Detection

**User Story:** As a developer, I want automated import cycle detection, so that circular dependencies are caught early before they cause runtime errors or make the codebase hard to reason about.

#### Acceptance Criteria

1. THE Import_Cycle_Check SHALL detect all circular import chains in `src/` TypeScript files.
2. WHEN a cycle is detected, THE Import_Cycle_Check SHALL report the full cycle path (e.g., `A → B → C → A`).
3. THE Import_Cycle_Check SHALL be runnable as a standalone script: `node scripts/check-import-cycles.mjs` (or `.ts` via `bun`).
4. THE Import_Cycle_Check SHALL exit with code `0` when no cycles exist and non-zero when cycles are found.
5. THE Import_Cycle_Check SHALL complete within 30 seconds for the current codebase size.
6. THE Import_Cycle_Check SHALL ignore `node_modules/` and `referensi/` directories.

---

### Requirement 10: Dead Code Detection

**User Story:** As a developer, I want automated dead code detection, so that unused files and exports are identified before they accumulate and make the codebase harder to navigate.

#### Acceptance Criteria

1. THE Deadcode_Check SHALL detect TypeScript files in `src/` that are not imported by any other file and are not entry points.
2. THE Deadcode_Check SHALL detect exported symbols that are not imported by any consumer within the project.
3. WHEN dead code is detected, THE Deadcode_Check SHALL report the file path and the unused symbol name.
4. THE Deadcode_Check SHALL support an allowlist file (`scripts/deadcode-unused-files.allowlist.mjs`) for intentionally unused files (e.g., entry points, standalone scripts).
5. THE Deadcode_Check SHALL be runnable as a standalone script: `node scripts/check-deadcode-unused-files.mjs`.
6. THE Deadcode_Check SHALL exit with code `0` when no unallowlisted dead code exists.

---

### Requirement 11: Dependency Pin Validation

**User Story:** As a developer, I want automated dependency pin validation, so that all dependencies in `package.json` are pinned to exact versions and no open ranges (`^`, `~`, `*`) slip in.

#### Acceptance Criteria

1. THE Dependency_Pin_Check SHALL scan `package.json` `dependencies` and `devDependencies` for version specifiers that are not exact (i.e., contain `^`, `~`, `>`, `<`, `*`, or `latest`).
2. WHEN an unpinned dependency is found, THE Dependency_Pin_Check SHALL report the package name and the current specifier.
3. THE Dependency_Pin_Check SHALL be runnable as a standalone script: `node scripts/check-dependency-pins.mjs`.
4. THE Dependency_Pin_Check SHALL exit with code `0` when all dependencies are pinned and non-zero otherwise.
5. THE Dependency_Pin_Check SHALL check both root `package.json` and any workspace `package.json` files if a workspace is configured.

---

### Requirement 12: Security Static Analysis Tooling

**User Story:** As a developer, I want static analysis security scanning integrated into the development workflow, so that known security antipatterns are caught before they reach the main branch.

#### Acceptance Criteria

1. THE Security_Scanner SHALL scan `src/` for security antipatterns using a compiled ruleset at `security/opengrep/precise.yml`.
2. THE Security_Scanner SHALL be runnable locally via `scripts/run-opengrep.sh` with consistent output format.
3. THE Security_Scanner SHALL support `--changed` flag to scan only files changed in the current working tree.
4. THE Security_Scanner SHALL support `--json` flag to write results to `.opengrep-out/precise.json`.
5. WHEN a security finding is detected, THE Security_Scanner SHALL report: rule ID, file path, line number, and a human-readable description.
6. THE Security_Ruleset SHALL include at minimum the following rule categories for this project:
   a. Hardcoded secret detection (API keys, tokens in source code)
   b. Raw `process.env` access outside `src/runtime-app/config/` and `src/secrets/`
   c. `console.log` calls that may expose secret values
   d. Missing `OPERATOR_TOKEN` validation on mutating HTTP endpoints
7. WHEN a new security rule is added to the ruleset, THE Security_Scanner SHALL validate that the rule has required metadata fields: `id`, `message`, `severity`, and `languages`.
8. THE Security_Scanner SHALL read `.semgrepignore` at the repo root to determine which paths to skip (test files, fixtures, mocks).
9. THE Security_Ruleset SHALL be compiled via `node security/opengrep/compile-rules.mjs` from source rule YAML files.

---

### Requirement 13: Test Infrastructure

**User Story:** As a developer, I want a solid test infrastructure with shared fixtures, helpers, and mocks, so that writing tests is fast and consistent across all subsystems.

#### Acceptance Criteria

1. THE Test_Infrastructure SHALL provide a `test/setup.ts` global setup file that configures the test environment before any test runs (e.g., sets `NODE_ENV=test`, suppresses log output, seeds deterministic IDs).
2. THE Test_Infrastructure SHALL provide a `test/fixtures/` directory with reusable test data: sample `Agent_Message` objects, sample `RuntimeAppConfig` objects, and sample lifecycle state sequences.
3. THE Test_Infrastructure SHALL provide a `test/helpers/` directory with helper functions for common test patterns: creating mock agents, building test configs, asserting structured log output.
4. THE Test_Infrastructure SHALL provide a `test/mocks/` directory with mock implementations of external boundaries: mock provider (returns deterministic responses), mock storage (in-memory), mock secrets (injectable values).
5. WHEN `bun test` is run, THE Bun_Test SHALL automatically load `test/setup.ts` before executing any test file.
6. THE Test_Infrastructure SHALL provide a `createTestConfig(overrides?: Partial<RuntimeAppConfig>): RuntimeAppConfig` helper that returns a valid test config without reading from `process.env`.
7. THE Test_Infrastructure SHALL provide a `createTestMessage(overrides?: Partial<Agent_Message>): Agent_Message` helper that returns a valid agent message for use in tests.
8. WHEN a mock provider is used in tests, THE Test_Infrastructure SHALL allow callers to specify deterministic response payloads without making real HTTP calls.
9. THE Test_Infrastructure SHALL not import from `src/agents/` internals — it uses only `src/domain/` types and public subsystem APIs.
10. FOR ALL test helper functions that create objects with required fields, calling the helper with no arguments SHALL return a valid object that passes all domain validation rules (completeness property).

---

### Requirement 14: Architecture Boundary Tests

**User Story:** As a developer, I want automated tests that verify architecture boundaries are respected, so that boundary violations are caught by `bun test` in addition to the check scripts.

#### Acceptance Criteria

1. THE Test_Infrastructure SHALL include `test/architecture-boundaries.test.ts` that programmatically verifies the import rules defined in Requirement 8.
2. WHEN an agent module imports from another agent's internal path, THE architecture boundary test SHALL fail with a descriptive message identifying the violation.
3. WHEN a provider module imports from an agent internal path, THE architecture boundary test SHALL fail.
4. THE architecture boundary tests SHALL run as part of `bun test` without requiring additional configuration.
5. THE architecture boundary tests SHALL complete within 10 seconds.

---

### Requirement 15: Logging Redaction Tests

**User Story:** As a developer, I want property-based tests for the logging redaction system, so that I have high confidence that secrets never appear in log output regardless of input shape.

#### Acceptance Criteria

1. THE Logging_Subsystem SHALL have a colocated `src/logging/redaction.test.ts` that tests the redaction function.
2. FOR ALL strings that match the secret pattern (contain `sk-`, `Bearer `, or are assigned to known secret keys), the redaction function SHALL return a string that does not contain the original value verbatim.
3. FOR ALL strings `s`, `redact(redact(s))` SHALL equal `redact(s)` (idempotence property).
4. THE redaction tests SHALL cover: API key patterns, bearer tokens, short secrets (≤6 chars), long secrets (>6 chars), and strings with no secret content (should pass through unchanged).
5. WHEN a log entry object contains a nested secret value (e.g., `{ ai: { apiKey: "sk-..." } }`), THE Logging_Subsystem SHALL redact the nested value.

---

## Out of Scope

The following items are explicitly **not** in scope for this feature:

- **Extension system** (`packages/`, `extensions/`) — adaptasi extension system direncanakan sebagai feature terpisah setelah fondasi stabil.
- **UI adaptasi** (`ui/`) — operator UI sudah ada dan berfungsi; adaptasi UI adalah feature terpisah.
- **Docs site** (`docs/`) — dokumentasi publik bukan prioritas fondasi.
- **Multi-provider LLM** — adaptasi provider Anthropic, Google, Groq adalah feature terpisah.
- **Memory subsystem** (`src/memory/`) — persistent memory adalah feature terpisah.
- **Hooks system** (`src/hooks/`) — hooks system adalah feature terpisah.
- **Context engine** (`src/context-engine/`) — context management adalah feature terpisah.
- **Task management** (`src/tasks/`) — task registry adalah feature terpisah.
- **Provider runtime** (`src/provider-runtime/`) — provider abstraction layer adalah feature terpisah.
- **CI/CD workflows** (`.github/workflows/`) — GitHub Actions setup adalah feature terpisah.
- **Docker/deployment** — containerization adalah feature terpisah.
- **QA scenarios** (`qa/`) — QA scenario runner adalah medium priority, bukan fondasi.
- **Git hooks** (`git-hooks/`) — pre-commit hooks adalah medium priority.
- **Changelog automation** (`changelog/`) — changelog management adalah medium priority.
- **Perubahan pada `src/domain/types.ts`** — domain contract sudah solid dan tidak perlu diubah dalam adaptasi fondasi ini.
- **Perubahan pada agent implementations** (`src/agents/`) — agent logic tidak disentuh dalam adaptasi fondasi ini.
