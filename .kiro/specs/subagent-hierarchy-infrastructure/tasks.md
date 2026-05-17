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
| **1.1** | `SubAgentHierarchyTypes` | Buat antarmuka `AgentHierarchyConfig` dan skema Zod `AgentHierarchyConfigSchema` di `src/domain/hierarchy.ts` untuk memvalidasi atribut `roleType: 'ceo' \| 'head' \| 'specialist'`, `parentAgentId`, dan `subAgentIds`. | [ ] |
| **1.2** | `SubAgentRegistry` | Implementasikan class `SubAgentRegistry` di `src/registry/subAgentRegistry.ts` dengan metode pendaftaran, pencarian berdasarkan induk, dan validasi duplikasi ID. | [ ] |
| **1.3** | `SubAgentRegistryTest` | Buat pengujian colocated `src/registry/subAgentRegistry.test.ts` untuk memverifikasi pendaftaran hierarki dan penanganan error duplikasi. | [ ] |

---

## Phase 2 — Intra-Department Memory & Baton Passing Protocols

> Fokus: Mengimplementasikan mekanisme isolasi memori departemen dan protokol serah terima tugas (baton passing).

| Task ID | Nama Task | Deskripsi & Kontrak Implementasi | Status |
| :--- | :--- | :--- | :---: |
| **2.1** | `IntraDepartmentScratchpad`| Implementasikan `IntraDepartmentScratchpad` di `src/runtime/scratchpad.ts` sebagai antrean pesan terisolasi per departemen dengan batas TTL dan kapasitas. | [ ] |
| **2.2** | `BatonPassingProtocol` | Buat class `BatonPassingOrchestrator` di `src/runtime/batonPassing.ts` yang mengelola transisi status `delegate`, `pass`, dan `return` antar sub-agen. | [ ] |
| **2.3** | `BatonPassingTest` | Buat pengujian `src/runtime/batonPassing.test.ts` untuk mensimulasikan serah terima berantai antar sub-agen. | [ ] |

---

## Phase 3 — Marketing Department Sub-Agents Implementation

> Fokus: Membangun implementasi nyata sub-agen di bawah komando Marketing Agent.

| Task ID | Nama Task | Deskripsi & Kontrak Implementasi | Status |
| :--- | :--- | :--- | :---: |
| **3.1** | `ContentCreatorAgent` | Implementasikan `ContentCreatorSpecialist` di `src/agents/subagents/marketing/contentCreator.ts` dengan *binding* ke Canva dan Notion. | [ ] |
| **3.2** | `SEOSpecialistAgent` | Implementasikan `SEOSpecialist` di `src/agents/subagents/marketing/seoSpecialist.ts` untuk riset kata kunci dan audit SEO. | [ ] |
| **3.3** | `CampaignManagerAgent` | Implementasikan `CampaignManagerSpecialist` di `src/agents/subagents/marketing/campaignManager.ts` untuk kampanye dan WA blast. | [ ] |
| **3.4** | `AnalyticsReaderAgent` | Implementasikan `AnalyticsReaderSpecialist` di `src/agents/subagents/marketing/analyticsReader.ts` untuk analisis performa. | [ ] |
| **3.5** | `SocialSchedulerAgent` | Implementasikan `SocialSchedulerSpecialist` di `src/agents/subagents/marketing/socialScheduler.ts` untuk penjadwalan konten. | [ ] |
| **3.6** | `TrendWatcherAgent` | Implementasikan `TrendWatcherSpecialist` di `src/agents/subagents/marketing/trendWatcher.ts` untuk memantau tren viral. | [ ] |
| **3.7** | `MarketingSubAgentsTest`| Buat pengujian integrasi `src/agents/subagents/marketing/marketingSubAgents.test.ts` untuk memvalidasi kolaborasi penuh departemen marketing. | [ ] |

---

## Phase 4 — Extension to Other Departments & Final Verification

> Fokus: Memperluas topologi ke departemen CEO, Sales, Product, Engineering, PM, dan Support, serta verifikasi akhir.

| Task ID | Nama Task | Deskripsi & Kontrak Implementasi | Status |
| :--- | :--- | :--- | :---: |
| **4.1** | `CEOAgentSubAgents` | Implementasikan spesialis `StrategyAnalyst`, `ReportSummarizer`, `DecisionLogger`, dan `OKRTracker` di `src/agents/subagents/ceo/`. | [ ] |
| **4.2** | `SalesSubAgents` | Implementasikan spesialis `LeadQualifier`, `ProposalGenerator`, `FollowUpDrafter`, `PipelineTracker`, dan `CompetitorWatcher` di `src/agents/subagents/sales/`. | [ ] |
| **4.3** | `ProductSubAgents` | Implementasikan spesialis `UserResearcher`, `FeaturePrioritizer`, `PRDWriter`, `RoadmapBuilder`, dan `FeedbackAnalyzer` di `src/agents/subagents/product/`. | [ ] |
| **4.4** | `EngineeringSubAgents`| Implementasikan spesialis `CodeReviewer`, `BugHunter`, `DocsWriter`, `InfraMonitor`, `TestGenerator`, dan `PRSummarizer` di `src/agents/subagents/engineering/`. | [ ] |
| **4.5** | `ProjectManagerSubAgents`| Implementasikan spesialis `TaskCoordinator`, `RiskAnalyzer`, `SprintPlanner`, `ProgressReporter`, dan `DeadlineWatcher` di `src/agents/subagents/pm/`. | [ ] |
| **4.6** | `SupportSubAgents` | Implementasikan spesialis `TicketClassifier`, `FAQResponder`, `EscalationRouter`, `CSATAnalyzer`, `KnowledgeBuilder`, dan `WABotHandler` di `src/agents/subagents/support/`. | [ ] |
| **4.7** | `FinalSystemVerification`| Jalankan `npm run check`, `bun test`, dan `npm run runtime:smoke` untuk memastikan tidak ada regresi pada sistem orkestrasi utama. | [ ] |
