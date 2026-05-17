# AGENTS.md

Telegraph style. Root rules only. Baca scoped `AGENTS.md` sebelum kerja di subtree.

## Start

- Repo: `agentai01` — AI Company Runtime Platform dengan hierarki sub-agent 4 tingkat
- Replies: gunakan path relatif dari root repo: `src/agents/subagents/marketing/index.ts:30`
- Fix/triage butuh: source, tests, behavior saat ini, dan bukti dependency contract
- Behavior yang didukung dependency: baca upstream docs/source/types dulu. Jangan tebak API/default/error/timing
- Live-verify kalau memungkinkan. Jangan pernah print secrets
- Missing deps: `npm install`, retry sekali, lalu report error pertama yang actionable
- Jangan edit `node_modules`

## Map

- Core domain: `src/domain/` — types, kontrak utama, dan `hierarchy.ts` (hierarki 4 tingkat)
- Agents: `src/agents/` — CEO, engineering, marketing, product, project-manager, sales, support
- Sub-Agents: `src/agents/subagents/` — spesialis per departemen (baton-passing architecture)
- Runtime: `src/runtime/` — orchestrator, scratchpad, batonPassing
- Runtime App: `src/runtime-app/` — HTTP server, worker, scheduler, Telegram bot, UI, providers
- Registry: `src/registry/` — AgentRegistry (domain) + SubAgentRegistry (hierarki)
- App: `src/app/` — app-level exports
- Docs: `docs/` — dokumentasi project
- Specs: `.kiro/specs/` — spesifikasi fitur per domain

## Architecture — 4-Tier Hierarchy

```
Owner (Human / Mission Control)
  └── CEO Agent (ceo-agent)
        ├── Sub-Agents: StrategyAnalyst, ReportSummarizer, DecisionLogger, OKRTracker
        ├── Marketing Head (marketing-head)
        │     └── ContentCreator, SEOSpecialist, CampaignManager, AnalyticsReader, SocialScheduler, TrendWatcher
        ├── Engineering Head (engineering-head)
        │     └── CodeReviewer, BugHunter, DocsWriter, InfraMonitor, TestGenerator, PRSummarizer
        ├── Product Head (product-head)
        │     └── UserResearcher, FeaturePrioritizer, PRDWriter, RoadmapBuilder, FeedbackAnalyzer
        ├── Project Manager Head (pm-head)
        │     └── TaskCoordinator, RiskAnalyzer, SprintPlanner, ProgressReporter, DeadlineWatcher
        ├── Sales Head (sales-head)
        │     └── LeadQualifier, ProposalGenerator, FollowUpDrafter, PipelineTracker, CompetitorWatcher
        └── Support Head (support-head)
              └── TicketClassifier, FAQResponder, EscalationRouter, CSATAnalyzer, KnowledgeBuilder, WABotHandler
```

**Baton Passing**: Departemen Head mendelegasikan tugas ke chain sub-agen via `BatonPassingOrchestrator`. Setiap sub-agen menyelesaikan tugasnya lalu `pass()` ke agen berikutnya. Hasil akhir dikembalikan ke Head.

**IntraDepartmentScratchpad**: Memori terisolasi per departemen. Komunikasi sub-agen tidak membanjiri `OperatorEventBus` utama.

**SubAgentRegistry**: Registry terpisah dari `AgentRegistry` untuk pohon hierarki. Validasi Zod ketat, cek referential integrity.

## Commands

- Runtime: Bun 1.3.x + Node 20+ untuk toolchain compatibility
- Install: `npm install`
- Dev server: `npm run dev` (watch mode)
- Runtime app: `npm run runtime:app`
- Worker: `npm run runtime:worker`
- Scheduler: `npm run runtime:scheduler`
- Smoke test: `npm run runtime:smoke`
- Telegram bot: `npm run runtime:telegram`
- Tests: `bun test`
- Typecheck: `npm run check`

## Validation

- Jalankan `npm run check` sebelum push untuk typecheck
- Jalankan `bun test` untuk unit tests
- Jalankan `npm run runtime:smoke` untuk end-to-end smoke test dengan provider nyata
- Sebelum handoff/push: buktikan surface yang disentuh sudah ditest
- Jangan landing kode dengan failing typecheck, test, atau smoke

## Code

- TypeScript ESM strict. Hindari `any`; prefer real types, `unknown`, narrow adapter
- Tidak ada `@ts-nocheck`. Lint suppressions hanya kalau intentional dan ada penjelasan
- External boundaries: gunakan zod atau schema helpers yang sudah ada
- Runtime branching: discriminated unions/closed codes, bukan freeform strings
- Hindari semantic sentinels (`?? 0`, empty object/string)
- Classes: tidak ada prototype mixins/mutations. Prefer inheritance/composition
- Comments: singkat, hanya untuk logic non-obvious

## Sub-Agent Rules

- Sub-agent hanya bisa menggunakan MCP tools dalam `allowedMcpTools` list-nya
- Specialist `roleType` wajib punya `parentAgentId`
- CEO `roleType` tidak boleh punya `parentAgentId`
- Setiap `parentAgentId` harus menunjuk ke agen yang terdaftar di `SubAgentRegistry`
- Gunakan `validateIntegrity()` setelah batch registration untuk cek referential integrity

## Tests

- Bun test. Colocated `*.test.ts`
- Prefer behavior tests
- Clean timers/env/globals/mocks/temp dirs setelah test
- Prefer injection dan narrow mocks daripada broad barrel mocks
- Jangan edit baseline/snapshot/expected-failure files tanpa approval eksplisit

## Git

- Commits: conventional-ish, concise, grouped
- Stage hanya file yang intended
- Jangan hapus/rename file yang tidak diharapkan; tanya kalau blocking
- Push ke branch baru, bukan langsung ke `main`, kecuali diminta eksplisit

## Security

- Jangan pernah commit credentials, tokens, API keys, atau secrets ke repo
- Secrets: simpan di `.env.local` (tidak di-commit) atau environment variable
- `.env` boleh berisi defaults non-secret saja
- `OPERATOR_TOKEN` dan `AI_API_KEY` harus selalu dari env, tidak pernah hardcoded
- UI harus mask `AI_API_KEY`; jangan tampilkan raw secret ke operator
- Lihat `SECURITY.md` untuk full security policy

## Provider

- Provider untuk saat ini development pake OpenAI-compatible (base URL + API key + model)
- Default: `AI_BASE_URL=http://127.0.0.1:8045/v1`, `AI_MODEL=gemini-3-flash`
- `AI_API_KEY` wajib ada agar `/ready` menjadi ready
- Timeout default: 30 detik (`AI_TIMEOUT_MS`)
