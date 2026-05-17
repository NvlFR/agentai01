# Design Document — Sub-Agent Hierarchy Infrastructure

## Overview

Dokumen ini mendeskripsikan arsitektur dan desain teknis untuk implementasi **Hierarchical Sub-Agent Infrastructure (Tree of Agents)** pada platform `agentai01`. Arsitektur ini mengubah paradigma dari agen tunggal monolitik menjadi struktur organisasi otonom 4 tingkat (4-tier hierarchy) berbasis departemen dan mematuhi spesifikasi detail di `.kiro/specs/detail-agent/`.

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
│ │Content Creator│ ──Baton──►│SEO Specialist │ ──Baton──►│Campaign Manager │
│ │  Agent (AI)   │           │  Agent (AI)   │           │   Agent (AI)    │ │
│ └───────────────┘           └───────────────┘           └───────────────┘ │
│     │ (canva_mcp)               │ (web_search)              │ (whatsapp_api)│
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
3. `Department Head` menyerahkan *baton* pertama ke sub-agen pertama (misal: `Content Creator`).
4. Setelah selesai, `Content Creator` melampirkan hasil temuannya ke dalam *scratchpad* dan menyerahkan *baton* ke `SEO Specialist`.
5. Proses berlanjut hingga sub-agen terakhir mengembalikan *baton* ke `Department Head`.
6. `Department Head` menyusun laporan akhir ringkas dan mempublikasikannya ke `OperatorEventBus` utama untuk dievaluasi oleh `CEO Agent` dan `Owner`.

---

## Spesialisasi Sub-Agen & Alokasi MCP Tools (Berdasarkan Detail Agent Specs)

| Departemen | Sub-Agen Spesialis | Peran & Tanggung Jawab | MCP Tools yang Diizinkan |
| :--- | :--- | :--- | :--- |
| **CEO Agent** | `Strategy Analyst` | Menganalisis strategi makro dan pergerakan kompetitor | `web_search`, `notion`, `google_sheets` |
| | `Report Summarizer` | Menyusun ringkasan eksekutif dari laporan departemen | `notion`, `slack`, `anthropic_api` |
| | `Decision Logger` | Mencatat rekam jejak keputusan strategis perusahaan | `notion`, `google_drive` |
| | `OKR Tracker` | Memantau pencapaian OKR seluruh departemen | `notion`, `google_sheets`, `slack` |
| **Marketing** | `Content Creator` | Penulisan caption, artikel blog, dan naskah kampanye | `canva_mcp`, `notion`, `google_drive` |
| | `SEO Specialist` | Riset kata kunci, audit artikel, dan strategi organik | `web_search`, `google_sheets` |
| | `Campaign Manager` | Merancang kampanye, WA blast, dan iklan berbayar | `whatsapp_api`, `google_sheets`, `gmail` |
| | `Analytics Reader` | Menganalisis performa mingguan dan metrik konversi | `google_sheets`, `web_search` |
| | `Social Scheduler` | Menjadwalkan dan mengantrekan konten ke kalender | `notion`, `google_calendar`, `slack` |
| | `Trend Watcher` | Memantau tren harian dan mencari peluang konten viral | `web_search`, `slack` |
| **Sales** | `Lead Qualifier` | Memverifikasi kecocokan anggaran, BANT, dan kelayakan | `web_search`, `google_sheets`, `gmail` |
| | `Proposal Generator` | Menyusun draf penawaran komersial dan kalkulasi harga | `google_sheets`, `google_drive`, `notion` |
| | `Follow-up Drafter` | Membuat draf pesan tindak lanjut dan email negosiasi | `gmail`, `slack`, `anthropic_api` |
| | `Pipeline Tracker` | Memantau pergerakan prospek di tahapan *sales pipeline* | `notion`, `google_sheets` |
| | `Competitor Watcher`| Menganalisis penawaran dan kelemahan harga kompetitor | `web_search`, `notion` |
| **Product** | `User Researcher` | Menganalisis masukan pengguna, *pain points*, dan ulasan | `web_search`, `google_sheets`, `notion` |
| | `Feature Prioritizer` | Mengevaluasi *backlog* dengan kerangka RICE/ICE | `notion`, `google_sheets` |
| | `PRD Writer` | Menulis dokumen PRD lengkap dengan referensi desain | `notion`, `google_drive`, `figma_mcp` |
| | `Roadmap Builder` | Menyusun dan memperbarui peta jalan jangka pendek-panjang | `notion`, `google_sheets`, `slack` |
| | `Feedback Analyzer` | Mengelompokkan tiket komplain dan masukan menjadi tema | `anthropic_api`, `google_sheets` |
| **Engineering**| `Code Reviewer` | Meninjau *pull request*, standar kode, dan keamanan | `github`, `bash_tool` |
| | `Bug Hunter` | Menganalisis laporan *bug*, *stack trace*, dan log | `github`, `bash_tool`, `web_search` |
| | `Docs Writer` | Menyusun dokumentasi teknis, API, dan arsitektur | `notion`, `github`, `google_drive` |
| | `Infra Monitor` | Memantau metrik server, *uptime*, dan penggunaan *cloud* | `slack`, `github`, `bash_tool` |
| | `Test Generator` | Membuat *unit test* dan skenario pengujian otomatis | `github`, `bash_tool`, `anthropic_api` |
| | `PR Summarizer` | Membuat ringkasan perubahan kode untuk *release notes* | `github`, `notion`, `slack` |
| **Project Manager**| `Task Coordinator` | Mengalokasikan tugas ke departemen dan melacak tiket | `notion`, `slack`, `github` |
| | `Risk Analyzer` | Mengidentifikasi potensi *blocker* dan risiko *sprint* | `github`, `notion`, `slack` |
| | `Sprint Planner` | Menyusun cakupan *sprint* dan alokasi kapasitas tim | `notion`, `google_calendar`, `google_sheets` |
| | `Progress Reporter` | Menyusun laporan kemajuan proyek mingguan untuk CEO | `notion`, `slack`, `gmail` |
| | `Deadline Watcher` | Memantau tenggat waktu dan memberikan pengingat otomatis | `slack`, `google_calendar`, `notion` |
| **Support** | `Ticket Classifier` | Mengklasifikasikan tiket masuk (bug/tanya) & prioritas | `notion`, `google_sheets`, `gmail` |
| | `FAQ Responder` | Menjawab pertanyaan umum berdasarkan basis pengetahuan | `notion`, `whatsapp_api`, `gmail` |
| | `Escalation Router` | Meneruskan masalah kritis ke Engineering atau PM | `slack`, `github`, `gmail` |
| | `CSAT Analyzer` | Menganalisis kepuasan pelanggan dan umpan balik layanan | `google_sheets`, `notion`, `anthropic_api` |
| | `Knowledge Builder` | Memperbarui artikel basis pengetahuan dari tiket selesai | `notion`, `google_drive` |
| | `WA Bot Handler` | Mengelola alur otomatisasi *chatbot* WhatsApp pelanggan | `whatsapp_api`, `notion` |
