# AgentAI01 — AI Company Runtime Platform

> **Sebuah perusahaan yang dijalankan oleh tim agen AI.** Hierarki 4 tingkat, spesialisasi per departemen, baton-passing orchestration.

---

## Apa Ini?

AgentAI01 adalah platform runtime untuk membangun **AI Company** — organisasi virtual di mana pekerjaan operasional dijalankan oleh agen AI yang terstruktur secara hierarkis, sama seperti perusahaan nyata.

```
Human Operator
    └── CEO Agent
          ├── Marketing Head → [6 sub-agents]
          ├── Engineering Head → [6 sub-agents]
          ├── Product Head → [5 sub-agents]
          ├── PM Head → [5 sub-agents]
          ├── Sales Head → [5 sub-agents]
          └── Support Head → [6 sub-agents]
```

**33 sub-agent specialists.** Setiap departemen punya memori terisolasi dan MCP tools eksklusif.

---

## Quick Start

```bash
# Install dependencies
npm install

# Copy env template dan isi secrets
cp .env .env.local
# Edit .env.local: AI_API_KEY, OPERATOR_TOKEN

# Jalankan runtime app
npm run runtime:app

# Atau mode development (watch)
npm run dev
```

### Environment Variables Wajib

```env
AI_API_KEY=your_api_key_here
OPERATOR_TOKEN=your_operator_token_here

# Optional (sudah ada default)
AI_BASE_URL=http://127.0.0.1:8045/v1
AI_MODEL=gemini-3-flash
AI_TIMEOUT_MS=30000
PORT=3001
```

---

## Arsitektur

### 4-Tier Hierarchy

| Tier | Role | Tanggung Jawab |
|------|------|----------------|
| 1 | **Owner** (Human) | Strategic directives, approvals |
| 2 | **CEO Agent** | Orchestration, delegation, OKR tracking |
| 3 | **Department Heads** | Dept workflow orchestration |
| 4 | **Sub-Agent Specialists** | Eksekusi teknis fokus |

### Core Modules

| Module | Path | Fungsi |
|--------|------|--------|
| Domain Types | `src/domain/types.ts` | Lifecycle, messages, approval gates |
| Hierarchy Types | `src/domain/hierarchy.ts` | 4-tier config + Zod validation |
| AgentRegistry | `src/registry/AgentRegistry.ts` | State, history, access control |
| SubAgentRegistry | `src/registry/subAgentRegistry.ts` | Tree hierarki, integrity check |
| Scratchpad | `src/runtime/scratchpad.ts` | Isolated dept memory (TTL-based) |
| BatonPassing | `src/runtime/batonPassing.ts` | Delegate→pass→return state machine |
| Sub-Agents | `src/agents/subagents/` | 33 specialists across 7 depts |

### Baton Passing Flow

```
Marketing Head
    │ delegate(agentChain=['content-creator', 'seo', 'campaign'])
    ▼
Content Creator → pass(output: {draft}) → SEO Specialist → pass(output: {optimized}) → Campaign Manager
                                                                                               │
                                                                                        task complete
                                                                                               │
                                                              ◄────────────────── return to Head
```

---

## Department Sub-Agents

### CEO Department
`StrategyAnalyst` · `ReportSummarizer` · `DecisionLogger` · `OKRTracker`

### Marketing Department
`ContentCreator` · `SEOSpecialist` · `CampaignManager` · `AnalyticsReader` · `SocialScheduler` · `TrendWatcher`

### Engineering Department
`CodeReviewer` · `BugHunter` · `DocsWriter` · `InfraMonitor` · `TestGenerator` · `PRSummarizer`

### Product Department
`UserResearcher` · `FeaturePrioritizer` · `PRDWriter` · `RoadmapBuilder` · `FeedbackAnalyzer`

### Project Manager Department
`TaskCoordinator` · `RiskAnalyzer` · `SprintPlanner` · `ProgressReporter` · `DeadlineWatcher`

### Sales Department
`LeadQualifier` · `ProposalGenerator` · `FollowUpDrafter` · `PipelineTracker` · `CompetitorWatcher`

### Support Department
`TicketClassifier` · `FAQResponder` · `EscalationRouter` · `CSATAnalyzer` · `KnowledgeBuilder` · `WABotHandler`

---

## Development Commands

```bash
npm run dev              # Watch mode
npm run runtime:app      # HTTP server + UI
npm run runtime:worker   # Background worker
npm run runtime:scheduler # Cron scheduler
npm run runtime:smoke    # End-to-end smoke test (needs AI_API_KEY)
npm run runtime:telegram # Telegram bot
npm run check            # TypeScript typecheck
bun test                 # Unit tests
```

---

## MCP Tools yang Didukung

`anthropic_api` · `notion` · `google_sheets` · `google_drive` · `gmail` · `slack` · `google_calendar` · `github` · `web_search` · `bash_tool` · `figma_mcp` · `canva_mcp` · `whatsapp_api`

Setiap sub-agent hanya boleh menggunakan tools dalam `allowedMcpTools`-nya.

---

## Stack Teknologi

- **Runtime**: [Bun](https://bun.sh) 1.3.x
- **Language**: TypeScript (ESM strict, no `any`)
- **Validation**: [Zod](https://zod.dev) v4
- **AI Provider**: OpenAI-compatible API
- **Channels**: Telegram Bot API, WhatsApp API
- **Storage**: In-memory (dengan persistence layer coming)

---

## Dokumentasi Lanjut

- [`VISION.md`](./VISION.md) — Visi dan roadmap platform
- [`SECURITY.md`](./SECURITY.md) — Security policy
- [`CODEX.md`](./CODEX.md) — Coding standards dan patterns
- [`.kiro/specs/`](./.kiro/specs/) — Spesifikasi fitur lengkap
- [`.kiro/specs/detail-agent/`](./.kiro/specs/detail-agent/) — Detail tiap agent dan sub-agent

---

## Status

| Komponen | Status |
|----------|--------|
| Domain Types & Lifecycle | ✅ Done |
| AgentRegistry (state, history, audit) | ✅ Done |
| 7 Department Agents | ✅ Done |
| AgentHierarchyConfig + Zod Schema | ✅ Done |
| SubAgentRegistry (4-tier tree) | ✅ Done |
| IntraDepartmentScratchpad | ✅ Done |
| BatonPassingOrchestrator | ✅ Done |
| 33 Sub-Agent Specialists | ✅ Done |
| MCP Tool Live Binding | 🔜 Next |
| Operator Control UI | 🔜 Planned |

---

> Built with 🤖 AI agents helping AI agents.
