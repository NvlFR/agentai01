# TODO-2: Adaptasi `src/` dari Referensi OpenClaw

Dokumen ini adalah kelanjutan dari `TODO.md`, khusus untuk adaptasi semua modul di `referensi/openclaw/src/` ke project ini.

Prinsip: **semua modul dianggap relevan**. Project ini masih early, jadi lebih baik punya fondasi lengkap daripada terlalu selektif di awal.

Urutan pengerjaan mengikuti prioritas yang sama dengan `TODO.md`: fondasi dulu, capability kemudian.

---

## Prinsip Adaptasi

- Jangan copy-paste mentah. Sesuaikan dengan arsitektur AI Company Runtime.
- Ganti semua referensi `openclaw` → nama project ini.
- Hapus bagian yang spesifik ke OpenClaw (multi-platform, iOS, Android, macOS app, dll).
- Pertahankan pattern dan interface yang bagus, buang implementasi yang tidak relevan.
- Setiap modul harus punya minimal satu test colocated (`*.test.ts`).

---

## Prioritas 1 — Fondasi Core (Kerjakan Pertama)

Modul-modul ini adalah fondasi yang dibutuhkan oleh semua modul lain.

### 1. `src/logging/`

**Referensi:** `referensi/openclaw/src/logging/`

**Yang diadaptasi:**
- Subsystem-based structured logger (per agent, per component)
- Log level filtering (`debug`, `info`, `warn`, `error`)
- Secret redaction policy (mask `AI_API_KEY`, `OPERATOR_TOKEN`, `TOKEN_TELE`)
- Child logger dengan bindings (correlation ID, agent ID, project ID)
- Console output formatting untuk development
- File output untuk production

**Target path:** `src/logging/`

**Status:** Sudah ada sebagian di `src/logging/index.ts` — perlu diperkuat.

---

### 2. `src/utils/`

**Referensi:** `referensi/openclaw/src/utils/`

**Yang diadaptasi:**
- `safeParseJson` — JSON parsing yang tidak throw
- `sleep` — async delay utility
- `clamp` — number clamping
- `truncate` — string truncation dengan ellipsis
- `retry` — generic retry dengan backoff
- `dedupe` — array deduplication
- Path utilities untuk artifact namespace
- ISO 8601 timestamp helpers

**Target path:** `src/utils/`

---

### 3. `src/shared/`

**Referensi:** `referensi/openclaw/src/shared/`

**Yang diadaptasi:**
- String normalization dan coercion utilities
- Lazy promise dan deferred helpers
- Event listener utilities
- Type guard helpers (`isString`, `isNumber`, `isObject`, dll)
- Result type pattern (`Ok`/`Err`)
- Pagination helpers

**Target path:** `src/shared/`

---

### 4. `src/infra/`

**Referensi:** `referensi/openclaw/src/infra/`

**Yang diadaptasi:**
- Safe file system operations (symlink policy, path traversal prevention)
- Directory walking dengan filter
- Temp directory management (`/tmp/agentai01/`)
- Atomic file write (write-then-rename)
- File existence check yang aman
- Path resolution utilities

**Target path:** `src/infra/`

---

### 5. `src/secrets/`

**Referensi:** `referensi/openclaw/src/secrets/`

**Yang diadaptasi:**
- Secrets resolution engine (env → file → default)
- Auth profile concept untuk provider credentials
- Provider env var mapping (`AI_API_KEY`, `AI_BASE_URL`, dll)
- Secret ref contract validation
- Redaction helpers untuk logging

**Target path:** `src/secrets/`

---

### 6. `src/security/`

**Referensi:** `referensi/openclaw/src/security/`

**Yang diadaptasi:**
- Runtime security audit framework
- Dangerous config detection (exposed ports, weak tokens, dll)
- Secret equality checking (constant-time comparison)
- Operator token validation
- Security audit report generator

**Target path:** `src/security/`

---

## Prioritas 2 — Provider dan Runtime Core

### 7. `src/provider-runtime/`

**Referensi:** `referensi/openclaw/src/provider-runtime/`

**Yang diadaptasi:**
- Comprehensive retry strategy dengan exponential backoff
- Circuit breaker pattern untuk provider calls
- Provider health check
- Request timeout handling
- Rate limit detection dan backoff

**Target path:** `src/runtime-app/providers/` (extend yang sudah ada)

---

### 8. `src/types/`

**Referensi:** `referensi/openclaw/src/types/`

**Yang diadaptasi:**
- Shared utility types (DeepPartial, DeepReadonly, Awaited, dll)
- Brand types untuk ID strings
- Discriminated union helpers
- JSON-safe types

**Target path:** `src/types/`

---

### 9. `src/process/`

**Referensi:** `referensi/openclaw/src/process/`

**Yang diadaptasi:**
- Process lifecycle management
- Graceful shutdown coordination
- Signal handling (SIGTERM, SIGINT)
- Process health reporting

**Target path:** `src/process/`

---

### 10. `src/status/`

**Referensi:** `referensi/openclaw/src/status/`

**Yang diadaptasi:**
- Runtime status message types
- Status aggregation dari multiple components
- Status history tracking
- Status change event emitter

**Target path:** `src/status/`

---

## Prioritas 3 — Sessions, Memory, dan Context

### 11. `src/sessions/`

**Referensi:** `referensi/openclaw/src/sessions/`

**Yang diadaptasi:**
- Session ID generation dan resolution
- Session lifecycle events (`created`, `active`, `idle`, `closed`)
- Session transcript event logging
- Model override per session
- Session cleanup dan expiry

**Target path:** `src/sessions/`

---

### 12. `src/memory/`

**Referensi:** `referensi/openclaw/src/memory/`

**Yang diadaptasi:**
- Memory file concept (`MEMORY.md` per agent/project)
- Memory read/write interface
- Legacy memory file migration
- Memory repair directory untuk recovery
- Memory namespace per project

**Target path:** `src/memory/`

---

### 13. `src/memory-host-sdk/`

**Referensi:** `referensi/openclaw/src/memory-host-sdk/`

**Yang diadaptasi:**
- Memory host SDK interface
- Memory provider contract
- Memory search interface
- Memory indexing hooks

**Target path:** `src/memory-host-sdk/`

---

### 14. `src/context-engine/`

**Referensi:** `referensi/openclaw/src/context-engine/`

**Yang diadaptasi:**
- Context window management untuk agent conversations
- Context compression/summarization
- Context budget tracking
- Context priority scoring

**Target path:** `src/context-engine/`

---

## Prioritas 4 — Tools dan Tasks

### 15. `src/tools/`

**Referensi:** `referensi/openclaw/src/tools/`

**Yang diadaptasi:**
- Tool descriptor interface
- Tool availability evaluation
- Tool planning engine
- Tool result normalization
- Tool error handling

**Target path:** `src/tools/`

---

### 16. `src/tasks/`

**Referensi:** `referensi/openclaw/src/tasks/`

**Yang diadaptasi:**
- Task registry untuk agent
- Task lifecycle (`pending`, `running`, `done`, `failed`)
- Task dependency graph
- Task result storage

**Target path:** `src/tasks/`

---

### 17. `src/flows/`

**Referensi:** `referensi/openclaw/src/flows/`

**Yang diadaptasi:**
- Flow definition interface
- Flow step execution
- Flow state persistence
- Flow error recovery

**Target path:** `src/flows/`

---

## Prioritas 5 — Hooks, Routing, dan Plugins

### 18. `src/hooks/`

**Referensi:** `referensi/openclaw/src/hooks/`

**Yang diadaptasi:**
- Generic hook framework
- Hook registration dan deregistration
- Hook execution dengan error isolation
- Webhook inbound handler
- Hook audit logging

**Target path:** `src/hooks/`

---

### 19. `src/routing/`

**Referensi:** `referensi/openclaw/src/routing/`

**Yang diadaptasi:**
- Message routing engine
- Route resolution dari agent type
- Route validation
- Dead letter queue untuk unroutable messages

**Target path:** `src/routing/`

---

### 20. `src/plugins/`

**Referensi:** `referensi/openclaw/src/plugins/`

**Yang diadaptasi:**
- Plugin loader interface
- Plugin manifest validation
- Plugin lifecycle (`load`, `activate`, `deactivate`, `unload`)
- Plugin registry

**Target path:** `src/plugins/`

---

### 21. `src/plugin-sdk/`

**Referensi:** `referensi/openclaw/src/plugin-sdk/`

**Yang diadaptasi:**
- Plugin SDK public interface
- Plugin entry point contract
- Provider plugin interface
- Channel plugin interface
- Tool plugin interface

**Target path:** `src/plugin-sdk/`

---

### 22. `src/plugin-state/`

**Referensi:** `referensi/openclaw/src/plugin-state/`

**Yang diadaptasi:**
- Plugin state persistence
- Plugin state isolation per plugin ID
- Plugin state migration

**Target path:** `src/plugin-state/`

---

## Prioritas 6 — Channels dan Communication

### 23. `src/channels/`

**Referensi:** `referensi/openclaw/src/channels/`

**Yang diadaptasi:**
- Channel abstraction interface
- Channel message normalization
- Channel auth contract
- Channel health check
- Inbound message routing ke agent

**Target path:** `src/channels/`

---

### 24. `src/auto-reply/`

**Referensi:** `referensi/openclaw/src/auto-reply/`

**Yang diadaptasi:**
- Auto-reply policy engine
- Reply rate limiting
- Reply template system
- Reply audit logging

**Target path:** `src/auto-reply/`

---

### 25. `src/commitments/`

**Referensi:** `referensi/openclaw/src/commitments/`

**Yang diadaptasi:**
- Commitment tracking (agent promises ke operator)
- Commitment deadline monitoring
- Commitment breach alerting

**Target path:** `src/commitments/`

---

## Prioritas 7 — Gateway dan Protocol

### 26. `src/gateway/`

**Referensi:** `referensi/openclaw/src/gateway/`

**Yang diadaptasi:**
- Gateway protocol types
- Gateway auth contract
- Gateway health endpoint
- Gateway readiness endpoint
- Gateway WebSocket support (untuk real-time UI updates)

**Target path:** `src/gateway/`

---

### 27. `src/acp/`

**Referensi:** `referensi/openclaw/src/acp/`

**Yang diadaptasi:**
- Agent Communication Protocol types
- ACP message validation
- ACP approval flow
- ACP audit logging

**Target path:** `src/acp/`

---

### 28. `src/mcp/`

**Referensi:** `referensi/openclaw/src/mcp/`

**Yang diadaptasi:**
- Model Context Protocol server
- MCP tool serving
- MCP channel bridge
- MCP client untuk agent tool use

**Target path:** `src/mcp/`

---

## Prioritas 8 — Agents dan Orchestration

### 29. `src/agents/`

**Referensi:** `referensi/openclaw/src/agents/`

**Yang diadaptasi:**
- Agent base class / interface
- Agent lifecycle management
- Agent context management
- Agent subagent delegation
- Agent compaction strategy

**Target path:** `src/agents/` (extend yang sudah ada)

---

### 30. `src/cron/`

**Referensi:** `referensi/openclaw/src/cron/`

**Yang diadaptasi:**
- Cron job definition interface
- Cron schedule parser
- Cron execution dengan error isolation
- Cron audit logging

**Target path:** `src/cron/`

---

### 31. `src/daemon/`

**Referensi:** `referensi/openclaw/src/daemon/`

**Yang diadaptasi:**
- Daemon process management
- Daemon health monitoring
- Daemon restart policy
- Daemon log rotation

**Target path:** `src/daemon/`

---

## Prioritas 9 — Web, Search, dan Media

### 32. `src/web-fetch/`

**Referensi:** `referensi/openclaw/src/web-fetch/`

**Yang diadaptasi:**
- Safe HTTP fetch wrapper
- Request timeout dan retry
- Response normalization
- SSRF prevention (blocklist untuk internal IPs)
- Fetch audit logging

**Target path:** `src/web-fetch/`

---

### 33. `src/web-search/`

**Referensi:** `referensi/openclaw/src/web-search/`

**Yang diadaptasi:**
- Web search provider interface
- Search result normalization
- Search result caching
- Search provider fallback

**Target path:** `src/web-search/`

---

### 34. `src/link-understanding/`

**Referensi:** `referensi/openclaw/src/link-understanding/`

**Yang diadaptasi:**
- URL metadata extraction
- Link preview generation
- Link safety check

**Target path:** `src/link-understanding/`

---

### 35. `src/media/`

**Referensi:** `referensi/openclaw/src/media/`

**Yang diadaptasi:**
- Media type detection
- Media size validation
- Media download helper
- Media temp file management

**Target path:** `src/media/`

---

### 36. `src/media-understanding/`

**Referensi:** `referensi/openclaw/src/media-understanding/`

**Yang diadaptasi:**
- Media understanding provider interface
- Image analysis contract
- Document extraction contract

**Target path:** `src/media-understanding/`

---

### 37. `src/media-generation/`

**Referensi:** `referensi/openclaw/src/media-generation/`

**Yang diadaptasi:**
- Media generation provider interface
- Image generation contract
- Generation result storage

**Target path:** `src/media-generation/`

---

### 38. `src/image-generation/`

**Referensi:** `referensi/openclaw/src/image-generation/`

**Yang diadaptasi:**
- Image generation orchestration
- Prompt normalization
- Image result caching

**Target path:** `src/image-generation/`

---

### 39. `src/video-generation/`

**Referensi:** `referensi/openclaw/src/video-generation/`

**Yang diadaptasi:**
- Video generation provider interface
- Video job queue
- Video result storage

**Target path:** `src/video-generation/`

---

### 40. `src/music-generation/`

**Referensi:** `referensi/openclaw/src/music-generation/`

**Yang diadaptasi:**
- Music generation provider interface
- Audio result storage

**Target path:** `src/music-generation/`

---

## Prioritas 10 — Speech, TTS, dan Voice

### 41. `src/tts/`

**Referensi:** `referensi/openclaw/src/tts/`

**Yang diadaptasi:**
- TTS provider interface
- TTS result caching
- TTS audio format normalization

**Target path:** `src/tts/`

---

### 42. `src/talk/`

**Referensi:** `referensi/openclaw/src/talk/`

**Yang diadaptasi:**
- Voice conversation interface
- Turn-taking management
- Voice session lifecycle

**Target path:** `src/talk/`

---

### 43. `src/realtime-transcription/`

**Referensi:** `referensi/openclaw/src/realtime-transcription/`

**Yang diadaptasi:**
- Real-time transcription provider interface
- Transcription result streaming
- Transcription accuracy metrics

**Target path:** `src/realtime-transcription/`

---

## Prioritas 11 — UI, CLI, dan Terminal

### 44. `src/web/`

**Referensi:** `referensi/openclaw/src/web/`

**Yang diadaptasi:**
- Web server utilities
- Static file serving
- WebSocket server
- SSE (Server-Sent Events) untuk real-time UI

**Target path:** `src/web/`

---

### 45. `src/cli/`

**Referensi:** `referensi/openclaw/src/cli/`

**Yang diadaptasi:**
- CLI argument parsing
- CLI command registry
- CLI output formatting
- CLI interactive prompts

**Target path:** `src/cli/`

---

### 46. `src/terminal/`

**Referensi:** `referensi/openclaw/src/terminal/`

**Yang diadaptasi:**
- Terminal output utilities
- ANSI color helpers
- Terminal width detection
- Progress bar

**Target path:** `src/terminal/`

---

### 47. `src/tui/`

**Referensi:** `referensi/openclaw/src/tui/`

**Yang diadaptasi:**
- TUI (Text User Interface) components
- TUI layout engine
- TUI input handling

**Target path:** `src/tui/`

---

### 48. `src/markdown/`

**Referensi:** `referensi/openclaw/src/markdown/`

**Yang diadaptasi:**
- Markdown parsing utilities
- Markdown to plain text conversion
- Markdown to HTML conversion
- Frontmatter parsing

**Target path:** `src/markdown/`

---

### 49. `src/interactive/`

**Referensi:** `referensi/openclaw/src/interactive/`

**Yang diadaptasi:**
- Interactive prompt utilities
- Confirmation dialog
- Selection menu
- Input validation

**Target path:** `src/interactive/`

---

## Prioritas 12 — Config, Bootstrap, dan Bindings

### 50. `src/config/`

**Referensi:** `referensi/openclaw/src/config/`

**Yang diadaptasi:**
- Config schema definition
- Config validation dengan zod
- Config hot reload
- Config migration
- Config export untuk docs

**Target path:** `src/config/` (extend yang sudah ada di `src/runtime-app/config/`)

---

### 51. `src/bootstrap/`

**Referensi:** `referensi/openclaw/src/bootstrap/`

**Yang diadaptasi:**
- Application bootstrap sequence
- Dependency injection container
- Service registration
- Boot health check

**Target path:** `src/bootstrap/`

---

### 52. `src/bindings/`

**Referensi:** `referensi/openclaw/src/bindings/`

**Yang diadaptasi:**
- Native bindings interface
- Platform detection
- Binding fallback strategy

**Target path:** `src/bindings/`

---

### 53. `src/compat/`

**Referensi:** `referensi/openclaw/src/compat/`

**Yang diadaptasi:**
- Backward compatibility helpers
- Migration utilities
- Deprecation warnings

**Target path:** `src/compat/`

---

## Prioritas 13 — Observability dan Diagnostics

### 54. `src/logging/` (lanjutan)

**Referensi:** `referensi/openclaw/src/logging.ts` (root level)

**Yang diadaptasi:**
- Global logging configuration
- Log aggregation
- Log export (JSON, text)

---

### 55. `src/trajectory/`

**Referensi:** `referensi/openclaw/src/trajectory/`

**Yang diadaptasi:**
- Agent trajectory tracking (sequence of actions)
- Trajectory replay
- Trajectory analysis untuk debugging

**Target path:** `src/trajectory/`

---

### 56. `src/proxy-capture/`

**Referensi:** `referensi/openclaw/src/proxy-capture/`

**Yang diadaptasi:**
- HTTP proxy capture untuk debugging
- Request/response logging
- Replay captured requests

**Target path:** `src/proxy-capture/`

---

## Prioritas 14 — Pairing, Node, dan Infrastructure

### 57. `src/pairing/`

**Referensi:** `referensi/openclaw/src/pairing/`

**Yang diadaptasi:**
- Device/instance pairing protocol
- Pairing token generation
- Pairing state management

**Target path:** `src/pairing/`

---

### 58. `src/node-host/`

**Referensi:** `referensi/openclaw/src/node-host/`

**Yang diadaptasi:**
- Node host interface
- Remote execution contract
- Node health monitoring

**Target path:** `src/node-host/`

---

### 59. `src/crestodian/`

**Referensi:** `referensi/openclaw/src/crestodian/`

**Yang diadaptasi:**
- Credential storage interface
- Credential encryption
- Credential rotation

**Target path:** `src/crestodian/`

---

## Prioritas 15 — Docs, Scripts, dan i18n

### 60. `src/docs/`

**Referensi:** `referensi/openclaw/src/docs/`

**Yang diadaptasi:**
- Doc generation utilities
- API doc extraction dari TypeScript
- Doc validation

**Target path:** `src/docs/`

---

### 61. `src/scripts/`

**Referensi:** `referensi/openclaw/src/scripts/`

**Yang diadaptasi:**
- Script utilities yang dipakai dari src
- Build helpers
- Code generation utilities

**Target path:** `src/scripts/`

---

### 62. `src/i18n/`

**Referensi:** `referensi/openclaw/src/i18n/`

**Yang diadaptasi:**
- i18n string management
- Locale detection
- Translation loading

**Target path:** `src/i18n/`

---

### 63. `src/model-catalog/`

**Referensi:** `referensi/openclaw/src/model-catalog/`

**Yang diadaptasi:**
- Model catalog interface
- Model capability metadata
- Model selection logic
- Model pricing estimates

**Target path:** `src/model-catalog/`

---

### 64. `src/chat/`

**Referensi:** `referensi/openclaw/src/chat/`

**Yang diadaptasi:**
- Chat message types
- Chat history management
- Chat context building
- Chat turn management

**Target path:** `src/chat/`

---

### 65. `src/commands/`

**Referensi:** `referensi/openclaw/src/commands/`

**Yang diadaptasi:**
- Command registry
- Command parsing
- Command execution
- Command help generation

**Target path:** `src/commands/`

---

### 66. `src/wizard/`

**Referensi:** `referensi/openclaw/src/wizard/`

**Yang diadaptasi:**
- Setup wizard interface
- Step-by-step onboarding flow
- Wizard state persistence

**Target path:** `src/wizard/`

---

## Urutan Eksekusi yang Disarankan

Kalau mau dikerjakan bertahap:

1. **Batch 1** — Fondasi: `logging`, `utils`, `shared`, `infra`, `secrets`, `security`, `types`
2. **Batch 2** — Runtime core: `provider-runtime`, `process`, `status`, `config`, `bootstrap`
3. **Batch 3** — Sessions dan memory: `sessions`, `memory`, `memory-host-sdk`, `context-engine`
4. **Batch 4** — Tools dan tasks: `tools`, `tasks`, `flows`, `hooks`, `routing`
5. **Batch 5** — Plugins: `plugins`, `plugin-sdk`, `plugin-state`
6. **Batch 6** — Channels dan gateway: `channels`, `gateway`, `acp`, `mcp`, `auto-reply`
7. **Batch 7** — Web dan search: `web`, `web-fetch`, `web-search`, `link-understanding`
8. **Batch 8** — Media: `media`, `media-understanding`, `media-generation`, `image-generation`, `video-generation`, `music-generation`
9. **Batch 9** — Speech dan voice: `tts`, `talk`, `realtime-transcription`
10. **Batch 10** — UI dan CLI: `cli`, `terminal`, `tui`, `markdown`, `interactive`
11. **Batch 11** — Agents dan orchestration: `agents`, `cron`, `daemon`, `trajectory`
12. **Batch 12** — Infrastructure: `pairing`, `node-host`, `crestodian`, `bindings`, `compat`
13. **Batch 13** — Observability: `proxy-capture`, `commitments`
14. **Batch 14** — Docs dan i18n: `docs`, `scripts`, `i18n`, `model-catalog`, `chat`, `commands`, `wizard`

---

## Catatan

- Batch 1-3 adalah yang paling critical untuk fondasi runtime.
- Batch 4-6 penting untuk agent capability.
- Batch 7-14 bisa dikerjakan sesuai kebutuhan fitur.
- Lihat `TODO.md` untuk adaptasi folder dan extensions lainnya.
- Lihat `AI-WORKFLOW.md` untuk cara membagi kerja antara Kiro, Codex, dan Gemini.
