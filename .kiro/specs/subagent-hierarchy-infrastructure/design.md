# Design Document — Sub-Agent Hierarchy Infrastructure

## Overview

Dokumen ini mendeskripsikan arsitektur dan desain teknis untuk implementasi **Hierarchical Sub-Agent Infrastructure (Tree of Agents)** pada platform `agentai01`. Arsitektur ini mengubah paradigma dari agen tunggal monolitik menjadi struktur organisasi otonom 4 tingkat (4-tier hierarchy) berbasis departemen.

Semua rancangan mematuhi prinsip: **Pemisahan wewenang yang tegas, isolasi konteks memori lokal, dan spesialisasi alat bantu (MCP tools) yang presisi.**

---

## Layer & Topology Architecture

```text
┌───────────────────────────────────────────────────────────────────────────┐
│              👑 OWNER (Human Operator / Mission Control)                  │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      │ (Strategic Directives & Approvals)
┌─────────────────────────────────────▼─────────────────────────────────────┐
│              👔 CEO AGENT (AI Agent Orchestrator / Leader)                │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      │ (OperatorEventBus / Dept Targets)
┌─────────────────────────────────────▼─────────────────────────────────────┐
│                 📢 MARKETING AGENT (Department Head)                      │
│                                     │                                     │
│     ┌───────────────────────────────┼───────────────────────────────┐     │
│     │ (Intra-Department Bus)        │                               │     │
│     ▼                               ▼                               ▼     │
│ ┌───────────────┐           ┌───────────────┐           ┌───────────────┐ │
│ │  Lead Hunter  │ ──Baton──►│Content Analyst│ ──Baton──►│Content Creator│ │
│ │  Agent (AI)   │           │  Agent (AI)   │           │  Agent (AI)   │ │
│ └───────────────┘           └───────────────┘           └───────────────┘ │
│     │ (web_search)              │ (seo_trends)              │ (dalle/fal) │
└─────┼───────────────────────────┼───────────────────────────┼─────────────┘
      ▼                           ▼                           ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                      MCP TOOLS & EXTERNAL BRIDGES                         │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## Komponen Arsitektur Utama

### 1. `SubAgentRegistry` & Ekstensi Metadata
Struktur data agen akan diperluas dengan antarmuka TypeScript baru untuk mendukung hierarki pohon 4 tingkat:

```typescript
export interface AgentHierarchyConfig {
  roleType: 'ceo' | 'head' | 'specialist';
  parentAgentId?: string;
  subAgentIds: string[];
  departmentName: string;
  allowedMcpTools: string[];
}
```

### 2. Mekanisme `IntraDepartmentScratchpad`
Untuk mencegah kebocoran informasi dan *spam* pada bus peristiwa utama perusahaan (`OperatorEventBus`), setiap departemen dibekali dengan `IntraDepartmentScratchpad`. Ini adalah penyimpanan memori sementara berbasis antrean pesan yang hanya dapat diakses oleh *Department Head* dan sub-agen di bawahnya.

### 3. Protokol `Baton Passing` (Oper Tongkat)
Alur kerja otonom antar sub-agen diatur melalui mesin status (state machine) serah terima tongkat:
1. `CEO Agent` menerima arahan strategis dari `Owner (Human)` dan merumuskan target tingkat departemen.
2. `Department Head` menerima target departemen dari `CEO Agent` dan memecahnya menjadi *sub-tasks*.
3. `Department Head` menyerahkan *baton* pertama ke sub-agen pertama (misal: `Lead Hunter`).
4. Setelah selesai, `Lead Hunter` melampirkan hasil temuannya ke dalam *scratchpad* dan menyerahkan *baton* ke `Content Analyst`.
5. Proses berlanjut hingga sub-agen terakhir (misal: `Promotion Agent`) mengembalikan *baton* ke `Department Head`.
6. `Department Head` menyusun laporan akhir ringkas dan mempublikasikannya ke `OperatorEventBus` utama untuk dievaluasi oleh `CEO Agent` dan `Owner`.

---

## Spesialisasi Sub-Agen & Alokasi MCP Tools

| Departemen | Sub-Agen Spesialis | Peran & Tanggung Jawab | MCP Tools yang Diizinkan |
| :--- | :--- | :--- | :--- |
| **Marketing** | `Lead Hunter Agent` | Memindai web dan direktori untuk prospek | `web_search`, `linkedin_scraper` |
| | `Content Analyst Agent` | Riset tren, SEO, dan sentimen prospek | `seo_trends`, `sentiment_analyzer` |
| | `Content Creator Agent` | Copywriting email, artikel, dan aset visual | `image_gen`, `doc_scaffolder` |
| | `Promotion Agent` | Distribusi kampanye dan pelacakan balasan | `email_outreach`, `crm_leads` |
| **Sales** | `Lead Qualification` | Verifikasi kecocokan anggaran dan BANT | `crm_leads`, `company_registry` |
| | `Proposal Architect` | Penyusunan draf penawaran komersial & ROI | `pricing_calc`, `doc_scaffolder` |
| | `Objection Handler` | Negosiasi harga dan penanganan keraguan | `contract_verifier`, `email_outreach` |
| **Engineering**| `Coder Agent` | Implementasi logika bisnis dan aplikasi | `fs_read`, `fs_write`, `ast_parser` |
| | `QA & Fuzzing Agent` | Pembuatan unit test dan pengujian otomatis | `bun_test_runner`, `fuzzer` |
| | `DevSecOps Agent` | Pemindaian kerentanan dan audit SAST | `sast_scanner`, `dep_auditor` |
| | `Deployment Agent` | Orkestrasi kontainer dan CI/CD cloud | `docker_mcp`, `cloud_deployer` |
