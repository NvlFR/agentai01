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

> Fokus: Membangun fondasi struktur data hierarki, validasi Zod, dan registrasi sub-agen.

| Task ID | Nama Task | Deskripsi & Kontrak Implementasi | Status |
| :--- | :--- | :--- | :---: |
| **1.1** | `SubAgentHierarchyTypes` | Buat antarmuka `AgentHierarchyConfig` dan skema Zod `AgentHierarchyConfigSchema` di `src/domain/hierarchy.ts` untuk memvalidasi atribut `roleType`, `parentAgentId`, dan `subAgentIds`. | [ ] |
| **1.2** | `SubAgentRegistry` | Implementasikan class `SubAgentRegistry` di `src/registry/subAgentRegistry.ts` dengan metode pendaftaran, pencarian berdasarkan induk, dan validasi duplikasi ID. | [ ] |
| **1.3** | `SubAgentRegistryTest` | Buat pengujian colocated `src/registry/subAgentRegistry.test.ts` untuk memverifikasi pendaftaran hierarki dan penanganan error duplikasi. | [ ] |

---

## Phase 2 — Intra-Department Memory & Baton Passing Protocols

> Fokus: Mengimplementasikan mekanisme isolasi memori departemen dan protokol serah terima tugas (baton passing).

| Task ID | Nama Task | Deskripsi & Kontrak Implementasi | Status |
| :--- | :--- | :--- | :---: |
| **2.1** | `IntraDepartmentScratchpad`| Implementasikan `IntraDepartmentScratchpad` di `src/runtime/scratchpad.ts` sebagai antrean pesan terisolasi per departemen dengan batas TTL dan kapasitas. | [ ] |
| **2.2** | `BatonPassingProtocol` | Buat class `BatonPassingOrchestrator` di `src/runtime/batonPassing.ts` yang mengelola transisi status `delegate`, `pass`, dan `return` antar sub-agen. | [ ] |
| **2.3** | `BatonPassingTest` | Buat pengujian `src/runtime/batonPassing.test.ts` untuk mensimulasikan serah terima berantai dari `Lead Hunter` hingga `Promotion Agent`. | [ ] |

---

## Phase 3 — Marketing Department Sub-Agents Implementation

> Fokus: Membangun implementasi nyata sub-agen di bawah komando Marketing Agent.

| Task ID | Nama Task | Deskripsi & Kontrak Implementasi | Status |
| :--- | :--- | :--- | :---: |
| **3.1** | `LeadHunterAgent` | Implementasikan `LeadHunterSpecialist` di `src/agents/subagents/leadHunter.ts` dengan *binding* ke alat pemindai web dan direktori. | [ ] |
| **3.2** | `ContentAnalystAgent` | Implementasikan `ContentAnalystSpecialist` di `src/agents/subagents/contentAnalyst.ts` untuk analisis tren dan sentimen prospek. | [ ] |
| **3.3** | `ContentCreatorAgent` | Implementasikan `ContentCreatorSpecialist` di `src/agents/subagents/contentCreator.ts` untuk pembuatan *copywriting* dan aset visual. | [ ] |
| **3.4** | `PromotionAgent` | Implementasikan `PromotionSpecialist` di `src/agents/subagents/promotionAgent.ts` untuk distribusi pesan dan pelacakan balasan. | [ ] |
| **3.5** | `MarketingSubAgentsTest`| Buat pengujian integrasi `src/agents/subagents/marketingSubAgents.test.ts` untuk memvalidasi kolaborasi penuh departemen marketing. | [ ] |

---

## Phase 4 — Extension to Other Departments & Final Verification

> Fokus: Memperluas topologi ke departemen Sales, Product, Engineering, dan Project Manager, serta verifikasi akhir.

| Task ID | Nama Task | Deskripsi & Kontrak Implementasi | Status |
| :--- | :--- | :--- | :---: |
| **4.1** | `SalesSubAgents` | Implementasikan spesialis `LeadQualification`, `ProposalArchitect`, dan `ObjectionHandler` di `src/agents/subagents/sales/`. | [ ] |
| **4.2** | `ProductSubAgents` | Implementasikan spesialis `UserResearch`, `PRDScaffolder`, dan `UIUXConceptor` di `src/agents/subagents/product/`. | [ ] |
| **4.3** | `EngineeringSubAgents`| Implementasikan spesialis `CoderAgent`, `QAAgent`, `DevSecOpsAgent`, dan `DeploymentAgent` di `src/agents/subagents/engineering/`. | [ ] |
| **4.4** | `ProjectManagerSubAgents`| Implementasikan spesialis `SprintTracker`, `RiskAnalyst`, dan `ResourceAllocator` di `src/agents/subagents/pm/`. | [ ] |
| **4.5** | `FinalSystemVerification`| Jalankan `npm run check`, `bun test`, dan `npm run runtime:smoke` untuk memastikan tidak ada regresi pada sistem orkestrasi utama. | [ ] |
