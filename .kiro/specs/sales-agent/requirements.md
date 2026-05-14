# Requirements Document

## Introduction

Dokumen ini mendefinisikan requirements untuk **Sales Agent** dalam AI Company. Sales Agent bertugas mencari prospek, melakukan kualifikasi lead, menyusun proposal, menindaklanjuti percakapan, dan membantu Owner menutup kontrak untuk jasa pembuatan AI agent bagi perusahaan lain.

Sales Agent berjalan di atas pola arsitektur pada `restored-src/src/`, terutama pendekatan `AgentDefinition`, `Tool`, `Task`, dan `QueryEngine`, sehingga dapat berkolaborasi dengan CEO Agent, Product Agent, dan Project Manager Agent secara konsisten.

Spec ini harus kompatibel dengan spec induk [ai-company-agents](/home/rny/work/2026/05-mei/agentai01/.kiro/specs/ai-company-agents/requirements.md), terutama pada definisi `Lifecycle_State`, `Approval_Gate`, dan `Agent_Message` lintas agent.

---

## Glossary

- **Sales_Agent**: AI agent yang mengelola pipeline penjualan dari lead sampai deal.
- **Lead**: Calon klien yang berpotensi membeli jasa AI Company.
- **Qualified_Lead**: Lead yang telah memenuhi kriteria minimum untuk masuk tahap proposal.
- **Discovery_Call**: Sesi penggalian kebutuhan bisnis awal sebelum proses scoping teknis.
- **Proposal**: Dokumen penawaran jasa yang memuat ruang lingkup, estimasi, timeline, dan harga.
- **Pipeline_Stage**: Tahap penjualan seperti `new`, `contacted`, `qualified`, `proposal_sent`, `negotiation`, `won`, `lost`.
- **Handoff**: Transfer konteks lead yang menang dari Sales_Agent ke Product_Agent.
- **Lifecycle_State**: State global di spec induk yang minimal mencakup `lead`, `qualified`, `proposal`, dan `won` pada fase sales.
- **Agent_Message**: Format pesan JSON terstruktur lintas agent yang didefinisikan di spec induk.

---

## Requirements

### Requirement 1: Lead Intake dan Kualifikasi

**User Story:** Sebagai Owner, saya ingin Sales_Agent dapat menerima dan mengkualifikasi lead secara terstruktur, sehingga saya fokus pada peluang yang paling berpotensi menghasilkan revenue.

#### Acceptance Criteria

1. WHEN Owner menambahkan lead baru ke Sales_Agent, THE Sales_Agent SHALL menyimpan data minimal: nama perusahaan, kontak utama, industri, sumber lead, dan kebutuhan awal.
2. THE Sales_Agent SHALL mengevaluasi setiap lead menggunakan skor kualifikasi yang mencakup urgency, budget fit, authority, dan use-case relevance.
3. WHEN lead belum memiliki informasi yang cukup, THE Sales_Agent SHALL menghasilkan daftar pertanyaan klarifikasi yang siap dikirim ke calon klien.
4. IF skor kualifikasi lead berada di bawah threshold yang dikonfigurasi, THEN THE Sales_Agent SHALL menandai lead sebagai `low_priority` dan memberikan alasan.
5. THE Sales_Agent SHALL mendukung pembaruan `Pipeline_Stage` untuk setiap lead dan menyimpan riwayat perubahan tahap.
6. THE Sales_Agent SHALL menyelaraskan perubahan `Pipeline_Stage` ke `Lifecycle_State` global dengan aturan minimum: `new/contacted` ke `lead`, `qualified` ke `qualified`, `proposal_sent/negotiation` ke `proposal`, dan `won` ke `won`.

### Requirement 2: Outreach dan Follow-Up

**User Story:** Sebagai Owner, saya ingin Sales_Agent dapat menyiapkan outreach dan follow-up yang relevan, sehingga proses penjualan berjalan konsisten tanpa harus saya tulis manual.

#### Acceptance Criteria

1. THE Sales_Agent SHALL menghasilkan draft pesan outreach yang dipersonalisasi berdasarkan industri lead, masalah bisnis, dan value proposition AI Company.
2. WHEN lead tidak merespons dalam periode follow-up yang ditentukan, THE Sales_Agent SHALL menyarankan pesan follow-up berikutnya beserta waktu pengiriman yang direkomendasikan.
3. THE Sales_Agent SHALL mendukung sequence minimal tiga langkah untuk outreach: kontak awal, follow-up nilai tambah, dan penutupan loop.
4. IF Owner menandai gaya komunikasi tertentu sebagai preferensi, THEN THE Sales_Agent SHALL menyesuaikan nada dan struktur pesan berikutnya.
5. THE Sales_Agent SHALL menyimpan semua draft outreach dan follow-up dalam timeline lead untuk audit.

### Requirement 3: Proposal dan Estimasi Awal

**User Story:** Sebagai Owner, saya ingin Sales_Agent dapat menyiapkan proposal awal yang masuk akal, sehingga proses menuju closing menjadi lebih cepat.

#### Acceptance Criteria

1. WHEN lead telah masuk tahap `qualified`, THE Sales_Agent SHALL menghasilkan draft proposal yang memuat ringkasan kebutuhan, outcome bisnis, ruang lingkup awal, estimasi timeline, dan kisaran harga.
2. THE Sales_Agent SHALL menyertakan asumsi yang digunakan dalam proposal dan menandai item yang masih membutuhkan validasi Product_Agent dengan tag `[NEEDS_SCOPING]`.
3. WHEN Owner meminta revisi proposal, THE Sales_Agent SHALL membuat versi baru tanpa menghapus versi sebelumnya.
4. THE Sales_Agent SHALL menyimpan proposal dengan format `{lead_id}/proposal-v{version}.md`.
5. IF proposal dikirim ke klien, THEN THE Sales_Agent SHALL memperbarui `Pipeline_Stage` menjadi `proposal_sent` dan mencatat timestamp pengiriman.
6. THE Sales_Agent SHALL mengajukan Approval_Gate kepada Owner sebelum proposal final dikirim ke klien.

### Requirement 4: Handoff ke Product Agent

**User Story:** Sebagai Product_Agent, saya ingin menerima konteks lead yang sudah rapi dari Sales_Agent, sehingga discovery teknis bisa dimulai tanpa mengulang pengumpulan informasi dasar.

#### Acceptance Criteria

1. WHEN lead berubah menjadi `won` atau disetujui masuk tahap discovery berbayar, THE Sales_Agent SHALL menginisiasi Handoff ke Product_Agent dan memberi notifikasi ke Project_Manager_Agent.
2. THE Sales_Agent SHALL menyertakan dalam Handoff: ringkasan bisnis klien, pain points, stakeholder utama, catatan percakapan, proposal terakhir, dan risiko komersial.
3. THE Sales_Agent SHALL menggunakan format `Agent_Message` terstruktur dengan field minimal: `from`, `to`, `lead_id`, `project_id`, `message_type`, dan `payload`.
4. THE Sales_Agent SHALL menggunakan `message_type: "lead_handoff"` untuk handoff ke Product_Agent.
5. WHEN Product_Agent mengonfirmasi penerimaan Handoff, THE Sales_Agent SHALL menandai lead sebagai `handoff_completed`.
6. IF Handoff gagal, THEN THE Sales_Agent SHALL mengeskalasi ke CEO_Agent atau Owner dengan konteks error.

### Requirement 5: Tooling dan Integrasi Arsitektur

**User Story:** Sebagai developer, saya ingin Sales_Agent mengikuti pola tool dan agent definition yang sama dengan sistem referensi, sehingga mudah diintegrasikan dengan agent lain.

#### Acceptance Criteria

1. THE Sales_Agent SHALL didefinisikan sebagai `AgentDefinition` valid dengan `agentType: "sales"`, `description`, `tools`, dan `systemPrompt`.
2. THE Sales_Agent SHALL memiliki tool minimal: `lead_capture`, `lead_score`, `proposal_write`, `message_send`, dan `pipeline_update`.
3. THE Sales_Agent SHALL mengimplementasikan setiap tool menggunakan pola `buildTool` yang konsisten dengan codebase referensi.
4. WHEN Sales_Agent menjalankan pekerjaan asinkron seperti follow-up terjadwal, THE Sales_Agent SHALL membuat `Task` yang dapat dipantau statusnya.
5. THE Sales_Agent SHALL menyimpan state pipeline dan artefak proposal secara persisten agar dapat dipulihkan setelah restart sistem.
