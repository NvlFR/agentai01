# Requirements Document

## Introduction

Dokumen ini mendefinisikan requirements untuk **Marketing Agent** dalam AI Company. Marketing Agent bertanggung jawab membangun awareness, menghasilkan konten, mendukung positioning perusahaan, dan mengubah insight pasar menjadi materi yang membantu Sales Agent menutup lebih banyak klien.

Marketing Agent harus dapat bekerja kolaboratif dengan CEO Agent, Sales Agent, dan Product Agent dengan memanfaatkan arsitektur referensi di `restored-src/src/`.

Spec ini harus kompatibel dengan spec induk [ai-company-agents](/home/rny/work/2026/05-mei/agentai01/.kiro/specs/ai-company-agents/requirements.md), terutama pada loop dua arah Marketing_Agent ke Sales_Agent dan format `Agent_Message`.

---

## Glossary

- **Marketing_Agent**: AI agent yang mengelola konten, kampanye, dan positioning brand.
- **Content_Brief**: Arahan isi konten yang memuat tujuan, audiens, dan kanal distribusi.
- **Campaign**: Inisiatif pemasaran dengan objective, timeline, dan metrik keberhasilan.
- **Asset**: Artefak pemasaran seperti post, artikel, landing copy, atau case study.
- **Performance_Signal**: Metrik hasil kampanye atau konten.
- **Agent_Message**: Format pesan JSON terstruktur lintas agent yang didefinisikan di spec induk.

---

## Requirements

### Requirement 1: Perencanaan Konten dan Kampanye

**User Story:** Sebagai Owner, saya ingin Marketing_Agent merencanakan konten dan kampanye secara sistematis, sehingga pemasaran perusahaan tidak berjalan acak.

#### Acceptance Criteria

1. WHEN Owner memberikan objective pemasaran, THE Marketing_Agent SHALL menghasilkan rencana kampanye yang mencakup target audiens, pesan utama, kanal distribusi, timeline, dan metrik keberhasilan.
2. THE Marketing_Agent SHALL mendukung perencanaan konten minimal untuk kanal website, email, dan media sosial profesional.
3. IF objective terlalu luas, THEN THE Marketing_Agent SHALL memecahnya menjadi campaign yang lebih kecil dan terukur.
4. THE Marketing_Agent SHALL menyimpan setiap campaign plan beserta versinya.
5. THE Marketing_Agent SHALL menandai dependency pada asset lain seperti case study atau testimonial bila diperlukan.

### Requirement 2: Produksi Asset Marketing

**User Story:** Sebagai Owner, saya ingin Marketing_Agent menghasilkan draft materi pemasaran yang sesuai positioning perusahaan, sehingga saya bisa bergerak cepat tanpa menulis dari nol.

#### Acceptance Criteria

1. THE Marketing_Agent SHALL menghasilkan draft asset seperti artikel, landing page copy, email sequence, dan social post.
2. THE Marketing_Agent SHALL menyesuaikan tone of voice berdasarkan brand guideline yang dikonfigurasi Owner.
3. WHEN asset membahas solusi atau capability teknis, THE Marketing_Agent SHALL menggunakan input dari Product_Agent atau Engineering_Agent agar klaim tetap akurat.
4. THE Marketing_Agent SHALL menyertakan call-to-action yang sesuai dengan objective campaign.
5. THE Marketing_Agent SHALL menyimpan semua asset per campaign dan per versi.

### Requirement 3: Insight Pasar dan Positioning

**User Story:** Sebagai Owner, saya ingin Marketing_Agent membantu membaca pasar dan pesaing, sehingga pesan pemasaran kita lebih tajam.

#### Acceptance Criteria

1. THE Marketing_Agent SHALL dapat merangkum tren pasar dan kebutuhan umum perusahaan terkait adopsi AI agent.
2. THE Marketing_Agent SHALL menyusun positioning statement yang membedakan AI Company dari kompetitor.
3. WHEN insight pasar berubah signifikan, THE Marketing_Agent SHALL merekomendasikan update pada messaging utama.
4. THE Marketing_Agent SHALL dapat menghasilkan daftar pain point target market yang dapat dipakai Sales_Agent untuk outreach.
5. THE Marketing_Agent SHALL menyimpan hasil analisis pasar sebagai referensi untuk campaign berikutnya.

### Requirement 4: Kolaborasi dengan Sales Agent

**User Story:** Sebagai Sales_Agent, saya ingin menerima materi pemasaran yang siap pakai, sehingga proses prospecting dan nurturing menjadi lebih efektif.

#### Acceptance Criteria

1. WHEN Sales_Agent meminta asset tertentu, THE Marketing_Agent SHALL menghasilkan materi yang disesuaikan dengan segmen prospek.
2. THE Marketing_Agent SHALL dapat membuat one-pager value proposition, case-study summary, dan objection-handling copy.
3. IF Sales_Agent memberi feedback performa lapangan, THEN THE Marketing_Agent SHALL merevisi pesan pemasaran terkait.
4. THE Marketing_Agent SHALL mendukung pengiriman asset menggunakan format `Agent_Message`.
5. THE Marketing_Agent SHALL mencatat asset mana yang telah digunakan oleh Sales_Agent dan pada campaign mana.
6. WHEN campaign menghasilkan lead inbound, THEN Marketing_Agent SHALL meneruskan metadata lead ke Sales_Agent agar lead dapat masuk ke `Lifecycle_State: lead`.

### Requirement 5: Tooling dan Integrasi Arsitektur

**User Story:** Sebagai developer, saya ingin Marketing_Agent dibangun dengan pola tool yang konsisten, sehingga mudah diintegrasikan ke sistem agent perusahaan.

#### Acceptance Criteria

1. THE Marketing_Agent SHALL didefinisikan sebagai `AgentDefinition` valid dengan `agentType: "marketing"`.
2. THE Marketing_Agent SHALL memiliki tool minimal: `campaign_plan`, `content_write`, `market_research`, `asset_store`, dan `message_send`.
3. THE Marketing_Agent SHALL mengimplementasikan tool menggunakan pola `buildTool` dan validasi input yang sesuai.
4. WHEN Marketing_Agent menjalankan campaign yang memiliki pekerjaan bertahap, THE Marketing_Agent SHALL merepresentasikannya sebagai `Task` yang dapat dipantau.
5. THE Marketing_Agent SHALL mempertahankan arsip campaign, asset, dan insight pasar dalam penyimpanan persisten.
