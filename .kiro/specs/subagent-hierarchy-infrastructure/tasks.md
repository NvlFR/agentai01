# Tasks — Sub-Agent Hierarchy Infrastructure

## Aturan Global (berlaku untuk SEMUA task)

**Larangan keras di setiap task:**
- Dilarang menghasilkan file yang hanya berisi `export type {}` atau type definitions tanpa runtime code
- Dilarang menggunakan `throw new Error('not implemented')` sebagai implementasi final
- Dilarang menggunakan `() => {}` sebagai body function yang seharusnya punya behavior
- Dilarang meninggalkan `// TODO` di production code path — catat di `TODO.md` root jika benar-benar blocked
- Dilarang menggunakan `any`; gunakan real types, `unknown`, atau narrow adapter
- Dilarang import relatif tanpa suffix `.js` pada TypeScript ESM
- Dilarang copy platform-specific OpenClaw code (iOS, macOS native, browser extension, product-specific glue)
- Dilarang commit jika `npm run check` masih error
- Dilarang commit jika `bun test` masih failing untuk file yang disentuh

**Verifikasi wajib di setiap task:**
1. `npm run check` — zero TypeScript errors
2. `bun test <file>.test.ts` — semua test pass
3. **AI smoke test** — jalankan `npm run runtime:smoke` dan pastikan output tidak ada error baru yang disebabkan oleh perubahan task ini. Smoke test memanggil AI provider nyata via `AI_BASE_URL` + `AI_API_KEY`.

**Test dan boundary rules:**
- External boundary wajib pakai Zod atau schema helper yang sudah ada.
- Module parse/serialize wajib punya round-trip behavior test.
- Time-dependent behavior wajib pakai injected `now`, bukan `Date.now()` langsung di test.
- Timer, env, globals, mocks, dan temp dirs wajib dibersihkan.
- Filesystem test wajib pakai `createTempDirectory()` setelah tersedia.
- Index barrel hanya re-export; implementasi tetap di sub-file.

**Format bukti selesai:**
Setiap task dianggap selesai hanya jika ada bukti nyata:
- Output `npm run check` clean
- Output `bun test` semua pass
- Output `npm run runtime:smoke` tidak ada regression

---

## Phase 1 — Sub-Agent Registry & Core Hierarchy Contracts

> Fokus: Membangun fondasi struktur data hierarki 4 tingkat (Owner -> CEO -> Dept Head -> Sub-Agent), validasi Zod, dan registrasi sub-agen.

| Task ID | Nama Task | Deskripsi & Kontrak Implementasi | Status |
| :--- | :--- | :--- | :---: |
| **1.1** | `SubAgentHierarchyTypes` | Buat antarmuka `AgentHierarchyConfig` dan skema Zod `AgentHierarchyConfigSchema` di `src/domain/hierarchy.ts` untuk memvalidasi atribut `roleType: 'ceo' \| 'head' \| 'specialist'`, `parentAgentId`, dan `subAgentIds`. | [x] |
| **1.2** | `SubAgentRegistry` | Implementasikan class `SubAgentRegistry` di `src/registry/subAgentRegistry.ts` dengan metode pendaftaran, pencarian berdasarkan induk, dan validasi duplikasi ID. | [x] |
| **1.3** | `SubAgentRegistryTest` | Buat pengujian colocated `src/registry/subAgentRegistry.test.ts` untuk memverifikasi pendaftaran hierarki dan penanganan error duplikasi. | [x] |

---

## Phase 2 — Intra-Department Memory & Baton Passing Protocols

> Fokus: Mengimplementasikan mekanisme isolasi memori departemen dan protokol serah terima tugas (baton passing).

| Task ID | Nama Task | Deskripsi & Kontrak Implementasi | Status |
| :--- | :--- | :--- | :---: |
| **2.1** | `IntraDepartmentScratchpad`| Implementasikan `IntraDepartmentScratchpad` di `src/runtime/scratchpad.ts` sebagai antrean pesan terisolasi per departemen dengan batas TTL dan kapasitas. | [x] |
| **2.2** | `BatonPassingProtocol` | Buat class `BatonPassingOrchestrator` di `src/runtime/batonPassing.ts` yang mengelola transisi status `delegate`, `pass`, dan `return` antar sub-agen. | [x] |
| **2.3** | `BatonPassingTest` | Buat pengujian `src/runtime/batonPassing.test.ts` untuk mensimulasikan serah terima berantai antar sub-agen. | [x] |

---

## Phase 3 — Marketing Department Sub-Agents Implementation

> Fokus: Membangun implementasi nyata sub-agen di bawah komando Marketing Agent.

| Task ID | Nama Task | Deskripsi & Kontrak Implementasi | Status |
| :--- | :--- | :--- | :---: |
| **3.1** | `ContentCreatorAgent` | Implementasikan `ContentCreatorSpecialist` di `src/agents/subagents/marketing/index.ts` dengan *binding* ke Canva dan Notion. | [x] |
| **3.2** | `SEOSpecialistAgent` | Implementasikan `SEOSpecialist` di `src/agents/subagents/marketing/index.ts` untuk riset kata kunci dan audit SEO. | [x] |
| **3.3** | `CampaignManagerAgent` | Implementasikan `CampaignManagerSpecialist` di `src/agents/subagents/marketing/index.ts` untuk kampanye dan WA blast. | [x] |
| **3.4** | `AnalyticsReaderAgent` | Implementasikan `AnalyticsReaderSpecialist` di `src/agents/subagents/marketing/index.ts` untuk analisis performa. | [x] |
| **3.5** | `SocialSchedulerAgent` | Implementasikan `SocialSchedulerSpecialist` di `src/agents/subagents/marketing/index.ts` untuk penjadwalan konten. | [x] |
| **3.6** | `TrendWatcherAgent` | Implementasikan `TrendWatcherSpecialist` di `src/agents/subagents/marketing/index.ts` untuk memantau tren viral. | [x] |
| **3.7** | `MarketingSubAgentsTest`| Buat pengujian integrasi `src/agents/subagents/marketing/marketingSubAgents.test.ts` untuk memvalidasi kolaborasi penuh departemen marketing. | [x] |

---

## Phase 4 — Extension to Other Departments & Final Verification

> Fokus: Memperluas topologi ke departemen CEO, Sales, Product, Engineering, PM, dan Support, serta verifikasi akhir.

| Task ID | Nama Task | Deskripsi & Kontrak Implementasi | Status |
| :--- | :--- | :--- | :---: |
| **4.1** | `CEOAgentSubAgents` | Implementasikan spesialis `StrategyAnalyst`, `ReportSummarizer`, `DecisionLogger`, dan `OKRTracker` di `src/agents/subagents/ceo/`. | [x] |
| **4.2** | `SalesSubAgents` | Implementasikan spesialis `LeadQualifier`, `ProposalGenerator`, `FollowUpDrafter`, `PipelineTracker`, dan `CompetitorWatcher` di `src/agents/subagents/sales/`. | [x] |
| **4.3** | `ProductSubAgents` | Implementasikan spesialis `UserResearcher`, `FeaturePrioritizer`, `PRDWriter`, `RoadmapBuilder`, dan `FeedbackAnalyzer` di `src/agents/subagents/product/`. | [x] |
| **4.4** | `EngineeringSubAgents`| Implementasikan spesialis `CodeReviewer`, `BugHunter`, `DocsWriter`, `InfraMonitor`, `TestGenerator`, dan `PRSummarizer` di `src/agents/subagents/engineering/`. | [x] |
| **4.5** | `ProjectManagerSubAgents`| Implementasikan spesialis `TaskCoordinator`, `RiskAnalyzer`, `SprintPlanner`, `ProgressReporter`, dan `DeadlineWatcher` di `src/agents/subagents/pm/`. | [x] |
| **4.6** | `SupportSubAgents` | Implementasikan spesialis `TicketClassifier`, `FAQResponder`, `EscalationRouter`, `CSATAnalyzer`, `KnowledgeBuilder`, dan `WABotHandler` di `src/agents/subagents/support/`. | [x] |
| **4.7** | `FinalSystemVerification`| Jalankan `npm run check`, `bun test`, dan `npm run runtime:smoke` untuk memastikan tidak ada regresi pada sistem orkestrasi utama. | [x] |

---

## Phase 5 — MCP Tools & Repositories Mapping

> Fokus: Mengimplementasikan `mcp-tools-mapping.md` — katalog server MCP resmi, pemetaan logical tool → server, profil repositori eksternal per agen, dan validasi binding terhadap `design.md`.

| Task ID | Nama Task | Deskripsi & Kontrak Implementasi | Status |
| :--- | :--- | :--- | :---: |
| **5.1** | `McpToolsMappingModule` | Buat `src/domain/mcpToolsMapping.ts` dengan `MCP_SERVER_CATALOG`, `LOGICAL_TOOL_TO_MCP_SERVERS`, `AGENT_MCP_TOOL_PROFILES`, dan `DESIGN_CANONICAL_TOOLS` (sumber: design.md + mcp-tools-mapping.md). | [x] |
| **5.2** | `McpToolsMappingTest` | Buat `src/domain/mcpToolsMapping.test.ts` — validasi pemetaan tool, profil CEO/marketing, dan keselarasan seluruh `*_DEPARTMENT_CONFIGS` dengan design. | [x] |
| **5.3** | `RegistryMcpValidation` | Integrasikan `validateRegistryMcpToolBindings()` ke `SubAgentRegistry.validateIntegrity()`. | [x] |
| **5.4** | `RegisterAllDepartments` | Export `registerAllSubAgentDepartments()` dari `src/agents/subagents/index.ts` + re-export helper mapping. | [x] |
| **5.5** | `AlignCeoToolBindings` | Selaraskan `ceo-report-summarizer` dan `ceo-okr-tracker` dengan tabel tools di design.md. | [x] |

### Catatan keselarasan requirements ↔ tasks

- **requirements.md §3** mendefinisikan **37 specialist** + CEO sub-agen (4) di 7 departemen; **tasks Phase 3** hanya mengimplementasikan Marketing secara eksplisit — Phase 4 menutup departemen lain (sesuai requirements).
- **requirements.md §4** master list **13 logical tools** (`McpToolId`); **mcp-tools-mapping.md** menambah lapisan **11 server MCP resmi** + repositori GitHub eksternal — keduanya diimplementasikan di `mcpToolsMapping.ts`, bukan dengan menambah ID tool baru di luar master list.
- Nama peran di **mcp-tools-mapping.md** (mis. *Lead Hunter*, *Proposal Architect*) dipetakan ke **agentId runtime** (mis. `marketing-trend-watcher`, `sales-proposal-generator`) via field `specRoleName` pada profil.

---

## Bukti Penyelesaian Phase 1-4

```
npm run check → Exit code 0 (TypeScript clean)
bun test      → 48 pass, 0 fail, 113 expect() calls
Files tested  → subAgentRegistry.test.ts, batonPassing.test.ts, marketingSubAgents.test.ts
```

> Setelah Phase 5 selesai, jalankan ulang `npm run check`, `bun test`, dan perbarui bukti di atas.

---

## Phase 6 — Sub-Agent Runtime Execution (Working Agents)

> Fokus: Specialist benar-benar mengeksekusi tugas (deterministic + optional AI provider), terintegrasi dengan baton chain.

| Task ID | Nama Task | Deskripsi & Kontrak Implementasi | Status |
| :--- | :--- | :--- | :---: |
| **6.1** | `SubAgentSpecialistExecutor` | `src/runtime/subagents/specialistExecutor.ts` — mode `deterministic` / `provider` / `auto`. | [x] |
| **6.2** | `SpecialistHandlers` | Handler per `agentId` di `src/runtime/subagents/handlers/` (44 agen + generic fallback). | [x] |
| **6.3** | `DepartmentRunner` | `runBatonChain()` — delegate → execute tiap specialist → pass baton sampai selesai. | [x] |
| **6.4** | `RuntimeTests` | `src/runtime/subagents/departmentRunner.test.ts` — PM sprint + marketing campaign chain. | [x] |
| **6.5** | `PmRunHelper` | `runPMSprintChain()` + `execute` export di `taskCoordinator.ts`. | [x] |

---

## Phase 7 — Real MCP Integrations & Runtime Operational App Wiring

> Fokus: Mengganti simulasi output dengan panggilan MCP server sungguhan (Notion, GitHub, Slack, Canva), menyambungkan Head ke runtime specialist, export fungsi `execute` di semua file specialist, menghubungkan ke UI Operator, dan memperbarui spesifikasi detail agen.

| Task ID | Nama Task | Deskripsi & Kontrak Implementasi | Status |
| :--- | :--- | :--- | :---: |
| **7.1** | `RealMcpIntegration` | Implementasikan panggilan MCP server sungguhan (Notion, GitHub, Slack, Canva) menggantikan mock/simulasi di output handler. | [x] |
| **7.2** | `SpecialistExecuteExport` | Export fungsi `execute` di semua file specialist (seluruh 33 sub-agen) agar dapat dipanggil secara modular. | [x] |
| **7.3** | `ContentCreatorRuntime` | Buat runtime spesifik untuk `ContentCreator` yang mencakup prompt aktual dan pemanggilan LLM. | [x] |
| **7.4** | `HeadToSpecialistWiring` | Implementasikan wiring otomatis: Head memanggil specialist runtime melalui `BatonPassingOrchestrator` secara dinamis. | [x] |
| **7.5** | `OperatorUIWiring` | Sambungkan infrastruktur eksekusi agen ke `RuntimeOperationalApp` dan UI Operator untuk memfasilitasi *human-in-the-loop* (approval/monitoring). | [x] |
| **7.6** | `DetailAgentSpecsUpdate` | Perbarui spesifikasi di `.kiro/specs/detail-agent/00*.md` sampai `06*.md` sesuai dengan arsitektur eksekusi dan wiring MCP terbaru. | [x] |
